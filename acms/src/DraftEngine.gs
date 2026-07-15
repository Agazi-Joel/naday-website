/**
 * ACMS — DraftEngine.gs
 * Generates Gmail DRAFTS only, pre-filled from templates + register context.
 * Also "Raise issue from this thread" (D5).
 *
 * HARD RULE (C4/FR-43): this file — and the whole codebase — contains NO send
 * call. It uses GmailApp.createDraft / thread.createDraftReply exclusively.
 * The human personalises and sends from Gmail. Enforced by tests/no-send.test.js.
 */

/**
 * Menu action: build a draft from the selected Communications row.
 * Existing thread → reply draft (preserves threading, FR-42).
 * New/empty selection → new draft with a [F-YYYY-NNN] subject tag (FR-45).
 */
function createDraftFromSelection() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var sheet = ss.getActiveSheet();
  if (sheet.getName() !== SHEETS.COMMUNICATIONS) {
    ui.alert('Select a row on the ' + SHEETS.COMMUNICATIONS + ' tab first.');
    return;
  }
  var header = COLUMNS.COMMUNICATIONS;
  var rowNum = sheet.getActiveCell().getRow();
  if (rowNum < 2) { ui.alert('Select a data row.'); return; }
  var row = rowToObj_(header, sheet.getRange(rowNum, 1, 1, header.length).getValues()[0]);

  // Choose a template.
  var tpl = pickTemplate_(ui, row);
  if (!tpl) return;

  var ctx = buildMergeContext_(row, tpl);
  var subject = mergeTemplate(tpl.subject_template, ctx);
  var body = mergeTemplate(tpl.body_template, ctx);

  var threadId = row.thread_id;
  var thread = threadId ? GmailApp.getThreadById(threadId) : null;

  if (thread) {
    thread.createDraftReply(body); // reply keeps Gmail threading (subject unchanged)
    setDraftPending_(sheet, header, rowNum);
    ui.alert('Reply draft created in Gmail Drafts. Personalise and send from Gmail.');
  } else {
    var resp = ui.prompt('New draft', 'Recipient email address:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    var to = resp.getResponseText().trim();
    if (!to) { ui.alert('No recipient given.'); return; }
    // Ensure the subject carries the assessment tag so sync can re-suggest (FR-45).
    if (row.assessment_id && subject.indexOf('[' + row.assessment_id + ']') === -1) {
      subject = '[' + row.assessment_id + '] ' + subject;
    }
    GmailApp.createDraft(to, subject, body);
    ui.alert('New draft created in Gmail Drafts. Personalise and send from Gmail.');
  }
}

/** Prompt the user to choose a template id (filtered by nothing; all listed). */
function pickTemplate_(ui, row) {
  var tpls = getSheetData_(SHEETS.TEMPLATES);
  var objs = tpls.rows.map(function (r) { return rowToObj_(tpls.header, r); }).filter(function (o) { return o.template_id; });
  if (objs.length === 0) { ui.alert('No templates found. Seed the Templates tab.'); return null; }
  var menu = objs.map(function (o) { return o.template_id + ' — ' + o.name; }).join('\n');
  var resp = ui.prompt('Create draft', 'Enter a template_id:\n\n' + menu, ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return null;
  var id = resp.getResponseText().trim();
  var match = objs.filter(function (o) { return o.template_id === id; })[0];
  if (!match) { ui.alert('Unknown template_id: ' + id); return null; }
  return match;
}

/** Assemble placeholder values from the registers (§6.6). */
function buildMergeContext_(row, tpl) {
  var ctx = {
    assessment_id: row.assessment_id || '',
    due_date: '',
    issue_title: '',
    family_ref: '',
    recipient_name: firstCounterparty_(row.counterparties),
    my_name: getConfig_('my_name') || ''
  };
  if (row.assessment_id) {
    var a = lookupRow_(SHEETS.ASSESSMENTS, 'assessment_id', row.assessment_id);
    if (a) ctx.family_ref = a.family_ref || '';
  }
  if (row.issue_id) {
    var iss = lookupRow_(SHEETS.ISSUES, 'issue_id', row.issue_id);
    if (iss) { ctx.issue_title = iss.title || ''; ctx.due_date = fmtDate_(iss.due_date); }
  }
  return ctx;
}

/**
 * Menu action: create an Issues_Risks row pre-linked to the selected thread (D5).
 * Requires the row to already carry an assessment_id (anchor rule).
 */
function raiseIssueFromThread() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var sheet = ss.getActiveSheet();
  if (sheet.getName() !== SHEETS.COMMUNICATIONS) { ui.alert('Select a row on ' + SHEETS.COMMUNICATIONS + '.'); return; }
  var header = COLUMNS.COMMUNICATIONS;
  var rowNum = sheet.getActiveCell().getRow();
  if (rowNum < 2) { ui.alert('Select a data row.'); return; }
  var row = rowToObj_(header, sheet.getRange(rowNum, 1, 1, header.length).getValues()[0]);
  if (!row.assessment_id) { ui.alert('Tag this thread with an assessment_id first, then raise the issue.'); return; }

  var titleResp = ui.prompt('Raise issue', 'Short imperative title (e.g. "Chase ex-partner reference"):', ui.ButtonSet.OK_CANCEL);
  if (titleResp.getSelectedButton() !== ui.Button.OK) return;
  var title = titleResp.getResponseText().trim();
  if (!title) { ui.alert('No title given.'); return; }

  var typeResp = ui.prompt('Raise issue', 'Type — one of: ' + ENUMS.ISSUE_TYPE.join(', '), ui.ButtonSet.OK_CANCEL);
  if (typeResp.getSelectedButton() !== ui.Button.OK) return;
  var type = typeResp.getResponseText().trim();
  if (ENUMS.ISSUE_TYPE.indexOf(type) === -1) { ui.alert('Unknown type: ' + type); return; }

  var newId = nextIssueId(row.assessment_id, nextIssueSeq_(row.assessment_id));
  var iss = getSheetData_(SHEETS.ISSUES);
  var obj = {};
  COLUMNS.ISSUES.forEach(function (c) { obj[c] = ''; });
  obj.issue_id = newId;
  obj.assessment_id = row.assessment_id;
  obj.type = type;
  obj.title = title;
  obj.owner = 'Me';
  obj.status = 'Open';
  obj.raised_date = new Date();
  obj.last_comm_date = row.last_msg_date || '';
  iss.sheet.appendRow(objToRow_(iss.header, obj));

  // Link the issue back onto the communication row.
  sheet.getRange(rowNum, header.indexOf('issue_id') + 1).setValue(newId);
  ui.alert('Created ' + newId + ' and linked it to this thread.');
}

// ---- helpers ---------------------------------------------------------------

function setDraftPending_(sheet, header, rowNum) {
  var c = header.indexOf('draft_pending') + 1;
  sheet.getRange(rowNum, c).setValue(true); // cleared on next sync when the sent msg appears (FR-44)
}
function firstCounterparty_(csv) {
  var first = String(csv || '').split(',')[0];
  return first ? first.trim() : '';
}
function lookupRow_(sheetName, keyField, keyVal) {
  var d = getSheetData_(sheetName);
  var kc = d.header.indexOf(keyField);
  for (var r = 0; r < d.rows.length; r++) if (d.rows[r][kc] === keyVal) return rowToObj_(d.header, d.rows[r]);
  return null;
}
function nextIssueSeq_(assessmentId) {
  var d = getSheetData_(SHEETS.ISSUES);
  var ic = d.header.indexOf('issue_id');
  var max = 0;
  d.rows.forEach(function (row) {
    var m = String(row[ic] || '').match(new RegExp('^' + assessmentId.replace(/[-\/]/g, '\\$&') + '-I-(\\d+)$'));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max + 1;
}
function fmtDate_(d) {
  if (!d) return '';
  if (Object.prototype.toString.call(d) === '[object Date]') {
    return Utilities.formatDate(d, getConfig_('timezone') || 'Europe/London', 'yyyy-MM-dd');
  }
  return String(d);
}
