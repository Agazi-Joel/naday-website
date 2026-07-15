/**
 * ACMS — core.test.js
 * Node fixture-driven tests for the pure logic layer (PRD Definition of Done).
 * Zero dependencies. Run: `node tests/core.test.js` from the acms/ directory.
 *
 * Loads the .gs files directly (Node's CommonJS loader treats unknown
 * extensions as JavaScript), so the SAME code that runs in Apps Script is
 * exercised here. No real data, no GmailApp — synthetic fixtures only (C2/S5).
 */

var fs = require('fs');
var path = require('path');

var Config = require('../src/Config.gs');
var Core = require('../src/Core.gs');

// ---- tiny assertion harness -------------------------------------------------
var passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ✗ FAIL: ' + msg); }
}
function eq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), msg + '  (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function section(name) { console.log('\n• ' + name); }

// ---- load + expand fixtures -------------------------------------------------
function load(name) { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8')); }

var fx = load('threads.json');
var OWN = fx.own_addresses;
var assessments = load('assessments.json').rows;
var contacts = load('contacts.json').rows;
var templates = load('templates.json').rows;

var activeIds = assessments.filter(function (a) { return a.status === 'Active'; }).map(function (a) { return a.assessment_id; });

// Expand any _generate thread (E5: 120-message thread) into real messages.
function expand(thread) {
  if (!thread._generate) return thread;
  var g = thread._generate;
  var msgs = [];
  var t = new Date(g.start_date).getTime();
  for (var i = 0; i < g.messages; i++) {
    var from = g.alternate_from[i % g.alternate_from.length];
    msgs.push({ id: 'gen-' + i, from: from, to: ['assessments@adriels.example'], cc: [], bcc: [], date: new Date(t + i * 3600000).toISOString(), hasAttachments: false, attachmentNames: [] });
  }
  var copy = Object.assign({}, thread); copy.messages = msgs; return copy;
}
var threads = fx.threads.map(expand);
function byId(id) { return threads.filter(function (t) { return t.threadId === id; })[0]; }

// ============================================================================
section('normaliseAddress / isOwnAddress (E3 alias awareness)');
eq(Core.normaliseAddress('Karen Peart <kper@shinefostering.example>'), 'kper@shinefostering.example', 'strips display name, lowercases');
eq(Core.normaliseAddress('MiXeD@Case.Org'), 'mixed@case.org', 'lowercases bare address');
ok(Core.isOwnAddress('Adriels Assessments <assessments@adriels.example>', OWN), 'alias recognised as own');
ok(!Core.isOwnAddress('applicant.a@example.net', OWN), 'external not own');

// ============================================================================
section('deriveLastSender / deriveBallInCourt (§6.4, E2, E3)');
var t1001 = Core.deriveThreadFields(byId('t-1001'), OWN);
eq(t1001.last_sender, 'Them', 't-1001 last message from agency SW => Them');
eq(t1001.ball_in_court, 'Me', 't-1001 ball with Me (I owe reply)');

var t1002 = Core.deriveThreadFields(byId('t-1002'), OWN);
eq(t1002.last_sender, 'Me', 't-1002 outbound => Me');
eq(t1002.ball_in_court, 'Them', 't-1002 ball with Them');

var t1003 = Core.deriveThreadFields(byId('t-1003'), OWN);
eq(t1003.counterparties, '', 'E2 notes-to-self: no counterparties');
eq(t1003.ball_in_court, 'N/A', 'E2 notes-to-self: ball N/A');

var t1004 = Core.deriveThreadFields(byId('t-1004'), OWN);
eq(t1004.last_sender, 'Me', 'E3 last message sent from send-as alias => Me');
eq(t1004.ball_in_court, 'Them', 'E3 ball with Them');

var t1011 = Core.deriveThreadFields(byId('t-1011'), OWN);
eq(t1011.counterparties.indexOf('assessments@adriels.example'), -1, 'own address in CC excluded from counterparties');
eq(t1011.last_sender, 'Them', 't-1011 external sender => Them');
eq(t1011.has_attachments, true, 't-1011 has attachments');
eq(t1011.attachment_names, 'minutes.pdf, actions.docx', 't-1011 attachment filenames captured (names only, NG4)');

// ============================================================================
section('msg_count on long thread (E5)');
var t1008 = Core.deriveThreadFields(byId('t-1008'), OWN);
eq(t1008.msg_count, 120, 'E5 120-message thread counted correctly');
eq(t1008.last_sender, 'Them', 'E5 last of 120 (even index alternation) resolves');

// ============================================================================
section('parseSubjectTag (FR-45)');
eq(Core.parseSubjectTag('[F-2026-014] Availability confirmed'), 'F-2026-014', 'extracts tag');
eq(Core.parseSubjectTag('Re: no tag here'), null, 'no tag => null');

// ============================================================================
section('suggestAssessment precedence + ambiguity (§6.5, E1)');
// E1: agency SW maps to two active assessments => ambiguous, no suggestion.
var s1005 = Core.suggestAssessment({ subject: byId('t-1005').subject, counterparties: ['kper@shinefostering.example'] }, contacts, activeIds);
eq(s1005.suggested, '', 'E1 ambiguous counterparty => no suggestion');
eq(s1005.ambiguous, true, 'E1 flagged ambiguous for triage');

// Domain precedence: brightpath LA domain => F-2026-016.
var s1006 = Core.suggestAssessment({ subject: byId('t-1006').subject, counterparties: ['intake@brightpathla.example'] }, contacts, activeIds);
eq(s1006.suggested, 'F-2026-016', 'domain match suggests correct assessment');
eq(s1006.source, 'domain', 'source is domain');

// Exact beats domain: applicant.a exact => 014 even though example.net has no domain rule.
var sExact = Core.suggestAssessment({ subject: 'no tag', counterparties: ['applicant.a@example.net'] }, contacts, activeIds);
eq(sExact.suggested, 'F-2026-014', 'exact email match suggests 014');
eq(sExact.source, 'email', 'source is email');

// Subject tag wins over everything (and must name an ACTIVE assessment).
var sTag = Core.suggestAssessment({ subject: '[F-2026-016] hello', counterparties: ['applicant.a@example.net'] }, contacts, activeIds);
eq(sTag.suggested, 'F-2026-016', 'subject tag takes precedence over exact email');
eq(sTag.source, 'subject', 'source is subject');

// Subject tag naming a CLOSED assessment is ignored (not active).
var sClosedTag = Core.suggestAssessment({ subject: '[F-2025-009] old', counterparties: [] }, contacts, activeIds);
eq(sClosedTag.suggested, '', 'tag for closed assessment => no auto-apply');

// Inactive contact row must not suggest (referee.two active:false -> F-2025-009 closed anyway).
var sInactive = Core.suggestAssessment({ subject: 'x', counterparties: ['referee.two@example.org'] }, contacts, activeIds);
eq(sInactive.suggested, '', 'inactive/closed mapping => no suggestion');

// ============================================================================
section('mergeUpsert override protection (FR-14) + idempotency (FR-17)');
var derived = { thread_id: 't-1001', ball_in_court: 'Me', assessment_id: '', comm_type: 'Untagged', priority: 'Normal', status: 'Open' };
// User hand-tagged assessment_id and flipped ball_in_court; recorded in override_flags.
var existing = { thread_id: 't-1001', ball_in_court: 'Them', assessment_id: 'F-2026-014', comm_type: 'Request', priority: 'High', status: 'WaitingThem' };
var overrides = 'ball_in_court,assessment_id,comm_type,priority,status';
var merged = Core.mergeUpsert(existing, derived, overrides, Config.PROTECTABLE_FIELDS);
eq(merged.assessment_id, 'F-2026-014', 'protected assessment_id preserved');
eq(merged.ball_in_court, 'Them', 'protected ball_in_court preserved');
eq(merged.comm_type, 'Request', 'protected comm_type preserved');
// Non-protected derived fields still update:
eq(merged.thread_id, 't-1001', 'thread_id flows from derived');

// Idempotency: merging the SAME derived twice yields identical result (FR-17).
var m1 = Core.mergeUpsert(existing, derived, overrides, Config.PROTECTABLE_FIELDS);
var m2 = Core.mergeUpsert(m1, derived, overrides, Config.PROTECTABLE_FIELDS);
eq(JSON.stringify(m1), JSON.stringify(m2), 'FR-17 running upsert twice => no change');

// New thread (existing null): incoming used verbatim.
var mNew = Core.mergeUpsert(null, derived, '', Config.PROTECTABLE_FIELDS);
eq(mNew.comm_type, 'Untagged', 'new thread defaults to derived values');

// No override flags => derived overwrites everything (nothing protected).
var mNoFlag = Core.mergeUpsert(existing, derived, '', Config.PROTECTABLE_FIELDS);
eq(mNoFlag.assessment_id, '', 'without override flag, derived (blank) wins');

// ============================================================================
section('computeUpdatedRow — existing-row sync decision (FR-14/17/23)');
var HUMAN = Config.HUMAN_OWNED_FIELDS;
// Existing row the user has tagged + typed; sync brings fresh derived metadata only.
var exist = {
  thread_id: 't-1001', friendly_id: 'C-0001', subject: 'old subj', counterparties: 'kper@shinefostering.example',
  first_msg_date: '2026-07-06T09:15:00+01:00', last_msg_date: '2026-07-07T14:02:00+01:00', msg_count: 2,
  last_sender: 'Them', ball_in_court: 'Me', assessment_id: 'F-2026-014', issue_id: 'F-2026-014-I-02',
  comm_type: 'Request', priority: 'High', status: 'WaitingThem', has_attachments: false, attachment_names: '',
  gmail_link: 'https://mail.google.com/mail/u/0/#all/t-1001', days_since_last: 8,
  draft_pending: true, thread_missing: false, reopened: false, suggested_assessment: '', override_flags: '', manual_notes: 'my note'
};
// New activity: a fresh inbound bumps msg_count and last_msg_date/subject.
var fresh = Core.deriveThreadFields({
  threadId: 't-1001', subject: 'Re: newer subject',
  messages: [
    { from: 'practitioner@adriels.example', to: ['kper@shinefostering.example'], cc: [], bcc: [], date: '2026-07-06T09:15:00+01:00', hasAttachments: false, attachmentNames: [] },
    { from: 'kper@shinefostering.example', to: ['practitioner@adriels.example'], cc: [], bcc: [], date: '2026-07-07T14:02:00+01:00', hasAttachments: false, attachmentNames: [] },
    { from: 'kper@shinefostering.example', to: ['practitioner@adriels.example'], cc: [], bcc: [], date: '2026-07-14T10:00:00+01:00', hasAttachments: false, attachmentNames: [] }
  ]
}, OWN);
var upd = Core.computeUpdatedRow(exist, fresh, Config.PROTECTABLE_FIELDS, HUMAN);
eq(upd.row.comm_type, 'Request', 'human-owned comm_type preserved, not blanked');
eq(upd.row.status, 'WaitingThem', 'human-owned status preserved');
eq(upd.row.priority, 'High', 'human-owned priority preserved');
eq(upd.row.assessment_id, 'F-2026-014', 'human tag preserved');
eq(upd.row.issue_id, 'F-2026-014-I-02', 'linked issue preserved');
eq(upd.row.manual_notes, 'my note', 'manual notes preserved');
eq(upd.row.subject, 'Re: newer subject', 'derived subject updated');
eq(upd.row.msg_count, 3, 'derived msg_count updated');
eq(upd.row.days_since_last, 8, 'days_since_last carried (formula restored by caller)');
eq(upd.reopened, false, 'not reopened (was not Closed)');

// Reopened path: a Closed thread receives newer activity => flip to Open + flag (FR-23).
var closed = Object.assign({}, exist, { status: 'Closed', reopened: false });
var reo = Core.computeUpdatedRow(closed, fresh, Config.PROTECTABLE_FIELDS, HUMAN);
eq(reo.row.status, 'Open', 'closed thread reopened -> Open');
eq(reo.reopened, true, 'reopened flag set');

// Reopened suppressed when the user has overridden status.
var closedLocked = Object.assign({}, exist, { status: 'Closed', override_flags: 'status' });
var reoLocked = Core.computeUpdatedRow(closedLocked, fresh, Config.PROTECTABLE_FIELDS, HUMAN);
eq(reoLocked.row.status, 'Closed', 'status override suppresses reopen');
eq(reoLocked.reopened, false, 'no reopen when status overridden');

// Idempotency (FR-17): computing twice from the same inputs is stable.
var once = Core.computeUpdatedRow(exist, fresh, Config.PROTECTABLE_FIELDS, HUMAN).row;
var twice = Core.computeUpdatedRow(once, fresh, Config.PROTECTABLE_FIELDS, HUMAN).row;
eq(JSON.stringify(once), JSON.stringify(twice), 'FR-17 computeUpdatedRow stable across repeats');

// ============================================================================
section('mergeTemplate placeholder substitution (FR-42)');
var tpl = templates.filter(function (t) { return t.template_id === 'T-REQ-REF'; })[0];
var ctx = { assessment_id: 'F-2026-014', recipient_name: 'Referee One', due_date: '2026-07-20', my_name: 'Practitioner' };
var subj = Core.mergeTemplate(tpl.subject_template, ctx);
eq(subj, '[F-2026-014] Reference request — gentle reminder', 'subject placeholders merged');
var body = Core.mergeTemplate(tpl.body_template, ctx);
ok(body.indexOf('Dear Referee One,') === 0, 'body recipient merged');
ok(body.indexOf('by 2026-07-20') > -1, 'body due_date merged');
ok(body.indexOf('{{') === -1, 'no unresolved placeholders remain');

// ============================================================================
section('id helpers (§6.1)');
eq(Core.friendlyId(7), 'C-0007', 'friendlyId pads to 4');
eq(Core.friendlyId(1234), 'C-1234', 'friendlyId no over-pad');
eq(Core.nextIssueId('F-2026-014', 3), 'F-2026-014-I-03', 'issue id format');

// ============================================================================
section('first-run batch plan — simulate 1000 threads (N1, DoD item 3)');
var plan = Core.planBatches(1000, Config.CONFIG_DEFAULTS.batch_size);
eq(plan.batchSize, 200, 'batch size from Config');
eq(plan.batchCount, 5, '1000 / 200 => 5 resumable batches');
eq(plan.cursors, [0, 200, 400, 600, 800], 'watermark checkpoint cursors');
var odd = Core.planBatches(950, 200);
eq(odd.batchCount, 5, '950 / 200 => 5 batches (last partial)');

// ============================================================================
console.log('\n' + (failed === 0 ? '✓ ALL PASSED' : '✗ FAILURES') + ' — ' + passed + ' passed, ' + failed + ' failed.');
process.exit(failed === 0 ? 0 : 1);
