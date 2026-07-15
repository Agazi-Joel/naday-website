# ACMS v1.0 — Final Build Plan (locked)

**Entity:** Adriels Care and Assessments Ltd
**Status:** Locked for build. Supersedes the open questions in PRD §13.
**Platform:** Google Apps Script (container-bound) + Google Sheets + Gmail. No external services. No AI in the data path.

---

## 0. Decisions locked from the grilling session

These resolve PRD §13 and the unresolved tensions in §6.4 / §9.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| D1 | Container-bound vs standalone (§13.1) | **Container-bound** to the Sheet | Single OAuth, simplest deploy, one artifact |
| D2 | Snippet storage (§6.4, §13.5, S2) | **Dropped entirely — zero message-body text stored** | Special-category data syncing to desktop; `subject` already its own column, so "subject-only" == "no snippet". Strongest DPIA position. Gmail remains the sole body store |
| D3 | Backfill horizon (§13.8, N1) | **14 days**, via Config cell `backfill_days` (default 14) | Small, fast first run; matches when structured practice began; widen later with no code edit |
| D4 | Excel layer (§13.6, S3) | **Dropped** | Removes a real data-exfil route (publish-to-web prohibited for this data). Desktop = Drive for Desktop + browser |
| D5 | Raise-issue-from-thread (§13.7) | **Included** | Small addition, high value; menu action creates a pre-linked `Issues_Risks` row |
| D6 | Send-as alias handling (E3) | **Included** | Config `own_addresses` is plural; `last_sender`/`ball_in_court` check every alias. Correctness-critical |
| D7 | Ignore-labels (§13.2) | **Config-driven** `ignore_labels`, default empty | Practitioner fills at deploy; no code change |
| D8 | Own-alias list (§13.3) | **Config-driven** `own_addresses`, default empty (must be filled at deploy) | Deploy-time; never hard-coded |
| D9 | Template seed (§13.4) | **8 synthetic templates** across the 4 types (see §5) | All invented content; practitioner rewrites relational 20% in Gmail |

**Net effect on the data model:** the `snippet` column is removed from the `Communications` sheet (PRD §6.4). Everything else in §6 stands. Columns added by locked scope: `draft_pending` (FR-44), `thread_missing` (E4), `suggested_assessment` (§6.5), `override_flags` (hidden, FR-14).

---

## 1. File layout (≤ 6 .gs files — N5)

```
acms/
  BUILD_PLAN.md            # this document
  README.md                # deployment guide for the practitioner (zero real data)
  appsscript.json          # manifest: Europe/London tz, least-privilege scopes
  src/
    Config.gs              # (1) config defaults, enums, sheet/column definitions — no magic strings (N4)
    Core.gs                # (2) PURE logic: derivations, suggestion, upsert-merge, template merge, id helpers
    Setup.gs               # (3) setupWorkbook() builds all 8 tabs + onOpen() menu/UI (menu/UI.gs role)
    SyncEngine.gs          # (4) syncNow(): watermark, pagination, batch resume, upsert, SyncLog
    Triage.gs              # (5) onEdit guardrails, dependent dropdowns, dashboard rebuild, reopened flag
    DraftEngine.gs         # (6) createDraftFromSelection(), raiseIssueFromThread() — NO send calls (C4)
  fixtures/                # synthetic only (C2/S5): drives local tests, never real data
    threads.json  assessments.json  issues.json  contacts.json  templates.json
  tests/
    core.test.js           # Node harness (no deps): loads Config.gs + Core.gs, runs fixture assertions
    no-send.test.js        # greps src/*.gs for any send method (C4 acceptance gate)
```

`Config.gs` and `Core.gs` are written to load in **both** Apps Script (globals) and Node (`module.exports` footer guarded by `typeof module`). `Core.gs` references **no** `GmailApp`/`SpreadsheetApp` — all inputs passed as plain args, so the whole logic layer is unit-testable off-platform (satisfies PRD "pure functions separated from GmailApp").

---

## 2. Pure logic surface (`Core.gs`) — the tested contract

| Function | Purpose | PRD ref |
|----------|---------|---------|
| `normaliseAddress(raw)` | `"Jane <J@X.uk>"` → `j@x.uk` | 6.1 |
| `isOwnAddress(addr, ownAddresses)` | alias-aware ownership test | E3 |
| `deriveCounterparties(messages, ownAddresses)` | unique external addresses, own excluded | 6.4, E2 |
| `deriveLastSender(messages, ownAddresses)` | `Me`/`Them` from newest message | 6.4, E3 |
| `deriveBallInCourt(lastSender, counterpartyCount)` | `Them`→`Me`, `Me`→`Them`, none→`N/A` | 6.4, E2 |
| `parseSubjectTag(subject)` | `[F-2026-014]` → `F-2026-014` | FR-45 |
| `suggestAssessment(thread, contactsMap, activeIds)` | precedence: subject-tag → exact email → domain → none; ambiguity → none+flag | 6.5, FR-45, E1 |
| `mergeUpsert(existing, incoming, protectedFields)` | apply incoming but keep hand-edited fields | FR-14 |
| `mergeTemplate(str, ctx)` | `{{placeholder}}` substitution | 6.6, FR-42 |
| `friendlyId(seq)` / `nextIssueId(assessmentId, seq)` | `C-0007`, `F-2026-014-I-03` | 6.1 |

## 3. Impure engines (thin wrappers over Core)

- **SyncEngine.gs** — `syncNow()`: reads watermark (`Script Properties`), builds Gmail query `after:<max(watermark-1h, today-backfill_days)>` excluding Spam/Trash/`ignore_labels` (FR-13), paginates in `batch_size` (default 200) chunks with checkpointing (N1/N3/E8), fetches **metadata only** (E5), upserts by `threadId` via `Core.mergeUpsert`, updates `Issues_Risks.last_comm_date` (FR-15), writes a `SyncLog` line every run (FR-16), advances watermark **only after** a successful batch write (N3). Idempotent (FR-17). Flips `Closed`→`Open` + Reopened flag on new activity (FR-23). Sets `thread_missing` instead of deleting on trashed threads (E4).
- **Triage.gs** — `onEdit` guardrail enforcing "type requires anchor" with `NoAction` exemption (FR-33/34); dependent `issue_id` dropdown filtered by chosen `assessment_id`; `rebuildDashboard()` / `rebuildTriage()`.
- **DraftEngine.gs** — `createDraftFromSelection()` (reply → `thread.createDraftReply`; new → `GmailApp.createDraft` with `[F-YYYY-NNN]` subject tag), sets `draft_pending=TRUE` (FR-44), merges placeholders from registers. `raiseIssueFromThread()` (D5). **Contains no send method anywhere** (C4) — enforced by `tests/no-send.test.js`.

## 4. Acceptance tests (DoD)

1. `setupWorkbook()` builds all 8 tabs on a blank Sheet. *(manual on-platform; documented in README)*
2. `core.test.js` passes: threading upsert idempotency (FR-17), `last_sender`/`ball_in_court` incl. alias (E3) & notes-to-self (E2), suggestion precedence + ambiguity (6.5/E1), override protection (FR-14), subject-tag parse (FR-45), template merge, msg_count on 100-msg thread (E5).
3. First-run batch design: `planBatches` simulation of 1000 threads / 200 = 5 resumable batches with watermark checkpoint (N1).
4. `no-send.test.js`: zero `send(`/`sendEmail`/`GmailApp.sendEmail` in `src/` (C4).
5. Anchor rule enforced with `NoAction` exemption (FR-33/34) — logic unit-tested; UX on-platform.

## 5. Template seed set (8, all synthetic)

| template_id | type | name |
|---|---|---|
| T-REQ-REF | Request | Chase referee (reference outstanding) |
| T-REQ-AVAIL | Request | Availability request (visit scheduling) |
| T-REQ-DOC | Request | Document request (missing evidence) |
| T-REL-AGENCY | Relay | Progress update to commissioning agency |
| T-REL-APPLICANT | Relay | Information to applicant |
| T-DEC-PANEL | Decision | Decision needed — panel date |
| T-REC-DISC | Record | Confirmation of discussion (file note by email) |
| T-REC-CONSENT | Record | Confirmation of consent received |

## 6. Out of scope (unchanged from PRD §2.2 / §14)

No auto-send (drafts only), no AI, no Supabase migration, no attachment archiving, no calendar/invoicing, no multi-user, no Excel write-back.
