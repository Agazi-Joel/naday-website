# ACMS — Assessment Communications Management System v1.0

An **assessment management register with an email feed in and a draft channel out**,
built entirely inside your own Google Workspace (Apps Script + Sheets + Gmail).
No external services. No AI in the data path. Draft-only outbound.

> **Development hygiene (PRD C2/S5):** this code was written and tested against
> **synthetic fixtures only**. No real case data, email content, or names were
> ever shown to the tool that wrote it. All deployment steps below that touch
> your live account are performed **by you**, not by pasting real output back
> into any AI tool. If you ever need to share logs for debugging, redact first.

---

## What it does

- Logs every Gmail **thread** (not message) into a `Communications` register on a schedule.
- Lets you anchor each thread to an **Assessment** and optionally an **Issue/Risk/Action**, with a fixed **communication type** (Request / Relay / Decision / Record).
- Keeps three linked registers with stable IDs: `Assessments`, `Issues_Risks`, `Communications`.
- Surfaces a **triage/dashboard**: untagged threads, ball-in-my-court, waiting-on-them, reopened, missing.
- Generates **Gmail drafts** (never sends) from templates pre-filled with register context.

The Sheet is an **index, not an archive** — Gmail stays the record. No message
bodies are stored (only subject + metadata + a one-click `gmail_link`).

---

## Locked design decisions

See `BUILD_PLAN.md` §0. Highlights: container-bound script; **no body snippet
stored**; **14-day** backfill (Config-driven); Excel layer dropped; raise-issue-from-thread
included; send-as alias handling included.

---

## Deploy in under an hour

### 1. Create the Sheet + script
1. Create a new blank Google Sheet in your own account. Name it e.g. `ACMS`.
2. **Extensions → Apps Script** (this creates a *container-bound* project).
3. Delete the default `Code.gs`. Create six script files and paste in the
   matching file from `src/`: `Config.gs`, `Core.gs`, `Setup.gs`,
   `SyncEngine.gs`, `Triage.gs`, `DraftEngine.gs`.
   *(Or use `clasp`: `clasp create --type sheets`, drop the files in, `clasp push`.)*
4. **Project Settings → Show `appsscript.json`**, and replace it with the one in this folder (sets Europe/London timezone and least-privilege scopes).

### 2. Build the workbook
1. In the Apps Script editor, run `setupWorkbook()` once.
2. Approve the OAuth consent when prompted (your own account; the data never leaves it).
3. Return to the Sheet — the **ACMS** menu appears, and all tabs are built.

### 3. Configure (this is the only step with real data — you do it)
On the **Config** tab, set:
- `my_name` — your signature name.
- `own_addresses` — **CSV of every address you send from, including send-as aliases.**
  Sync refuses to run until this is filled (otherwise Me/Them derivation is wrong — E3).
- `ignore_labels` — CSV of Gmail labels to exclude (e.g. `Newsletters`).
- (Optional) adjust `backfill_days`, thresholds, `archive_after_days`.

Then seed:
- **Assessments** tab — one row per open assessment. Use **initials + ref only**, no full names (S2).
- **Contacts_Map** tab — email/domain → default assessment, for tag suggestions.
- **Templates** tab — 8 starter templates are documented in `fixtures/templates.json`; paste the ones you want.

### 4. First sync + triage
1. **ACMS → Sync now.** First run ingests the last `backfill_days` (14) of mail
   in resumable batches; large mailboxes finish across several runs automatically.
2. Work the **Dashboard**: tag untagged threads, set comm_type, resolve the anchor prompts.
3. **ACMS → Install sync trigger** to run every 30 minutes.

### 5. Drafting
- Select a `Communications` row → **ACMS → Create draft from selection** → pick a template.
  Existing thread ⇒ reply draft (threading preserved). New ⇒ enter a recipient; the
  subject gets a `[F-YYYY-NNN]` tag so the next sync re-links it.
- **The system never sends.** You open Gmail Drafts, add the relational 20%, and send.

### 6. Desktop layer
Use **Google Drive for Desktop** and open the Sheet in the browser (canonical, live).
The Excel/Power Query route is **dropped in v1** (S3: publish-to-web is prohibited for this data).

---

## Data model (tabs)

`Dashboard` · `Communications` · `Assessments` · `Issues_Risks` · `Contacts_Map`
· `Templates` · `Config` · `Archive` (+ hidden `SyncLog`). Full column lists in
`src/Config.gs` (`COLUMNS`), which is the single source of truth.

`days_since_last` is a display formula. After first sync, put this in the
`Communications` `days_since_last` column (row 2, then fill down) if you want a
live overdue counter:

```
=IF(F2="","",INT(NOW()-F2))
```
*(column F is `last_msg_date`; adjust if you reorder columns).*

---

## Tests (run locally, no real data)

From the `acms/` directory:

```bash
node tests/core.test.js      # 48 fixture assertions: derivations, suggestion, override, idempotency, batching
node tests/no-send.test.js   # C4 gate: asserts zero send calls in src/*.gs
```

Both are dependency-free and load the real `.gs` files, so they exercise the
same code that runs in Apps Script.

---

## Security & data protection

- All data stays in your Google account; no new processor beyond Google (S1).
- No message bodies stored; `family_ref` is initials/ref only (S2/D2).
- Sheet stays private to you — never "anyone with link" (S3).
- Record this system in the practice DPIA log: it is a re-indexing of data
  already in Gmail, with no AI processing and no new processor (S4).
- Retention: use **ACMS → Archive closed threads** plus a documented manual
  purge for closed assessments past your retention schedule (S6).

## Out of scope (v1)

No auto-send, no AI classification/summarisation, no Supabase migration, no
attachment archiving, no calendar/invoicing, no multi-user access control,
no Excel write-back. See `BUILD_PLAN.md` §6 and PRD §2.2/§14.
