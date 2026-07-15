/**
 * ACMS — Config.gs
 * Central configuration, enums, and sheet/column definitions.
 * NO magic strings elsewhere in the codebase (PRD N4).
 *
 * This file loads in BOTH Google Apps Script (as globals) and Node (via
 * module.exports footer) so the pure logic layer can be unit-tested off-platform.
 * It references no GmailApp/SpreadsheetApp, so it is safe to load anywhere.
 */

/** Sheet (tab) names — the 8 tabs of the workbook (PRD §5/§6.7). */
var SHEETS = {
  DASHBOARD: 'Dashboard',
  COMMUNICATIONS: 'Communications',
  ASSESSMENTS: 'Assessments',
  ISSUES: 'Issues_Risks',
  CONTACTS: 'Contacts_Map',
  TEMPLATES: 'Templates',
  CONFIG: 'Config',
  ARCHIVE: 'Archive',
  SYNC_LOG: 'SyncLog' // hidden operational log (FR-16)
};

/** Fixed enums (PRD §6, §8). Single source of truth for validation dropdowns. */
var ENUMS = {
  STAGE: ['Referral', 'Stage1', 'Stage2', 'DraftingC', 'QA', 'Panel', 'Complete', 'Withdrawn'],
  ASSESSMENT_STATUS: ['Active', 'OnHold', 'Closed'],
  ISSUE_TYPE: ['Task', 'Issue', 'Risk', 'Decision', 'InfoNeed'],
  OWNER: ['Me', 'Them', 'Shared'],
  ISSUE_STATUS: ['Open', 'Waiting', 'Blocked', 'Done', 'Closed'],
  LAST_SENDER: ['Me', 'Them'],
  BALL_IN_COURT: ['Me', 'Them', 'N/A'],
  COMM_TYPE: ['Request', 'Relay', 'Decision', 'Record', 'Untagged'],
  PRIORITY: ['High', 'Normal', 'Low'],
  COMM_STATUS: ['Open', 'WaitingThem', 'WaitingMe', 'Closed', 'NoAction']
};

/**
 * Column definitions per sheet. Order here IS the physical column order.
 * `snippet` is deliberately ABSENT from Communications (locked decision D2:
 * zero message-body text is stored; the Sheet is an index, not an archive).
 */
var COLUMNS = {
  ASSESSMENTS: [
    'assessment_id', 'family_ref', 'commissioning_agency', 'stage',
    'date_commissioned', 'panel_date', 'status', 'lead_contact', 'notes'
  ],
  ISSUES: [
    'issue_id', 'assessment_id', 'type', 'title', 'owner', 'owner_name',
    'status', 'due_date', 'raised_date', 'resolution', 'last_comm_date'
  ],
  COMMUNICATIONS: [
    'thread_id', 'friendly_id', 'subject', 'counterparties',
    'first_msg_date', 'last_msg_date', 'msg_count', 'last_sender',
    'ball_in_court', 'assessment_id', 'issue_id', 'comm_type', 'priority',
    'status', 'has_attachments', 'attachment_names', 'gmail_link',
    'days_since_last', 'draft_pending', 'thread_missing', 'reopened',
    'suggested_assessment', 'override_flags', 'manual_notes'
  ],
  CONTACTS: [
    'email_or_domain', 'default_assessment_id', 'contact_name', 'role', 'active'
  ],
  TEMPLATES: [
    'template_id', 'comm_type', 'name', 'subject_template',
    'body_template', 'default_priority'
  ],
  SYNC_LOG: [
    'run_at', 'threads_scanned', 'rows_added', 'rows_updated',
    'batch_cursor', 'watermark_after', 'errors'
  ]
};

/**
 * Fields on a Communications row that sync DERIVES and may therefore
 * overwrite — UNLESS the user has hand-edited them (FR-14). The override_flags
 * cell holds a CSV of the field names the user has protected.
 */
var PROTECTABLE_FIELDS = [
  'ball_in_court', 'assessment_id', 'issue_id', 'comm_type',
  'priority', 'status'
];

/**
 * Human-owned columns that sync must never derive and therefore must preserve
 * from the existing row (otherwise they would be blanked each run).
 */
var HUMAN_OWNED_FIELDS = [
  'friendly_id', 'assessment_id', 'issue_id', 'comm_type', 'priority', 'status',
  'manual_notes', 'draft_pending', 'suggested_assessment', 'override_flags'
];

/**
 * Config-sheet defaults (PRD §6.7). Written by setupWorkbook(); read at runtime.
 * own_addresses and ignore_labels are intentionally EMPTY — the practitioner
 * fills them at deploy time (D7/D8). Sync refuses to derive last_sender until
 * own_addresses is populated.
 */
var CONFIG_DEFAULTS = {
  my_name: '',                  // signature name merged into templates ({{my_name}})
  own_addresses: '',            // CSV of all owner addresses incl. send-as aliases (E3)
  ignore_labels: '',            // CSV of Gmail labels to exclude from sync (FR-13)
  backfill_days: 14,            // D3: first-run/backfill horizon in days
  sync_overlap_minutes: 60,     // FR-11: overlap buffer to avoid boundary loss
  batch_size: 200,              // N1: threads per resumable batch
  work_start_hour: 6,           // trigger window start (24h, Europe/London)
  work_end_hour: 21,            // trigger window end
  overdue_days_them: 5,         // Dashboard chase threshold (waiting-on-them)
  overdue_days_me: 3,           // Dashboard threshold (ball-in-my-court)
  archive_after_days: 90,       // Archive rule (menu action, not automatic)
  timezone: 'Europe/London'     // E7
};

/** Script Property keys (watermark + batch cursor persistence). */
var PROP_KEYS = {
  WATERMARK: 'ACMS_SYNC_WATERMARK',      // epoch ms; last successful sync point
  BATCH_CURSOR: 'ACMS_BATCH_CURSOR',     // first-run/backfill resume cursor
  BACKFILL_DONE: 'ACMS_BACKFILL_DONE'    // '1' once initial backfill completes
};

/** Regex for the subject assessment tag, e.g. [F-2026-014] (FR-45). */
var SUBJECT_TAG_RE = /\[(F-\d{4}-\d{3})\]/;

/** onEdit guardrail message (FR-33). Wording configurable. */
var ANCHOR_WARNING = 'No airy-fairy communications — anchor it to an assessment (or set status = NoAction).';

// Dual-runtime export (Node tests). Skipped in Apps Script where `module` is undefined.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHEETS: SHEETS, ENUMS: ENUMS, COLUMNS: COLUMNS,
    PROTECTABLE_FIELDS: PROTECTABLE_FIELDS, HUMAN_OWNED_FIELDS: HUMAN_OWNED_FIELDS,
    CONFIG_DEFAULTS: CONFIG_DEFAULTS,
    PROP_KEYS: PROP_KEYS, SUBJECT_TAG_RE: SUBJECT_TAG_RE, ANCHOR_WARNING: ANCHOR_WARNING
  };
}
