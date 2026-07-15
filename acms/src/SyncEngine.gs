/**
 * ACMS — SyncEngine.gs
 * Pulls Gmail thread activity into the Communications register (FR-1x, FR-2x).
 * Reads metadata only (never message bodies — D2). Watermarked, paginated,
 * resumable, idempotent. Derivations delegated to the pure Core layer.
 *
 * Uses GmailApp + SpreadsheetApp + PropertiesService. On-platform only.
 */

var MAX_RUNTIME_MS = 4.5 * 60 * 1000; // stay well under the ~6 min quota (C5)

/** Entry point (menu "Sync now" + time trigger). */
function syncNow() {
  var started = new Date().getTime();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = { run_at: new Date(), threads_scanned: 0, rows_added: 0, rows_updated: 0, batch_cursor: 0, watermark_after: '', errors: '' };

  try {
    var own = parseCsv_(getConfig_('own_addresses'));
    if (own.length === 0) {
      throw new Error('Config own_addresses is empty — refusing to sync (last_sender/ball_in_court would be wrong). Fill it first (E3).');
    }

    var afterSec = computeAfterSeconds_();
    var query = buildQuery_(afterSec);
    log.watermark_after = new Date(afterSec * 1000);

    // Load the Communications sheet once; build an index by thread_id.
    var comm = getSheetData_(SHEETS.COMMUNICATIONS);
    var index = buildIndex_(comm.header, comm.rows, 'thread_id');

    var props = PropertiesService.getScriptProperties();
    var cursor = parseInt(props.getProperty(PROP_KEYS.BATCH_CURSOR) || '0', 10);
    var batchSize = parseInt(getConfig_('batch_size'), 10) || 200;
    var seen = {};
    var newestSec = afterSec;

    // Paginate the search from the persisted cursor, respecting the time budget.
    while (new Date().getTime() - started < MAX_RUNTIME_MS) {
      var threads = GmailApp.search(query, cursor, batchSize);
      if (threads.length === 0) break;

      for (var i = 0; i < threads.length; i++) {
        var t = threads[i];
        seen[t.getId()] = true;
        var derived = deriveFromGmailThread_(t, own);
        var lastSec = Math.floor(new Date(derived.last_msg_date).getTime() / 1000);
        if (lastSec > newestSec) newestSec = lastSec;
        var result = upsertRow_(comm, index, derived);
        log.threads_scanned++;
        if (result === 'added') log.rows_added++;
        else if (result === 'updated') log.rows_updated++;
      }

      cursor += threads.length;
      log.batch_cursor = cursor;
      // Checkpoint the cursor so a mid-run stop resumes cleanly (N3/E8).
      props.setProperty(PROP_KEYS.BATCH_CURSOR, String(cursor));
      if (threads.length < batchSize) { cursor = 0; break; } // exhausted this pass
    }

    // If we finished the search this pass, reset the cursor and advance watermark.
    if (cursor === 0) {
      props.deleteProperty(PROP_KEYS.BATCH_CURSOR);
      props.setProperty(PROP_KEYS.WATERMARK, String(newestSec * 1000));
      props.setProperty(PROP_KEYS.BACKFILL_DONE, '1');
      flagMissingRecent_(comm, index, seen, afterSec); // E4
    }

    updateIssueLastComm_(comm); // FR-15
    writeSyncLog_(log);
    ss.toast('Sync complete: +' + log.rows_added + ' new, ' + log.rows_updated + ' updated.', 'ACMS', 6);
  } catch (err) {
    log.errors = String(err && err.stack ? err.stack : err);
    writeSyncLog_(log); // errors never silently swallowed (FR-16)
    SpreadsheetApp.getActiveSpreadsheet().toast('Sync error — see SyncLog tab.', 'ACMS', 8);
    throw err;
  }
}

/** after: floor = max(watermark - overlap, today - backfill_days). Epoch seconds. */
function computeAfterSeconds_() {
  var props = PropertiesService.getScriptProperties();
  var overlapMs = (parseInt(getConfig_('sync_overlap_minutes'), 10) || 60) * 60 * 1000;
  var backfillMs = (parseInt(getConfig_('backfill_days'), 10) || 14) * 24 * 60 * 60 * 1000;
  var now = new Date().getTime();
  var backfillFloor = now - backfillMs;
  var wm = props.getProperty(PROP_KEYS.WATERMARK);
  var floor;
  if (wm) floor = Math.max(parseInt(wm, 10) - overlapMs, backfillFloor);
  else floor = backfillFloor; // first run
  return Math.floor(floor / 1000);
}

/** Build the Gmail search query (FR-13): exclude spam/trash + ignore_labels. */
function buildQuery_(afterSec) {
  var parts = ['-in:spam', '-in:trash', 'after:' + afterSec];
  parseCsv_(getConfig_('ignore_labels')).forEach(function (lbl) {
    parts.push('-label:' + lbl.replace(/\s+/g, '-'));
  });
  return parts.join(' ');
}

/** Convert a GmailThread into the derived row object via Core (metadata only). */
function deriveFromGmailThread_(thread, own) {
  var msgs = thread.getMessages().map(function (m) {
    return {
      id: m.getId(),
      from: m.getFrom(),
      to: splitAddrs_(m.getTo()),
      cc: splitAddrs_(m.getCc()),
      bcc: splitAddrs_(m.getBcc()),
      date: m.getDate(),
      hasAttachments: m.getAttachments({ includeInlineImages: false, includeAttachments: true }).length > 0,
      attachmentNames: m.getAttachments({ includeInlineImages: false, includeAttachments: true }).map(function (a) { return a.getName(); })
    };
  });
  return deriveThreadFields({ threadId: thread.getId(), subject: thread.getFirstMessageSubject(), messages: msgs }, own);
}

/** Insert or update a Communications row by thread_id; returns 'added'|'updated'|'nochange'. */
function upsertRow_(comm, index, derived) {
  var header = comm.header;
  var existingRowNum = index[derived.thread_id];

  if (existingRowNum === undefined) {
    // New thread → new row with default tags + suggestion (FR-12).
    var friendly = friendlyId(nextFriendlySeq_(comm));
    var suggestion = computeSuggestion_(derived);
    var obj = objDefaultsForNew_(derived, friendly, suggestion);
    var row = objToRow_(header, obj);
    comm.sheet.appendRow(row);
    var newRowNum = comm.sheet.getLastRow();
    setDaysFormula_(comm.sheet, header, newRowNum); // live overdue counter
    index[derived.thread_id] = newRowNum;
    comm.rows.push(row);
    return 'added';
  }

  // Existing thread → pure decision (FR-14/FR-17/FR-23), tested in Core.
  var rowValues = comm.sheet.getRange(existingRowNum, 1, 1, header.length).getValues()[0];
  var existing = rowToObj_(header, rowValues);
  var decision = computeUpdatedRow(existing, derived, PROTECTABLE_FIELDS, HUMAN_OWNED_FIELDS);
  var merged = decision.row;

  var newRow = objToRow_(header, merged);
  if (JSON.stringify(newRow) === JSON.stringify(rowValues)) return 'nochange'; // FR-17
  comm.sheet.getRange(existingRowNum, 1, 1, header.length).setValues([newRow]);
  setDaysFormula_(comm.sheet, header, existingRowNum);
  return 'updated';
}

/** A1 column letter for a 1-based column index (sufficient for < 27 columns). */
function colLetter_(colIndex1) {
  var s = '';
  while (colIndex1 > 0) { var r = (colIndex1 - 1) % 26; s = String.fromCharCode(65 + r) + s; colIndex1 = (colIndex1 - r - 1) / 26; }
  return s;
}

/** Write the live days-since-last formula into a row (drives overdue flags). */
function setDaysFormula_(sheet, header, rowNum) {
  var lastCol = header.indexOf('last_msg_date') + 1;
  var daysCol = header.indexOf('days_since_last') + 1;
  var L = colLetter_(lastCol);
  sheet.getRange(rowNum, daysCol).setFormula('=IF(' + L + rowNum + '="","",INT(NOW()-' + L + rowNum + '))');
}

/** Default field set for a brand-new Communications row (FR-12). */
function objDefaultsForNew_(derived, friendly, suggestion) {
  var obj = {};
  COLUMNS.COMMUNICATIONS.forEach(function (c) { obj[c] = derived[c] !== undefined ? derived[c] : ''; });
  obj.friendly_id = friendly;
  obj.comm_type = 'Untagged';
  obj.status = 'Open';
  obj.priority = 'Normal';
  obj.draft_pending = false;
  obj.thread_missing = false;
  obj.reopened = false;
  obj.override_flags = '';
  obj.suggested_assessment = suggestion.suggested;
  // Auto-apply an unambiguous subject-tag match; otherwise leave for triage.
  if (suggestion.source === 'subject' && suggestion.suggested) obj.assessment_id = suggestion.suggested;
  else obj.assessment_id = '';
  obj.days_since_last = '';
  return obj;
}

/** Compute suggestion for a thread using Contacts_Map + active assessments (§6.5). */
function computeSuggestion_(derived) {
  var contacts = getSheetData_(SHEETS.CONTACTS);
  var contactRows = contacts.rows.map(function (r) { return rowToObj_(contacts.header, r); });
  var asmt = getSheetData_(SHEETS.ASSESSMENTS);
  var activeIds = asmt.rows.map(function (r) { return rowToObj_(asmt.header, r); })
    .filter(function (o) { return o.status === 'Active'; })
    .map(function (o) { return o.assessment_id; });
  var counterparties = String(derived.counterparties || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  return suggestAssessment({ subject: derived.subject, counterparties: counterparties }, contactRows, activeIds);
}

/** Flag rows in the recent window that were NOT seen this run and no longer exist (E4). */
function flagMissingRecent_(comm, index, seen, afterSec) {
  var header = comm.header;
  var tiCol = header.indexOf('thread_id');
  var lmCol = header.indexOf('last_msg_date');
  var tmCol = header.indexOf('thread_missing');
  for (var r = 0; r < comm.rows.length; r++) {
    var id = comm.rows[r][tiCol];
    if (!id || seen[id]) continue;
    var lm = comm.rows[r][lmCol];
    if (!lm) continue;
    if (new Date(lm).getTime() / 1000 < afterSec) continue; // outside window, skip (quota)
    if (comm.rows[r][tmCol] === true) continue;
    if (GmailApp.getThreadById(id) === null) {
      comm.sheet.getRange(r + 2, tmCol + 1).setValue(true);
    }
  }
}

/** Update Issues_Risks.last_comm_date from linked communications (FR-15). */
function updateIssueLastComm_(comm) {
  var header = comm.header;
  var issueCol = header.indexOf('issue_id');
  var lastCol = header.indexOf('last_msg_date');
  var latest = {};
  comm.rows.forEach(function (row) {
    var iss = row[issueCol];
    if (!iss) return;
    var d = new Date(row[lastCol]).getTime();
    if (!latest[iss] || d > latest[iss]) latest[iss] = d;
  });
  var iss = getSheetData_(SHEETS.ISSUES);
  var idCol = iss.header.indexOf('issue_id');
  var lcCol = iss.header.indexOf('last_comm_date');
  for (var r = 0; r < iss.rows.length; r++) {
    var id = iss.rows[r][idCol];
    if (latest[id]) iss.sheet.getRange(r + 2, lcCol + 1).setValue(new Date(latest[id]));
  }
}

// ---- generic sheet helpers (shared across engines) --------------------------

function getSheetData_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  var values = sheet.getDataRange().getValues();
  var header = values.shift();
  return { sheet: sheet, header: header, rows: values };
}
function buildIndex_(header, rows, keyField) {
  var kc = header.indexOf(keyField);
  var idx = {};
  for (var r = 0; r < rows.length; r++) if (rows[r][kc] !== '') idx[rows[r][kc]] = r + 2; // 1-based + header
  return idx;
}
function rowToObj_(header, row) { var o = {}; for (var i = 0; i < header.length; i++) o[header[i]] = row[i]; return o; }
function objToRow_(header, obj) { return header.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; }); }
function nextFriendlySeq_(comm) {
  var fc = comm.header.indexOf('friendly_id');
  var max = 0;
  comm.rows.forEach(function (row) {
    var m = String(row[fc] || '').match(/C-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max + 1;
}
function writeSyncLog_(log) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SYNC_LOG);
  sh.appendRow(COLUMNS.SYNC_LOG.map(function (c) { return log[c] !== undefined ? log[c] : ''; }));
}
function parseCsv_(v) { return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
function splitAddrs_(headerVal) { return parseCsv_(headerVal); }

/** Install the 30-minute sync trigger (menu action, PRD §5). */
function installSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncNow') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncNow').timeBased().everyMinutes(30).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Sync trigger installed (every 30 min).', 'ACMS', 6);
}
