/**
 * ACMS — Triage.gs
 * onEdit guardrails (FR-33/34), override capture (FR-14), dependent issue
 * dropdown (FR-32), dashboard rebuild, and the archive action (§6.7/S6).
 *
 * onEdit is a simple trigger — it runs on every user edit automatically.
 */

/** Simple trigger: fires on every manual edit. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== SHEETS.COMMUNICATIONS) return;
    if (e.range.getRow() < 2) return;

    var header = COLUMNS.COMMUNICATIONS;
    var editedCol = e.range.getColumn();
    var field = header[editedCol - 1];
    var rowNum = e.range.getRow();

    // (1) Capture hand-edits of derived fields into override_flags (FR-14).
    if (PROTECTABLE_FIELDS.indexOf(field) !== -1) {
      recordOverride_(sheet, header, rowNum, field);
    }

    // (2) Anchor rule: comm_type set but no assessment_id, unless NoAction (FR-33/34).
    if (field === 'comm_type' || field === 'assessment_id' || field === 'status') {
      enforceAnchor_(sheet, header, rowNum);
    }

    // (3) Dependent issue_id dropdown filtered by the chosen assessment (FR-32).
    if (field === 'assessment_id') {
      applyIssueDropdown_(sheet, header, rowNum, e.range.getValue());
    }
  } catch (err) {
    // A failing simple trigger must not block the user's edit; surface quietly.
    SpreadsheetApp.getActiveSpreadsheet().toast('Triage check error: ' + err, 'ACMS', 5);
  }
}

/** Append a field name to the row's override_flags cell (dedup). */
function recordOverride_(sheet, header, rowNum, field) {
  var c = header.indexOf('override_flags') + 1;
  var cell = sheet.getRange(rowNum, c);
  var current = String(cell.getValue() || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (current.indexOf(field) === -1) { current.push(field); cell.setValue(current.join(',')); }
}

/** FR-33/34: type requires an anchor; NoAction status exempts non-case mail. */
function enforceAnchor_(sheet, header, rowNum) {
  var typeC = header.indexOf('comm_type') + 1;
  var asmtC = header.indexOf('assessment_id') + 1;
  var statusC = header.indexOf('status') + 1;
  var type = sheet.getRange(rowNum, typeC).getValue();
  var asmt = sheet.getRange(rowNum, asmtC).getValue();
  var status = sheet.getRange(rowNum, statusC).getValue();

  var cell = sheet.getRange(rowNum, typeC);
  if (type && type !== 'Untagged' && !asmt && status !== 'NoAction') {
    cell.setNote(ANCHOR_WARNING);
    SpreadsheetApp.getActiveSpreadsheet().toast(ANCHOR_WARNING, 'ACMS', 6);
  } else {
    cell.clearNote();
  }
}

/** Set a per-cell validation on issue_id listing only that assessment's issues. */
function applyIssueDropdown_(sheet, header, rowNum, assessmentId) {
  var issueC = header.indexOf('issue_id') + 1;
  var cell = sheet.getRange(rowNum, issueC);
  if (!assessmentId) { cell.clearDataValidations(); return; }
  var iss = getSheetData_(SHEETS.ISSUES);
  var aCol = iss.header.indexOf('assessment_id');
  var idCol = iss.header.indexOf('issue_id');
  var ids = iss.rows.filter(function (r) { return r[aCol] === assessmentId; }).map(function (r) { return r[idCol]; });
  if (ids.length === 0) { cell.clearDataValidations(); return; }
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(ids, true).setAllowInvalid(true).build();
  cell.setDataValidation(rule);
}

/** Menu: refresh the Dashboard block (formula-driven; also re-hides op sheets). */
function rebuildDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupDashboard_(ss);
  ss.toast('Dashboard rebuilt.', 'ACMS', 4);
}

/** Menu: move Closed threads older than archive_after_days to the Archive tab (S6). */
function archiveClosedThreads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var comm = getSheetData_(SHEETS.COMMUNICATIONS);
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var statusC = comm.header.indexOf('status');
  var lastC = comm.header.indexOf('last_msg_date');
  var cutoff = new Date().getTime() - (parseInt(getConfig_('archive_after_days'), 10) || 90) * 24 * 60 * 60 * 1000;

  var moved = 0;
  // Iterate bottom-up so row deletion does not shift pending indices.
  for (var r = comm.rows.length - 1; r >= 0; r--) {
    var row = comm.rows[r];
    if (row[statusC] === 'Closed' && row[lastC] && new Date(row[lastC]).getTime() < cutoff) {
      archive.appendRow(row);
      comm.sheet.deleteRow(r + 2);
      moved++;
    }
  }
  ss.toast('Archived ' + moved + ' closed thread(s).', 'ACMS', 6);
}
