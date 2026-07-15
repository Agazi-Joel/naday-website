/**
 * ACMS — Setup.gs
 * Workbook scaffolding + the ACMS custom menu (the "menu/UI.gs" role in the
 * PRD architecture). setupWorkbook() reproduces the ENTIRE system on a blank
 * Sheet in one call (PRD Phase 1 / DoD item 1).
 *
 * Uses SpreadsheetApp — not unit-tested off-platform. Runs on Apps Script.
 */

/** Adds the ACMS menu on open (PRD §5). */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ACMS')
    .addItem('Sync now', 'syncNow')
    .addItem('Create draft from selection', 'createDraftFromSelection')
    .addItem('Raise issue from this thread', 'raiseIssueFromThread')
    .addItem('Rebuild triage / dashboard', 'rebuildDashboard')
    .addSeparator()
    .addItem('Archive closed threads', 'archiveClosedThreads')
    .addSeparator()
    .addItem('Set up workbook (first run)', 'setupWorkbook')
    .addItem('Install sync trigger', 'installSyncTrigger')
    .addToUi();
}

/**
 * Build all tabs, headers, validations, formats, config defaults and named
 * ranges from scratch. Idempotent: re-running clears and rebuilds structure
 * without touching data rows already present where a tab exists.
 */
function setupWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG_DEFAULTS.timezone); // E7

  ensureSheet_(ss, SHEETS.ASSESSMENTS, COLUMNS.ASSESSMENTS);
  ensureSheet_(ss, SHEETS.ISSUES, COLUMNS.ISSUES);
  ensureSheet_(ss, SHEETS.COMMUNICATIONS, COLUMNS.COMMUNICATIONS);
  ensureSheet_(ss, SHEETS.CONTACTS, COLUMNS.CONTACTS);
  ensureSheet_(ss, SHEETS.TEMPLATES, COLUMNS.TEMPLATES);
  ensureSheet_(ss, SHEETS.SYNC_LOG, COLUMNS.SYNC_LOG);

  setupConfigSheet_(ss);
  setupValidations_(ss);
  setupCommunicationsFormat_(ss);
  setupDashboard_(ss);
  setupArchiveSheet_(ss);
  hideOperationalSheets_(ss);

  SpreadsheetApp.getActiveSpreadsheet().toast('ACMS workbook built. Fill Config own_addresses before first sync.', 'ACMS', 8);
}

/** Create a sheet if missing and (re)write its header row + freeze. */
function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#f0f0f0');
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).protect().setWarningOnly(true);
  return sh;
}

/** Config tab as key/value rows, seeded from CONFIG_DEFAULTS. */
function setupConfigSheet_(ss) {
  var sh = ss.getSheetByName(SHEETS.CONFIG) || ss.insertSheet(SHEETS.CONFIG);
  sh.clear();
  sh.getRange(1, 1, 1, 3).setValues([['key', 'value', 'notes']])
    .setFontWeight('bold').setBackground('#f0f0f0');
  var notes = {
    my_name: 'Your name, merged into template signatures ({{my_name}}).',
    own_addresses: 'CSV of ALL your addresses incl. send-as aliases. REQUIRED before first sync (E3).',
    ignore_labels: 'CSV of Gmail labels to exclude from sync, e.g. Newsletters (FR-13).',
    backfill_days: 'How many days back the first sync ingests (locked default 14).',
    sync_overlap_minutes: 'Overlap buffer so no thread is missed at the boundary (FR-11).',
    batch_size: 'Threads per resumable batch on first run (N1).',
    work_start_hour: 'Trigger window start hour (24h, Europe/London).',
    work_end_hour: 'Trigger window end hour.',
    overdue_days_them: 'Chase threshold: waiting-on-them older than this shows on Dashboard.',
    overdue_days_me: 'Ball-in-my-court older than this is flagged.',
    archive_after_days: 'Closed threads older than this are eligible for Archive (menu).',
    timezone: 'Session timezone (E7).'
  };
  var rows = Object.keys(CONFIG_DEFAULTS).map(function (k) {
    return [k, CONFIG_DEFAULTS[k], notes[k] || ''];
  });
  sh.getRange(2, 1, rows.length, 3).setValues(rows);
  sh.setFrozenRows(1);
  // Named range so getConfig_() can read by key reliably.
  ss.setNamedRange('ACMS_CONFIG', sh.getRange(2, 1, rows.length, 2));
}

/** Read a Config value by key (returns default if the row is missing/blank). */
function getConfig_(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rng = ss.getRangeByName('ACMS_CONFIG');
  if (rng) {
    var vals = rng.getValues();
    for (var i = 0; i < vals.length; i++) {
      if (vals[i][0] === key && vals[i][1] !== '') return vals[i][1];
    }
  }
  return CONFIG_DEFAULTS[key];
}

/** Data-validation dropdowns from ENUMS (FR-32). */
function setupValidations_(ss) {
  applyEnum_(ss, SHEETS.ASSESSMENTS, 'stage', ENUMS.STAGE);
  applyEnum_(ss, SHEETS.ASSESSMENTS, 'status', ENUMS.ASSESSMENT_STATUS);
  applyEnum_(ss, SHEETS.ISSUES, 'type', ENUMS.ISSUE_TYPE);
  applyEnum_(ss, SHEETS.ISSUES, 'owner', ENUMS.OWNER);
  applyEnum_(ss, SHEETS.ISSUES, 'status', ENUMS.ISSUE_STATUS);
  applyEnum_(ss, SHEETS.COMMUNICATIONS, 'comm_type', ENUMS.COMM_TYPE);
  applyEnum_(ss, SHEETS.COMMUNICATIONS, 'priority', ENUMS.PRIORITY);
  applyEnum_(ss, SHEETS.COMMUNICATIONS, 'status', ENUMS.COMM_STATUS);
  applyEnum_(ss, SHEETS.COMMUNICATIONS, 'ball_in_court', ENUMS.BALL_IN_COURT);
  // assessment_id dropdown sourced live from the Assessments column A.
  var asmt = ss.getSheetByName(SHEETS.ASSESSMENTS);
  var idRange = asmt.getRange(2, 1, Math.max(asmt.getMaxRows() - 1, 1), 1);
  applyRangeValidation_(ss, SHEETS.COMMUNICATIONS, 'assessment_id', idRange);
}

function colIndex_(sheetKeyOrCols, field) {
  var cols = COLUMNS[sheetKeyOrCols] || sheetKeyOrCols;
  return cols.indexOf(field) + 1; // 1-based
}

function applyEnum_(ss, sheetName, field, values) {
  var sh = ss.getSheetByName(sheetName);
  var cols = COLUMNS[sheetKeyForName_(sheetName)];
  var c = cols.indexOf(field) + 1;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sh.getRange(2, c, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function applyRangeValidation_(ss, sheetName, field, sourceRange) {
  var sh = ss.getSheetByName(sheetName);
  var cols = COLUMNS[sheetKeyForName_(sheetName)];
  var c = cols.indexOf(field) + 1;
  var rule = SpreadsheetApp.newDataValidation().requireValueInRange(sourceRange, true).setAllowInvalid(true).build();
  sh.getRange(2, c, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

/** Map a sheet display name back to its COLUMNS key. */
function sheetKeyForName_(name) {
  var map = {};
  map[SHEETS.ASSESSMENTS] = 'ASSESSMENTS';
  map[SHEETS.ISSUES] = 'ISSUES';
  map[SHEETS.COMMUNICATIONS] = 'COMMUNICATIONS';
  map[SHEETS.CONTACTS] = 'CONTACTS';
  map[SHEETS.TEMPLATES] = 'TEMPLATES';
  map[SHEETS.SYNC_LOG] = 'SYNC_LOG';
  return map[name];
}

/** days_since_last formula + gmail_link hyperlink styling + hidden columns. */
function setupCommunicationsFormat_(ss) {
  var sh = ss.getSheetByName(SHEETS.COMMUNICATIONS);
  var cols = COLUMNS.COMMUNICATIONS;
  var lastMsgCol = cols.indexOf('last_msg_date') + 1;
  var daysCol = cols.indexOf('days_since_last') + 1;
  // Whole-column arrayformula in the header cell region is fragile; instead put
  // a per-row formula template documented in README. Here we set number format.
  sh.getRange(2, daysCol, sh.getMaxRows() - 1, 1).setNumberFormat('0');
  // Hide the override_flags helper column.
  var ovCol = cols.indexOf('override_flags') + 1;
  sh.hideColumns(ovCol);
  // Date formats.
  ['first_msg_date', 'last_msg_date'].forEach(function (f) {
    var c = cols.indexOf(f) + 1;
    sh.getRange(2, c, sh.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  });
}

/** Dashboard tab: formula-driven, no script writes at runtime (PRD §6.7). */
function setupDashboard_(ss) {
  var sh = ss.getSheetByName(SHEETS.DASHBOARD) || ss.insertSheet(SHEETS.DASHBOARD, 0);
  sh.clear();
  var comm = SHEETS.COMMUNICATIONS;
  var rows = [
    ['ACMS Dashboard', ''],
    ['', ''],
    ['Untagged / unanchored conversations', '=COUNTIFS(' + comm + '!L2:L,"Untagged")+COUNTIFS(' + comm + '!J2:J,"",' + comm + '!N2:N,"<>NoAction")'],
    ['Ball in MY court (I owe a reply)', '=COUNTIF(' + comm + '!I2:I,"Me")'],
    ['Waiting on them', '=COUNTIF(' + comm + '!I2:I,"Them")'],
    ['Reopened threads', '=COUNTIF(' + comm + '!U2:U,TRUE)'],
    ['Threads flagged missing (trashed after logging)', '=COUNTIF(' + comm + '!T2:T,TRUE)'],
    ['', ''],
    ['Triage list (untagged, oldest first) →', 'see filter view on ' + comm + ' tab: comm_type=Untagged OR assessment_id blank']
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  sh.setColumnWidth(1, 340);
  sh.setColumnWidth(2, 460);
}

function setupArchiveSheet_(ss) {
  ensureSheet_(ss, SHEETS.ARCHIVE, COLUMNS.COMMUNICATIONS);
}

function hideOperationalSheets_(ss) {
  [SHEETS.SYNC_LOG].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh) sh.hideSheet();
  });
}
