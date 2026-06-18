# Synthesis Workbench — App Specification

> **Working name:** "Synthesis Workbench" (placeholder — rename freely).
> **Status:** v1 build spec, ready to hand to Claude Code.
> **Audience:** Claude Code (to build, test, refine) and the maintainer.
>
> Read `DECISIONS.md` alongside this file — it records *why* each choice was made,
> so future decisions stay consistent with the reasoning instead of relitigating it.

---

## 0. One-paragraph definition

The Synthesis Workbench is the **middle layer** of an academic research toolchain:
it sits *above* individual papers and *below* the drafting of a single essay. Its
job is to take a researcher's scattered ideas, notes and highlights and help her
turn them into **propositional claims**, then **stitch those claims into a
structured argument** that answers a specific question. It is built for a busy,
time-poor mature student (full-time NHS leader, parent/carer) studying healthcare
leadership & management — so it optimises for *familiar mental models and a minimal
visible surface*, not novelty. The thinking and the writing stay hers; the app finds,
organises, tests, and structures — it never ghostwrites.

This layer is the high-value gap no existing tool fills: Word drafts prose, Zotero/PDF
readers hold papers, but the claim-formation in between happens in people's heads.

---

## 1. Scope

### In scope (v1)
- The **synthesis layer**: capture → cluster into claims → sequence into an argument → lock decisions.
- A **local, grounded "ask my databank" assistant** (the *supervisor*) available in the app and surfaced to the Word add-in.
- **Projection out**: hand a locked claim-sequence to Word as a styled, cited skeleton (via a companion Office.js add-in).
- **Local-first** storage and retrieval over the researcher's notes, highlights, decisions, and (optionally) full PDF text.

### Out of scope (v1) — see `DECISIONS.md` D-09
- Rebuilding a Word-class editor. **Drafting happens in real Word.**
- A reference manager. **Defer to Zotero / the existing toolchain.**
- Mobile. **Laptop-only** by explicit requirement.
- Cloud sync / multi-user / accounts.
- PDF reading UI (the upstream "reading workbench" feeds atoms in; it is a separate concern).

### Integration assumption
This is designed to drop into an **existing PhD-workspace app** the maintainer is
already building. Where this spec recommends a stack, **prefer the host app's stack**
if it differs. The data model, the supervisor behaviours, and the Word handoff are
the portable core; the shell/UI should match what the host app already does.

### Lineage & where each part lives (so nothing is lost)
The wider vision we started from had three module groups: **Discovery** (field survey,
top-journal finder, paper search), **Read & process** (paper summary, annotation
extraction, note assimilation), **Think** (supervisor critique, Socratic discussant,
argument builder, theory-to-practice), and **Output** (essay, presentation, paper
summary). We deliberately narrowed *this app's v1* to the **synthesis / "Think" layer**
— the claim-formation gap no tool fills — because that is the highest-value, least-served
piece. The other groups are **not dropped**; they live as:
- the companion **`research-workspace/` skills package** (the discovery, read/process,
  think, and output skills, plus the discipline knowledge — see §7.7), and
- the maintainer's **existing PhD-workspace skills** (Zotero ingestion, supervisor,
  paper-extraction/output skills) which this app **reuses** (BUILD.md §0c).

Because claims are **output-agnostic**, the same locked claim-sequence can later project
into an **essay** *or* a **presentation** *or* a dissertation chapter — so the Output group
becomes additional projection targets (a v2 sibling of the Word handoff), not a rebuild.
Discovery and full paper-processing stay upstream/adjacent and feed `Atom`s in. None of
this is in v1 scope (§ Out of scope), but it is recorded here so the narrowing is a
deliberate decision, not a loss.

---

## 2. The user & the constraints that shape every decision

| Constraint | Design consequence |
|---|---|
| Time-poor, often tired, high abandonment risk in week 1 | Familiar mental models; minimal visible surface; always one obvious next action; capture must be frictionless. |
| Microsoft-native (Outlook, Word, Teams, OneDrive) | Reuse Outlook/Word interaction patterns; project to real Word; no novel metaphors. |
| Laptop-only | Local desktop app; no mobile surface; offline-capable. |
| Privacy of her work + academic integrity (Turnitin) | Local-first storage; AI grounds answers in *her* material with provenance, never confabulates; prose stays hers. |
| Discipline: healthcare leadership & management | Rewards critical evaluation + application to practice; claims must carry tension/counter-view; grey literature matters. |

These are non-negotiable design inputs. When a v2 decision conflicts with one of
these, the constraint wins unless the maintainer says otherwise.

---

## 3. Design principles (the constitution)

1. **Familiar model, minimal surface.** Borrow patterns she already has muscle memory for (Outlook inbox, Word bullet outline, Teams chat). Show only what the current step needs. Familiar ≠ cluttered.
2. **The claim is the unit.** This layer thinks in *propositions*, not notes (below it) or paragraphs (above it). Everything in the UI is built around the claim object.
3. **She decides; the AI tests.** The supervisor asks, critiques, proposes, retrieves — it never silently restructures her argument or writes her prose. Agency stays with her.
4. **Grounded or silent.** Every answer about her material cites the source (note/paper/page) or says "you don't have that yet." No confabulation. This is the integrity line and a hard requirement.
5. **Decisions are a state, not a place.** A "decision" is a claim/arrangement she has *locked* (with optional rationale) — same surface, graduated commitment. Locked decisions deterministically drive the Word skeleton.
6. **Local-first.** Her data lives on her laptop. Works offline for everything except live AI calls.
7. **Always answer "what now?"** Never a blank screen. The app proposes the next step from current state.

---

## 4. The three-layer model (where this sits)

```
   READ (separate)         SYNTHESISE (this app)            WRITE (real Word)
 ┌──────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐
 │ PDF + highlights │──▶│ atoms → claims → argument │──▶│ Word + add-in pane   │
 │ (reading bench)  │   │ + locked decisions        │   │ (skeleton + supervisor)│
 └──────────────────┘   └───────────────────────────┘   └──────────────────────┘
                                     │
                          ┌──────────┴───────────┐
                          │  shared local brain  │  (one index: atoms, claims,
                          │  + supervisor (AI)   │   decisions, PDF text)
                          └──────────────────────┘
```

The supervisor and the index are **one engine** surfaced in both the app and the Word
pane — build once, expose twice.

---

## 5. Domain model (the heart — build this first)

Local store. Every object has `id`, `createdAt`, `updatedAt`. Suggested storage: SQLite
(see §9). IDs are app-generated UUIDs.

### 5.1 Assignment
The live question everything is anchored to. One active at a time.
```
Assignment {
  id
  title            // exact essay/question title
  module           // e.g. "Leading Change in Health & Social Care"
  type             // critical essay | reflective | case analysis | presentation
  wordCount        // target
  deadline
  markingCriteria  // free text, drives supervisor weighting
  thesis           // her working line of argument (one or two sentences; evolves)
}
```

### 5.2 Source
A paper/report the atoms come from. Mirrors the reading layer / Zotero.
```
Source {
  id
  authors, year, title, venue   // for citation
  doiOrUrl
  kind            // peer-reviewed | grey | book | policy
  citationKey     // AuthorYear
  fullTextPath?   // optional path to the PDF text for full-library search
}
```

### 5.3 Atom  (the captured idea — input from the layer below)
The smallest unit: a highlight+comment, or her own jotted thought.
```
Atom {
  id
  kind            // highlight | quote | her_note | reflection
  text            // the quote OR her thought
  comment?        // her margin comment on a highlight
  sourceId?       // null for her own thoughts
  page?
  isHers          // true = her voice (reflection/note/comment); must stay distinct
  themeTags[]     // suggested by Haiku, confirmable by her
  status          // inbox | placed   (placed = attached to a claim)
}
```

### 5.4 Claim  (the native unit of this layer)
A defensible proposition. A claim that carries all five parts *is* a paragraph that earns marks.
```
Claim {
  id
  assertion       // one sentence, HER words
  supportingAtomIds[]   // the cluster = evidence
  tension         // counter-evidence / who disagrees (the critical dimension)
  tensionAtomIds[]      // atoms that support the counter-view
  status          // speculative | supported | locked
  rationale?      // why she locked it (captured at lock time)
  role            // which part of the answer it serves (intro|theme|counter|conclusion|unassigned)
}
```
Validation that drives UI affordances (not hard blocks):
- `supported` requires ≥1 supportingAtom.
- `locked` requires assertion + ≥1 supportingAtom; UI *warns* (doesn't block) if `tension` is empty, because critical evaluation needs it.

### 5.5 ArgumentStructure  (claims sequenced into an answer)
```
ArgumentStructure {
  id
  assignmentId
  orderedClaimIds[]     // the sequence = the argument
  sectionLabels{}       // optional headings grouping claims
}
```

### 5.6 Decision  (a graduated state, surfaced as a view — not a separate table)
A "decision" = a Claim with `status: locked`, OR a locked ArgumentStructure. The
**Decisions view** is a filter over locked items. Locked items + the structure are the
**deterministic input to the Word skeleton** (§8).

---

## 6. The synthesis workbench UI (the main build)

Reuse the **Outlook three-pane** layout — familiar, minimal. Single window.

```
┌───────────┬─────────────────────────────┬──────────────────────────┐
│ LEFT      │ CENTRE                       │ RIGHT                    │
│ nav/folders│ inbox of atoms  OR          │ supervisor pane          │
│ (plain    │ claim cards / outline        │ (chat + query databank)  │
│  English) │                              │                          │
└───────────┴─────────────────────────────┴──────────────────────────┘
```

Left rail labels (her words, **not** model names): *Assignment · Capture · Claims · Argument · Decisions · Supervisor.*

### 6.1 Capture (frictionless)
- An **inbox** of loose atoms (auto-arrived from the reading layer + a dumb-fast "jot" box).
- One-key jot; no required fields; filing happens later.
- Her notes/reflections rendered **visually distinct** from source quotes (`isHers`).
- Haiku suggests `themeTags`; she can ignore them. (See §7, model routing.)

### 6.2 Clustering — atoms → claim (the "making meaning" gesture)
- Drag atoms from the inbox onto a claim card (or "new claim from selection").
- A **Claim card** shows: assertion (editable, her words) · supporting cluster · tension · status chip · role.
- The supervisor *suggests* ("these 4 atoms look like one claim — group them?", "this claim has no evidence yet", "what's the counter-view?") — **she** drags and edits.

### 6.3 Sequencing — claims → argument (the "making the answer" gesture)
- Right pane (or a dedicated Argument view) shows claims as a **draggable nested outline** (Tab to indent, drag to reorder — Word bullet-list muscle memory).
- Default surface is the **outline**; an optional **card-board** view is a v1.1 toggle (see `DECISIONS.md` D-07).
- Supervisor checks the *sequence* ("does this order build an argument or list points?", "this counter-claim isn't engaged anywhere").

### 6.4 Locking — claims/structure → decisions
- A claim or the whole structure can be **locked** (pin affordance), capturing optional `rationale`.
- Locked items are visually pinned and **stop the supervisor relitigating them** (it won't propose restructuring locked decisions unless she unlocks).
- The Decisions view lists everything locked + the rationale — "what have I decided, and why."

### 6.5 The always-present "next action"
A single, dismissible suggestion bar driven by state, e.g.:
- atoms in inbox > 0 → "You have N unfiled notes — cluster them into claims?"
- claims with no tension → "3 claims have no counter-view yet — these lose marks. Add one?"
- structure locked → "Ready to build your Word outline?"

---

## 7. The supervisor & AI integration

The supervisor is the **only** AI surface. It does four jobs, all grounded in her databank:
1. **Test claims** — "is that one claim or two?", "what's your evidence?", "what's the counter-claim?", "does this help answer the title?"
2. **Check sequences** — argument coherence, gaps, unengaged counter-views.
3. **Answer "ask my databank"** — summarise her notes on X, find what she highlighted, recall a past decision *and its rationale*.
4. **Suggest, never decide** — proposals she accepts/rejects; never silent edits; never prose for submission.

### 7.1 Provider & SDK
- Anthropic Claude API via the official SDK (`@anthropic-ai/sdk` for TS — recommended; `anthropic` for Python if the host app is Python).
- **Never hardcode the API key.** Resolve from OS keychain / env (`ANTHROPIC_API_KEY`). See §11 key handling.

### 7.2 Model routing (current IDs & prices, cached 2026-06)

| Job | Model | ID | Price /MTok (in/out) | Why |
|---|---|---|---|---|
| Claim-testing, sequence critique, structured synthesis | **Opus 4.8** (default) | `claude-opus-4-8` | $5 / $25 | Hardest reasoning; the marks live here. 1M context. |
| Interactive "ask my databank" Q&A, paper summaries | **Sonnet 4.6** | `claude-sonnet-4-6` | $3 / $15 | Fast, cheap enough for high-volume chat. 1M context. |
| Atom theme-tagging, cheap classification | **Haiku 4.5** | `claude-haiku-4-5` | $1 / $5 | Fast/cheap; 200K context is ample for one atom. |

> Default to `claude-opus-4-8` unless a route is explicitly cost/latency-sensitive.
> Make the model per-route configurable (a settings map), not hardcoded at call sites.

### 7.3 Request conventions (per the Anthropic SDK)
- **Adaptive thinking** on the reasoning routes: `thinking: {type: "adaptive"}`. For user-visible reasoning, set `display: "summarized"`.
- **Stream** anything long (supervisor turns, summaries, the draft handoff): use the SDK stream helper + `getFinalMessage()`/`finalMessage()`. Default `max_tokens` ~16000 non-streaming, ~64000 streaming.
- **No `temperature`/`budget_tokens`** on Opus 4.8 (they 400) — control depth via `output_config.effort` (`low|medium|high|max`); use `high` for claim-testing.
- Handle `stop_reason: "refusal"` defensively before reading content (benign academic content shouldn't trigger it, but don't index `content[0]` blind).

### 7.4 Retrieval-grounded answers (tool use)
"Ask my databank" must answer from *her* material, not the model's knowledge. Use a
**client-side tool-use loop**: expose a `search_databank` tool; the model calls it; the
app runs local retrieval (§8); results return as `tool_result`; the model answers
**citing the returned chunks**, or says it found nothing.

```ts
// sketch — TS SDK, manual loop (gives us control over grounding + provenance)
const tools = [{
  name: "search_databank",
  description: "Search the researcher's own notes, highlights, claims, decisions, and (if asked) full PDF text. Returns chunks with source + page. Use this before answering anything about her material; never answer her-material questions from general knowledge.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string" },
      scope: { type: "string", enum: ["notes", "claims", "decisions", "full_pdfs", "all"] }
    },
    required: ["query"]
  }
}];

// loop: create → if stop_reason==="tool_use", run local search, feed tool_result, repeat.
// System prompt enforces: cite every claim as (source, page); if search returns nothing,
// say "You don't have notes on that yet" — do NOT fill the gap from general knowledge.
```

System-prompt rules for the supervisor (grounding + integrity):
- Answer her-material questions **only** from `search_databank` results; cite each (source/page/note).
- If retrieval is empty, say so plainly; never substitute general knowledge as if it were hers.
- Reflective/first-person and analytical prose stays hers; offer structure and questions, not submittable text.
- Don't propose restructuring **locked** decisions unless she unlocks them.

### 7.5 Prompt caching (cost control)
The supervisor re-sends a large stable prefix every turn (assignment + locked decisions
+ relevant notes). Put that prefix first with a `cache_control` breakpoint so repeated
turns read from cache (~0.1× input cost); keep the volatile user turn last. Verify with
`usage.cache_read_input_tokens`. (See Anthropic prompt-caching guidance.)

### 7.6 Structured outputs
When extracting a claim from selected atoms, or proposing a claim's parts, use
`output_config.format` with a JSON schema matching the `Claim` shape (§5.4) so the result
parses deterministically into the model. Use `strict: true` tools where the model fills a
fixed structure.

### 7.7 Discipline knowledge the supervisor should draw on
The student is in **healthcare leadership & management**; the supervisor's critique and
citations must reflect that. Wire it to the workspace's domain knowledge (it already exists
in `research-workspace/knowledge/` — reuse, don't re-author):
- **Frameworks + their critiques** — leadership/change/QI models (transformational vs
  transactional, compassionate/collective, system leadership, Kotter, Lewin, PDSA, etc.)
  so claim-testing can name a model *and* its standard critique (critical evaluation earns marks).
- **Sources** — credible **grey literature** (King's Fund, Nuffield Trust, Health Foundation,
  NHS England, CQC, NICE) ranks as legitimate evidence alongside peer-reviewed journals.
- **Citation style** — **Harvard (Cite Them Right)** is the default for cited bullets and
  references (§10). Keep it in one config value; **confirm against her module handbook** —
  if it differs (e.g. APA 7th), change that one value and everything follows.
- **What earns marks** — bias the supervisor toward *critical evaluation* and *application
  to her NHS practice*, not description.

---

## 8. Retrieval / the databank (local, offline-capable)

> **Constraint:** Anthropic has **no embeddings endpoint.** For local-first + offline,
> semantic search needs either a local embedding model or a third-party embeddings
> provider. So the baseline is keyword search, with semantic as an optional upgrade.

- **Index source:** all `Atom.text/comment`, `Claim.assertion/tension/rationale`,
  `Decision` rationale, and (opt-in) `Source.fullTextPath` PDF text.
- **Baseline (always works, offline, no model):** SQLite **FTS5** full-text search (BM25).
  Ship this first — it makes "ask my databank" functional with zero extra dependencies.
- **Optional semantic upgrade:** a **local embedding model** (e.g. a small
  sentence-transformer / ONNX model bundled with the app) → store vectors in SQLite
  (`sqlite-vec` or similar) → hybrid rank (FTS5 + vector). Keeps everything offline.
- **Ranking priority:** her **curated** notes/claims/decisions rank above raw PDF
  full-text. Full-library PDF search only when she sets `scope: "full_pdfs"` or "all".
- **Provenance is mandatory:** every returned chunk carries `{sourceId, page, atomId|claimId}`
  so the supervisor can cite it and she can click through.
- **Re-index** incrementally on write (new atom/claim) and on PDF import; keep it current.

---

## 9. Architecture & stack

> Recommended defaults below; **match the host app's stack if integrating.**

- **Shell:** local **desktop app** (installs/opens like Word; files local; offline). Recommended **Tauri** (light, Rust core + web UI) or **Electron** if the host app already uses it. Rationale in `DECISIONS.md` D-08.
- **UI:** web tech (TS + a component framework). This also matches the Word add-in (Office.js is web/TS), so the supervisor pane UI can be shared between app and add-in.
- **Storage:** **SQLite** (local file) for the domain model + **FTS5** index; `sqlite-vec` for optional vectors. PDFs stay where they are (OneDrive folders); store paths, not blobs.
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`), models per §7.2.
- **Word handoff:** a companion **Office.js task-pane add-in** (§8/§10) sharing the supervisor engine + reading the same SQLite databank.

```
synthesis-workbench/
  app/            desktop shell + UI (three-pane workbench)
  core/           domain model, SQLite access, retrieval (FTS5 [+ vectors])
  supervisor/     Claude client: routing, tool-use loop, caching, prompts
  word-addin/     Office.js task pane (skeleton injection + supervisor pane)
  shared/         types (Claim, Atom, …), supervisor UI components
```

---

## 10. The Word handoff (companion add-in)

A separate but bundled deliverable; depends on the same `core` + `supervisor`.

- **Skeleton injection:** from a **locked** ArgumentStructure, the add-in writes a Word
  document skeleton: real **heading styles** per section (so it appears in the Navigation
  Pane), each claim's assertion as the section lead, supporting atoms as **cited bullets**
  (Harvard, drawn from real sources), placeholder **content controls** (`[Your argument — ~N words]`),
  and the per-section word budget + supervisor notes as **native Word comments**.
- **Determinism:** the skeleton is a pure projection of locked decisions — no improvisation.
- **In-pane supervisor:** the same "ask my databank" + critique surface, reading the shared
  databank, so she never leaves Word mid-draft. Feedback lands as Word comments.
- **Setup caveat (document this for the user):** an Office add-in must be **sideloaded once**
  and runs in **Word desktop**. One-time, minor — but real.

Office.js capabilities relied on (all standard): `insertParagraph` + built-in heading styles,
content controls, `Range.insertComment`, reading document text back for critique.

---

## 11. Cross-cutting requirements

- **API key handling:** store in OS keychain (or `.env` for dev); never in the repo, never
  in logs, never sent to the model as content. Surface a first-run "paste your Anthropic key"
  step. Decide with maintainer whether the maintainer supplies a managed key or she brings her own.
- **Cost visibility:** show running token spend (read `usage`); cache the stable prefix (§7.5);
  route cheap jobs to Haiku/Sonnet.
- **Offline behaviour:** capture, clustering, sequencing, locking, FTS5 search, and the Word
  skeleton all work offline. Only live supervisor calls need network — degrade gracefully
  ("supervisor offline; your work is saved").
- **Accessibility & tired-user UX:** keyboard-first (Tab/drag/lock shortcuts); large hit targets;
  autosave everything; resume exactly where she left off on reopen.
- **Privacy:** local-first; nothing leaves the machine except the minimum context sent on a
  supervisor call. Make "what gets sent to the AI" inspectable.

---

## 12. Build plan (milestones — sequence for Claude Code)

Each milestone ends runnable + tested.

- **M0 — Scaffold.** Repo structure (§9), desktop shell opens, empty SQLite created, settings (model map, key).
- **M1 — Domain + store.** Implement §5 model in SQLite; CRUD; migrations; unit tests on validation rules.
- **M2 — Capture.** Atom inbox + jot box; import atoms from the reading layer (define the import format); `isHers` styling; Haiku tagging (mockable).
- **M3 — Claims + clustering.** Claim cards; drag atoms → cluster; assertion editing; status transitions; structured-output claim extraction.
- **M4 — Argument + locking.** Draggable nested outline; sequencing; lock → Decisions view; next-action bar.
- **M5 — Supervisor + retrieval.** FTS5 index; `search_databank` tool-use loop; grounded Q&A with provenance; claim-testing & sequence-check prompts; prompt caching; streaming. **Grounding tests are mandatory here.**
- **M6 — Word handoff.** Office.js add-in: skeleton injection from locked structure; in-pane supervisor; Word comments. Sideloading doc.
- **M7 — Polish.** Offline degradation, cost meter, autosave/resume, keyboard UX, the "tired 25-minute" pass (§13).
- **v1.1 (deferred):** local embedding semantic search; card-board sequencing view; full-PDF-library search UX.

---

## 13. Testing strategy

- **Unit:** domain validation (claim lock rules, decision = locked filter), retrieval ranking (curated > raw PDF), citation formatting.
- **Retrieval grounding (critical):** golden tests that the supervisor (a) cites real returned chunks, (b) says "not in your notes" when retrieval is empty, (c) **never** answers a her-material question from general knowledge. Treat a confabulation as a failing test.
- **Projection:** locked structure → Word skeleton produces correct heading styles, cited bullets, placeholders, comments; round-trips deterministically.
- **AI-output checks:** claim-testing returns questions+critique (not prose); supervisor refuses to draft submittable text; doesn't touch locked decisions.
- **UX acceptance — the tired-25-minute test:** a fresh user, no manual, after a long day, can in ~25 minutes: capture notes → form 2 claims → sequence them → lock → ask one databank question → get a Word skeleton. If she can't, the surface is too big.
- **Offline:** every non-AI feature works with the network off.

---

## 14. Acceptance criteria (v1 done)

1. Atoms can be captured (and imported), tagged, and filed; her voice stays visually distinct.
2. Claims can be formed by clustering atoms, edited in her words, given tension, and locked with rationale.
3. Claims can be sequenced into an argument by drag/indent; the structure can be locked.
4. The supervisor answers questions about her databank **with provenance**, and **demonstrably refuses to confabulate** when she has no relevant notes.
5. The supervisor tests claims and checks sequences with questions/critique — and never writes submittable prose or edits locked decisions.
6. A locked structure injects into Word as a styled, cited skeleton with placeholders and comments.
7. Everything except live AI calls works offline; work autosaves and resumes.
8. The tired-25-minute test passes.
