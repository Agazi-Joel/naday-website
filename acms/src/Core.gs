/**
 * ACMS — Core.gs
 * PURE logic layer. No GmailApp, no SpreadsheetApp, no Script Properties.
 * Every input is passed as a plain argument, so this file is fully
 * unit-testable off-platform (PRD Phase 2: "pure functions separated from
 * GmailApp calls for testability").
 *
 * Loads in both Apps Script (globals) and Node (module.exports footer).
 */

/** Extract a bare lowercase email from "Display Name <addr@x>" or "addr@x". */
function normaliseAddress(raw) {
  if (!raw) return '';
  var m = String(raw).match(/<([^>]+)>/);
  var addr = m ? m[1] : String(raw);
  return addr.trim().toLowerCase();
}

/** Alias-aware ownership test (E3). ownAddresses: array of raw/normalised addrs. */
function isOwnAddress(addr, ownAddresses) {
  var norm = normaliseAddress(addr);
  if (!norm) return false;
  for (var i = 0; i < ownAddresses.length; i++) {
    if (normaliseAddress(ownAddresses[i]) === norm) return true;
  }
  return false;
}

/** Sort messages ascending by date (does not mutate input). */
function sortMessagesByDate(messages) {
  return messages.slice().sort(function (a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

/**
 * Unique external addresses across from/to/cc/bcc of all messages, own excluded.
 * Notes-to-self (only own addresses) yields [] (E2).
 */
function deriveCounterparties(messages, ownAddresses) {
  var seen = {};
  var out = [];
  for (var i = 0; i < messages.length; i++) {
    var m = messages[i];
    var addrs = [m.from]
      .concat(m.to || [], m.cc || [], m.bcc || []);
    for (var j = 0; j < addrs.length; j++) {
      var norm = normaliseAddress(addrs[j]);
      if (!norm || isOwnAddress(norm, ownAddresses)) continue;
      if (!seen[norm]) { seen[norm] = true; out.push(norm); }
    }
  }
  return out;
}

/** 'Me' if the newest message was sent by an owner address, else 'Them' (E3). */
function deriveLastSender(messages, ownAddresses) {
  var sorted = sortMessagesByDate(messages);
  var last = sorted[sorted.length - 1];
  return isOwnAddress(last.from, ownAddresses) ? 'Me' : 'Them';
}

/**
 * ball_in_court: who owes the next action.
 * No counterparties (notes-to-self) => 'N/A' (E2).
 * Newest sender was Them  => ball is with 'Me' (I owe a reply).
 * Newest sender was Me     => ball is with 'Them'.
 */
function deriveBallInCourt(lastSender, counterpartyCount) {
  if (!counterpartyCount) return 'N/A';
  return lastSender === 'Me' ? 'Them' : 'Me';
}

/** [F-2026-014] -> 'F-2026-014', else null (FR-45). */
function parseSubjectTag(subject) {
  if (!subject) return null;
  var m = String(subject).match(/\[(F-\d{4}-\d{3})\]/);
  return m ? m[1] : null;
}

/**
 * Suggest an assessment tag for a thread. Deterministic, human-confirmed.
 * Precedence (PRD §6.5, FR-45): subject-tag (if it names exactly one ACTIVE
 * assessment) > exact email match > domain match > none. Any ambiguity
 * (a match resolves to >1 distinct active assessment) yields no suggestion
 * and flags for triage (E1).
 *
 * @param thread {subject, counterparties:[email]}
 * @param contactsMap [{email_or_domain, default_assessment_id, active}]
 * @param activeAssessmentIds Array of assessment_ids whose status === Active
 * @returns {suggested: string|'', ambiguous: bool, source: string}
 */
function suggestAssessment(thread, contactsMap, activeAssessmentIds) {
  var activeSet = {};
  for (var a = 0; a < activeAssessmentIds.length; a++) activeSet[activeAssessmentIds[a]] = true;

  // 1) Subject tag — only if it names exactly one active assessment.
  var tag = parseSubjectTag(thread.subject);
  if (tag && activeSet[tag]) {
    return { suggested: tag, ambiguous: false, source: 'subject' };
  }

  var counterparties = thread.counterparties || [];

  // Helper: collect distinct ACTIVE assessment ids from matching contact rows.
  function collect(predicate) {
    var found = {};
    for (var i = 0; i < contactsMap.length; i++) {
      var row = contactsMap[i];
      if (row.active !== true && String(row.active).toLowerCase() !== 'true') continue;
      if (!activeSet[row.default_assessment_id]) continue;
      if (predicate(String(row.email_or_domain).toLowerCase())) {
        found[row.default_assessment_id] = true;
      }
    }
    return Object.keys(found);
  }

  // 2) Exact email match.
  var exact = collect(function (key) {
    if (key.charAt(0) === '@') return false;
    for (var i = 0; i < counterparties.length; i++) {
      if (counterparties[i] === key) return true;
    }
    return false;
  });
  if (exact.length === 1) return { suggested: exact[0], ambiguous: false, source: 'email' };
  if (exact.length > 1) return { suggested: '', ambiguous: true, source: 'email' };

  // 3) Domain match.
  var domain = collect(function (key) {
    if (key.charAt(0) !== '@') return false;
    for (var i = 0; i < counterparties.length; i++) {
      var at = counterparties[i].indexOf('@');
      if (at >= 0 && counterparties[i].slice(at) === key) return true;
    }
    return false;
  });
  if (domain.length === 1) return { suggested: domain[0], ambiguous: false, source: 'domain' };
  if (domain.length > 1) return { suggested: '', ambiguous: true, source: 'domain' };

  return { suggested: '', ambiguous: false, source: 'none' };
}

/**
 * Merge a freshly-derived row over an existing row while protecting fields the
 * user has hand-edited (FR-14). overrideFlagsCsv is the CSV stored in the row's
 * override_flags cell. Only PROTECTABLE fields listed there are preserved from
 * `existing`; everything else takes the `incoming` value.
 *
 * @param existing object|null  current row (null for a brand-new thread)
 * @param incoming object       freshly derived field values
 * @param overrideFlagsCsv string
 * @param protectableFields Array (Config.PROTECTABLE_FIELDS)
 * @returns merged row object
 */
function mergeUpsert(existing, incoming, overrideFlagsCsv, protectableFields) {
  if (!existing) return incoming;
  var overridden = {};
  String(overrideFlagsCsv || '').split(',').forEach(function (f) {
    var t = f.trim();
    if (t) overridden[t] = true;
  });
  var out = {};
  // Start from incoming (derived truth), then restore protected fields.
  Object.keys(incoming).forEach(function (k) { out[k] = incoming[k]; });
  for (var i = 0; i < protectableFields.length; i++) {
    var field = protectableFields[i];
    if (overridden[field] && existing[field] !== undefined && existing[field] !== '') {
      out[field] = existing[field];
    }
  }
  return out;
}

/**
 * Decide the final field values for an EXISTING Communications row on sync.
 * Pure and fully testable — SyncEngine only supplies the I/O around it.
 *
 *  - applies derived truth over existing, protecting hand-edited fields (FR-14);
 *  - flips Closed → Open + reopened when genuinely newer activity arrives (FR-23),
 *    unless the user has overridden status;
 *  - preserves human-owned columns that sync never derives (comm_type, status,
 *    priority, assessment_id, issue_id, notes, flags) so they are not blanked;
 *  - carries the existing days_since_last so an unchanged thread stays identical
 *    (FR-17 idempotency); the caller restores the live formula after any write.
 *
 * @returns {row: object, reopened: bool}
 */
function computeUpdatedRow(existing, derived, protectableFields, humanOwnedFields) {
  var overrideCsv = existing.override_flags || '';
  var merged = mergeUpsert(existing, derived, overrideCsv, protectableFields);

  var newer = new Date(derived.last_msg_date).getTime() > new Date(existing.last_msg_date || 0).getTime();
  var reopened = false;
  if (existing.status === 'Closed' && newer && overrideCsv.indexOf('status') === -1) {
    merged.status = 'Open';
    reopened = true;
  }
  for (var i = 0; i < humanOwnedFields.length; i++) {
    var f = humanOwnedFields[i];
    if (merged[f] === undefined) merged[f] = existing[f];
  }
  merged.thread_missing = false; // it was just seen, so it exists (E4 cleared)
  if (reopened) merged.reopened = true;
  else if (merged.reopened === undefined) merged.reopened = existing.reopened;
  merged.days_since_last = existing.days_since_last;
  return { row: merged, reopened: reopened };
}

/** Replace {{placeholder}} tokens from ctx; unknown tokens blanked (FR-42). */
function mergeTemplate(str, ctx) {
  if (str == null) return '';
  return String(str).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_, key) {
    return (ctx && ctx[key] != null) ? String(ctx[key]) : '';
  });
}

/** Zero-padded friendly id, C-0007 (PRD §6.1). */
function friendlyId(seq) {
  var s = String(seq);
  while (s.length < 4) s = '0' + s;
  return 'C-' + s;
}

/** Next issue id for an assessment, F-2026-014-I-03 (PRD §6.1). */
function nextIssueId(assessmentId, seq) {
  var s = String(seq);
  while (s.length < 2) s = '0' + s;
  return assessmentId + '-I-' + s;
}

/**
 * Compose the derived fields of a Communications row from a thread's messages.
 * Pure: SyncEngine passes Gmail-sourced message metadata here; tests pass
 * fixtures. Stores NO message body (locked decision D2). Fetches/handles
 * metadata only, so 100+ message threads are fine (E5).
 *
 * @param thread {threadId, subject, messages:[{from,to,cc,bcc,date,hasAttachments,attachmentNames}]}
 * @param ownAddresses Array of owner addresses incl. aliases (E3)
 * @returns object of derived field values (subset of a Communications row)
 */
function deriveThreadFields(thread, ownAddresses) {
  var messages = thread.messages;
  var sorted = sortMessagesByDate(messages);
  var first = sorted[0];
  var last = sorted[sorted.length - 1];
  var counterparties = deriveCounterparties(messages, ownAddresses);
  var lastSender = deriveLastSender(messages, ownAddresses);
  var ball = deriveBallInCourt(lastSender, counterparties.length);
  var attSet = {};
  var hasAtt = false;
  for (var i = 0; i < messages.length; i++) {
    if (messages[i].hasAttachments) {
      hasAtt = true;
      (messages[i].attachmentNames || []).forEach(function (n) { attSet[n] = true; });
    }
  }
  return {
    thread_id: thread.threadId,
    subject: thread.subject,
    counterparties: counterparties.join(', '),
    first_msg_date: first.date,
    last_msg_date: last.date,
    msg_count: messages.length,
    last_sender: lastSender,
    ball_in_court: ball,
    has_attachments: hasAtt,
    attachment_names: Object.keys(attSet).join(', '),
    gmail_link: 'https://mail.google.com/mail/u/0/#all/' + thread.threadId
  };
}

/**
 * Plan resumable batches for first-run/backfill (N1). Returns the number of
 * batches needed and the cursor sequence, purely from counts — no side effects.
 */
function planBatches(totalThreads, batchSize) {
  var size = Math.max(1, batchSize | 0);
  var batches = Math.ceil(totalThreads / size);
  var cursors = [];
  for (var i = 0; i < batches; i++) cursors.push(i * size);
  return { batchSize: size, batchCount: batches, cursors: cursors };
}

// Dual-runtime export (Node tests).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normaliseAddress: normaliseAddress,
    isOwnAddress: isOwnAddress,
    sortMessagesByDate: sortMessagesByDate,
    deriveCounterparties: deriveCounterparties,
    deriveLastSender: deriveLastSender,
    deriveBallInCourt: deriveBallInCourt,
    parseSubjectTag: parseSubjectTag,
    suggestAssessment: suggestAssessment,
    mergeUpsert: mergeUpsert,
    computeUpdatedRow: computeUpdatedRow,
    mergeTemplate: mergeTemplate,
    friendlyId: friendlyId,
    nextIssueId: nextIssueId,
    deriveThreadFields: deriveThreadFields,
    planBatches: planBatches
  };
}
