# ACMS — Living Design (v1 direction)

**Status:** Evolving spec. This is the single source of truth for where ACMS is
heading after the grilling sessions. It supersedes the *direction* of
`BUILD_PLAN.md` (which documents the already-built Google Sheet artifact — now
demoted to reference/fallback, see §10).

**One-line:** An assessment-management system that lives in the practitioner's
VS Code / Claude Code workspace as markdown files, is **proactive** (prompts the
communications you owe *before* silence snowballs), keeps confidential documents
off email, and never lets case content reach the Claude API except through the
practitioner's own Presidio gate on outbound drafting.

---

## 1. The core reframe (what changed from the PRD, and why)

The original PRD (`BUILD_PLAN.md`) specified a **reactive email register** in a
Google Sheet: log threads, tag them, triage. Building it surfaced four insights
that reshape the product:

1. **The front door is wrong for this user.** A Sheet + Gmail means constant
   context-switching. The practitioner works in VS Code with a "chief-of-staff"
   skill that reads per-project markdown files and compiles a 07:00 / 21:00
   brief. ACMS should be **another project family in that system**, not a
   separate app. → *md-native, in-editor.*

2. **The inbound flurry is a symptom, not the problem.** The email snowball is
   caused by a communication *the practitioner owed and didn't send*. Silence
   creates a vacuum that fills with chasing mail. → *Model obligations
   proactively; don't parse the firehose reactively.*

3. **Value is asymmetric across the data path.** Outbound is the practitioner's
   own, structured, predictable data — Presidio-gated, safe for AI drafting, and
   where the boring/repetitive work lives (reference write-ups). Inbound is
   third-party, unpredictable data where anonymisation is least reliable. → *Put
   the AI on outbound; keep inbound deterministic/local.*

4. **Email is doing two incompatible jobs.** It carries both *coordination
   during* an assessment and *delivery of confidential products at the end*.
   Conflating them causes both the snowball and the confidentiality exposure. →
   *Split the channels: email coordinates, a shared folder delivers.*

---

## 2. Three conceptual models

### 2.1 The three-tier data path (makes the gate legible)

Every component is labelled by which tier it runs in, so the data path is
readable at a glance:

| Tier | What it is | Runs | Model? | Claude API? |
|---|---|---|---|---|
| **0 — Composition** | Fill a template with case fields (draft email/skeleton), copy a file into a folder | Local (VS Code terminal) | No | No |
| **1 — Rules** | Ingestion, threading, routing to an assessment, the **obligation engine**, suggestion logic | Local | No | No |
| **2 — Language** | Bespoke analysis, drafting in the practitioner's voice, (optionally) reading novel inbound | A model | Yes | **Outbound: Claude API via Presidio gate.** Inbound: never Claude — deterministic, or local model later |

**Rule of the system:** inbound case *content* never reaches the Claude API.
Outbound reaches it only after the practitioner's internal Presidio pipeline.

### 2.2 Two-phase communication (two risks, two mitigations)

| Phase | Purpose | Failure mode | Channel | Mitigation |
|---|---|---|---|---|
| **During** (Stage 1–2) | Coordinate: request, chase, schedule, progress-update | **Silence → snowball** | Email (light, no confidential docs) | **Obligation timers** (§5) |
| **End** (Drafting C → Panel → Complete) | Deliver: report, references, sign-off, outcome | **Confidential docs sprayed over email** | **Shared folder** + email pointer | **Delivery model** (§6) |

After the split, email carries only coordination and "it's ready" pointers. The
confidential products live in a controlled folder.

### 2.3 The obligation model (proactive core)

Tier 1 is **not** "parse inbound." It is a **Communications Obligation Model**:
the map of what an assessment requires the practitioner to communicate, to whom,
by when. Obligations derive only from things already controlled and logged —
**stage**, **elapsed time**, **the practitioner's own recorded actions** — never
from reading email bodies. Inbound then *reconciles* against open obligations (a
match, not a parse). The typology (Request / Relay / Decision / Record) still
classifies each obligation; each now also carries a **phase** and a **channel**.

---

## 3. Architecture (md-native, in VS Code)

```
your-workspace/
  meta/                         ← existing chief-of-staff skill (reads task-lines, compiles 07:00/21:00 brief)
  assessments/
    F-2026-014/
      tasks.md                  ← obligations as task-lines, in YOUR existing format  [Tier 1 writes]
      register.md               ← thread metadata rows, no bodies                     [Tier 1 writes]
      drafts/                   ← working drafts (stay here, never leave)             [Tier 0/2 write]
      _notes → Gmail link        ← depth on demand, never ingested
  ~/Dropbox/Agencies/Shine/F-2026-014/   ← shared, access-controlled DELIVERY folder  [Tier 0 file-copy]
```

- **Feed in:** Gmail connector (already used in session). Reads thread *metadata*
  only for the register; the connector has **no send capability**, so draft-only
  (C4) is enforced at the tool level, not just by discipline.
- **Store:** markdown files in the repo the chief-of-staff already sweeps.
- **Surface:** the practitioner's existing 07:00 / 21:00 compile — ACMS just
  makes comm-tasks and case-issues land in the pool it reads. No new dashboard.
- **Deliver out:** clean finals copied into the local Dropbox-synced folder
  (no Dropbox API needed — the desktop client syncs to all shared members).
- **The one irreducible manual step:** *sending* / *secure-delivering* — a
  deliberate professional-judgement gate, by design.

---

## 4. Assessment lifecycle & who actually does each step

Corrections captured from grilling (⚠ = differs from the original PRD assumption):

- ⚠ **Statutory checks are the agency's job**, not the practitioner's. Tracked
  as an *awaited dependency* (agency → you), never chased by the practitioner.
- ⚠ **References:** the practitioner **drafts** the reference write-up, then
  emails it to the referee **to sign** (the chase is for a *signature*, not for
  content). On receipt, signed references are **forwarded to the agency in a
  batch** (one grouped deliverable per assessment, not per reference).
- ⚠ **The practitioner's own bottleneck is the reference write-up** — boring,
  repetitive, and the true source of delay. Automating it (Tier 2, Presidio-
  gated) is the flagship value of the system.
- ⚠ **Analysis must be decoupled from the signature round-trip** — it triggers
  on interview-complete / draft-ready, *not* on the signed copy returning. This
  shortens the critical path structurally.

---

## 5. Communications Obligation Map (working draft — cadences need real numbers)

Directions: **you→** = practitioner owes it; **→you** = awaited from others.

| # | Stage / trigger | Direction | Type | Phase | Channel | What & why | Due / chase |
|---|---|---|---|---|---|---|---|
| 1 | Referral received | you→agency | Record | During | Email | Acknowledge pickup | ≤ 2 days |
| 2 | Commissioning confirmed | you→agency | Record | During | Email | Confirm terms/scope (trail) | ≤ 3 days |
| 3 | Stage 1 opens | you→applicant | Request | During | Email | Initial docs + consents | on entry |
| 4 | Statutory checks | agency→you | *(awaited)* | During | — | Track; do **not** chase (agency-owned) | flag only if blocking |
| 5 | Referee interview done *(you log)* | —→draft | drafting (auto) | During | — | **Draft the reference write-up** (bottleneck → automate) | ≤ *N* days |
| 6 | Reference drafted | you→referee | Request (signature) | During | Email | Send drafted reference to sign | on draft-ready; chase every **7 days** if unsigned |
| 7 | Reference drafted | you→self | analysis | During | — | Analysis may start — **not gated on the signed copy** | on draft-ready |
| 8 | Signed references received | you→agency | Relay/Record | During | **Folder** | Forward the **batch** of signed references | ≤ 2 days of the last one |
| 9 | Stage 1 running | you→agency | Relay | During | Email | Periodic progress update | every **14 days of silence** |
| 10 | Stage 2 visits | you→applicant | Request | During | Email | Availability / scheduling | on entry |
| 11 | Visit completed *(you log)* | you→applicant | Record | During | Email | Confirm actions / file note | ≤ 3 days |
| 12 | Info need from a visit | you→party | Request | During | Email | The specific thing surfaced | issue; chase every 7 days |
| 13 | Entering Drafting C | you→applicant | Relay+Decision | End | Email(+Folder) | Share draft for factual-accuracy + sign-off | on entry; response ≤ 10 days |
| 14 | Disputed content | you↔applicant | Decision | End | Email | Resolve contested wording | until resolved |
| 15 | QA stage | you→agency | Relay | End | Email | Report in QA / expected panel timing | on entry |
| 16 | Panel date | you↔agency | Decision | End | Email | Agree & confirm | ASAP |
| 17 | **Final report** | you→agency/panel | Record | End | **Folder** | Deliver by panel deadline (hard) | deadline − buffer |
| 18 | Panel outcome | agency→you | Relay | End | Email | Outcome relayed; you record | flag if silent > 5 days post-panel |

**Cross-cutting anti-snowball timers (the failure-mode killers):**
- **Silence timer** — Active assessment, no outbound to a key party in > *N* days → "you've gone quiet, send a holding line."
- **Open-loop timer** — any Request unanswered past its chase cadence → chase task (draft pre-built).
- **Post-event obligation** — any logged event (visit done, doc received) that creates an expected outbound → appears the moment it's logged.

---

## 6. Delivery model (channels)

- **Deliverables** (batched signed references, final report) go to a **shared
  secure folder**, not email attachments.
- **Dropbox agencies:** the assessment folder is shared **once** with the
  agency's members; thereafter *deliver = copy the clean final into the local
  synced folder* (Tier 0, no API, no model, no content crossing anything). One
  move reaches all members.
- **Non-Dropbox agencies:** fallback = their **secure portal** where one exists,
  else **encrypted/password-protected** send — never a plain attachment of
  special-category data. System prepares the file + drafts the covering note; the
  secure send is a deliberate human step.
- **Confidentiality by construction:** working drafts live in
  `assessments/<id>/drafts/` and never leave; only the **clean final** is copied
  to the shared folder. What's yours and what leaves are separated structurally.
- Each deliverable pairs with a **notification email** (Gmail draft): "it's in
  the folder."

---

## 7. Data protection posture

- Inbound case content: **never** to the Claude API (Tier 1 deterministic; Tier 2
  inbound, if ever, is a **local** model — Ollama — deferred past v1).
- Outbound: Claude API only via the practitioner's **internal Presidio pipeline**
  (their existing gate). Reference write-ups, analysis, voice-drafting.
- No message bodies stored anywhere in the register (index, not archive).
- `family_ref` = initials + ref only.
- Confidential documents travel by controlled folder, not email.
- Record in the practice DPIA log (no new processor; a re-indexing of existing
  Gmail data + a controlled-folder delivery channel).

---

## 8. Decisions log

**Locked (explicit):**
- Outbound drafting via Claude API is acceptable **through the practitioner's
  Presidio gate** — it's a predictable stage-derivative of the assessment.
- Deliverables go to a **shared folder (Dropbox-first)**, batched; email demoted
  to notification. Working drafts never leave the workspace.
- References: practitioner drafts → referee signs → batch-forward to agency.
- Statutory checks are agency-owned (awaited, not chased).
- Analysis decoupled from the signed-reference round-trip.

**Provisional (my recommendation — proceeding as baseline, confirm to lock):**
- **P1 — Retire the Google Sheet as the front door; go md-native.** Reuse the
  already-tested `Core` logic (63 passing tests) inside a local tool that writes
  md files. Keep the `.gs` build as reference/fallback (§10).
- **P2 — Inbound = deterministic + human-distil** (metadata ingestion +
  structural auto-suggestions + a one-line human ask on the read you already do).
  Zero inbound content to any model. Local Ollama digester deferred.

---

## 9. Open questions (to finish the plan)

1. **`tasks.md` shape** — the real task-line format + what the chief-of-staff
   skill expects (add the repo, or paste one sanitised snippet).
2. **Folder structure & naming** — do per-assessment Dropbox folders already
   exist, or should the tool create/organise them and enforce a clean-final
   naming convention (e.g. `F-2026-014_References_signed_batch.pdf`)?
3. **Non-Dropbox fallback** — secure portal, or (secure) email?
4. **Cadence numbers** — real values for every *N*-day threshold in §5.
5. **Visit & Drafting/Report stages** — re-sweep with the two lenses (*who
   actually does it* / *where does delivery go*); §5 rows 10–18 are still
   first-draft assumptions.
6. Confirm **P1** and **P2**.

---

## 10. What survives from the Apps Script build

The Sheet front-end is demoted, but the **tested pure logic is fully reusable**
in the md-native tool — it was written Tier-1-clean and dual-runtime for exactly
this:
- `normaliseAddress`, `isOwnAddress`, alias-aware `deriveLastSender` /
  `deriveBallInCourt`, `deriveCounterparties`, `deriveThreadFields`
- `suggestAssessment` (precedence + ambiguity), `parseSubjectTag`
- `mergeUpsert` / `computeUpdatedRow` (idempotent upsert, override protection)
- `mergeTemplate`, id helpers, `planBatches`
- 63 fixture assertions + the no-send gate

`BUILD_PLAN.md` remains as the record of the v0 Sheet artifact.
