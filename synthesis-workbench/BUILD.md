# Synthesis Workbench — Build Brief (execute on Claude Code)

> **How to use this:** open your existing PhD-workspace project in Claude Code on your
> laptop, drop this file (plus `SPEC.md` and `DECISIONS.md`) into it, and paste the
> kickoff prompt in §8. Claude Code then runs Phase 0 (bootstrap + discovery) and builds
> in vertical slices, checking in at the gates. Minimal input from you after kickoff.
>
> `SPEC.md` = full specification. `DECISIONS.md` = why each choice was made (don't
> relitigate). This file = the *executable plan*.

---

## 1. Context & premise

We are **not** building greenfield. This adds a **synthesis layer** — the claim-formation
middle layer that sits *above* individual papers and *below* drafting an essay — into an
**existing PhD-workspace app** that already:
- pulls notes/annotations from **Zotero**, and
- has a **supervisor app** that critiques writing.

Reuse those. The genuinely new work is: the **claim domain model**, the **synthesis UI**
(capture → cluster into claims → sequence into an argument → lock decisions), grounded
**"ask my databank"** retrieval (if the existing supervisor doesn't already do it), and
the **Word skeleton handoff**.

Built for a time-poor mature student (senior NHS leader). Non-negotiables: *familiar
model + minimal surface; she decides, the AI tests; grounded-or-silent (never
confabulate); local-first.* See `DECISIONS.md`.

---

## 2. Phase 0 — Bootstrap & discovery (DO THIS FIRST, before any code)

Run these three steps, then **stop and report back** (Gate A) before writing code.

### 0a. Obey global rules
- Read the project's `CLAUDE.md` (and any user-level `~/.claude/CLAUDE.md`) and **obey all
  global commands** — including building and testing in **vertical slices, not horizontal
  layers**, and testing as you go. This brief does **not** override global rules; where it
  restates them, treat them as binding. If anything here conflicts with a global rule,
  the global rule wins — flag the conflict.

### 0b. Ensure the required skills are installed
Before building, make sure the front-end/UI engineering skill and the **superpowers** skill
are available; install whatever is missing. Discover first, install only if absent:

```bash
# Inspect what's already present
/plugin                      # list installed plugins/marketplaces
ls ~/.claude/skills 2>/dev/null
ls ~/.claude/plugins 2>/dev/null
```

```bash
# If the superpowers skill is missing, add its marketplace and install it.
# (Adjust the marketplace source to the one you use; skip if already installed.)
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# If a front-end / UI-engineering skill is missing, install yours the same way
# (from your marketplace). Use the current /plugin workflow; if unsure of the exact
# source, search the marketplace rather than guessing.
```

Confirm both load before proceeding. Use these skills throughout: the front-end skill for
the workbench UI, superpowers for the build methodology.

### 0c. Review the existing workspace to inform the build
Before designing anything, **review and learn from what already exists**, then produce a
short written brief. Specifically:
- **Skills:** read all skills in the PhD workspace — especially those for **output,
  processing, and extracting points from papers**. Note which are reusable here (e.g. an
  extraction skill that can feed `Atom`s; an output skill that informs the Word handoff).
- **Past build sessions:** review any build journals, session notes, `lessons/`,
  changelogs, or decision logs from previous builds in this workspace. Carry forward what
  worked and avoid past mistakes.
- **Architecture & stack:** identify the language, framework, UI toolkit, storage, and how
  the **Zotero ingestion** and **supervisor** are implemented and invoked.

Output a **Reuse & Lessons Brief**:
1. A table mapping spec modules → existing component (reuse / extend / build-new).
2. Key lessons from past sessions that should shape this build.
3. The confirmed stack and where the synthesis layer will live in the repo.
4. The Slice 0 plan (below), adapted to the real stack.

**Gate A — stop here and report the Reuse & Lessons Brief before writing code.**

---

## 3. Operating rules (binding for the whole build)

- **Vertical slices only.** Each slice cuts top-to-bottom through data → logic → UI for
  **one capability**, ending **runnable and demoable**. Never build a horizontal layer
  (e.g. "all the data models", "all the UI") in isolation.
- **Test as you go.** Each slice ships with tests for its logic; the slice is not done
  until its tests pass and it runs. Prefer writing the test first where it's natural.
- **One slice at a time.** Finish, test, and demo a slice before starting the next.
- **Stop at the gates.** At each `Gate`, stop and report (what's done, what's tested, any
  decisions needed) before continuing. Otherwise proceed without asking.
- **Reuse before building.** Wire to the existing Zotero ingestion and supervisor rather
  than reimplementing them.
- **Integrity is a test, not a nicety.** "The supervisor confabulated about her notes" and
  "the supervisor wrote submittable prose" are **failing tests** (see Slice 4–5).
- **Match the existing app's stack and conventions.** Don't introduce a new framework.

---

## 4. Architecture fit

Defer to the existing stack. The portable core to add:
- **Domain model** (the claim layer) — §5 below / `SPEC.md` §5.
- **Supervisor modes** — extend the existing supervisor with *claim-testing* and
  *sequence-checking*, plus grounded *ask-my-databank* if absent.
- **Word handoff** — Office.js task-pane add-in projecting locked decisions into Word.

Keep the synthesis layer in its own module/folder within the existing app so it's
self-contained but shares storage, the Zotero adapter, and the supervisor client.

---

## 5. Domain model (essentials — full detail in `SPEC.md` §5)

The **claim is the native unit** of this layer.

- **Atom** — a captured idea: a highlight+comment or her own note. `{ kind, text, comment?,
  sourceId?, page?, isHers, themeTags[], status: inbox|placed }`. Fed by the **Zotero
  adapter**. Her own notes/reflections (`isHers`) must stay visually distinct from source quotes.
- **Claim** — a defensible proposition: `{ assertion (her words), supportingAtomIds[],
  tension, tensionAtomIds[], status: speculative|supported|locked, rationale?, role }`.
  A claim carrying all parts *is* a paragraph that earns marks.
- **ArgumentStructure** — `{ assignmentId, orderedClaimIds[], sectionLabels{} }` — the
  sequence *is* the argument.
- **Decision** — not a separate table: a **locked** Claim/ArgumentStructure (with
  rationale), surfaced via a Decisions filter. Locked items deterministically drive the
  Word skeleton.
- **Assignment** — the live question (title, criteria, word count, thesis) everything anchors to.

---

## 6. The build — vertical slices

Each slice: **Goal · Touches · Done-when (demoable) · Tests.** Build in order.

### Slice 0 — Walking skeleton
- **Goal:** the app opens, an `Assignment` and a single `Claim` can be created, persisted, and shown.
- **Touches:** storage + `Assignment`/`Claim` model + a minimal screen, inside the existing app shell.
- **Done-when:** create an assignment, type a claim assertion, reload → it persists and displays.
- **Tests:** model CRUD + persistence round-trip.
- **Gate B — report after Slice 0.**

### Slice 1 — Capture one atom → form one claim (end-to-end, reusing Zotero)
- **Goal:** pull at least one real atom from the **existing Zotero ingestion**, show it in a capture inbox, and form a claim from it.
- **Touches:** Zotero adapter → `Atom`; inbox UI; "new claim from atom"; `isHers` styling.
- **Done-when:** a real Zotero note appears as an atom and can become a claim's supporting evidence.
- **Tests:** Zotero→Atom mapping; atom status inbox→placed.

### Slice 2 — Cluster + tension + status
- **Goal:** drag multiple atoms onto a claim; add a counter-view (`tension`); status speculative→supported.
- **Touches:** clustering UI (drag); claim card with cluster + tension; structured-output claim extraction (optional).
- **Done-when:** a claim shows several atoms + a tension and reaches `supported`.
- **Tests:** clustering rules; `supported` requires ≥1 atom.

### Slice 3 — Sequence into an outline + lock (decisions)
- **Goal:** order claims as a draggable nested outline (Tab to indent, drag to reorder); lock claims/structure; Decisions view.
- **Touches:** `ArgumentStructure`; outline UI; lock affordance + rationale; Decisions filter; "next action" bar.
- **Done-when:** claims are sequenced, locked with rationale, and listed in Decisions.
- **Tests:** ordering persistence; decision = locked filter; locked items immutable until unlocked.
- **Gate C — report after Slice 3 (the synthesis core is now usable offline, no AI yet).**

### Slice 4 — Supervisor: claim-testing (reuse + extend existing supervisor)
- **Goal:** on a real claim, the supervisor returns questions + critique (one claim or two? evidence? counter-claim? answers the title?).
- **Touches:** extend the existing supervisor with a claim-testing mode; route to the right model per `SPEC.md` §7.2 (default `claude-opus-4-8`); stream; adaptive thinking.
- **Done-when:** select a claim → get useful questions/critique, **no prose to submit**, **doesn't edit locked decisions**.
- **Tests (integrity, mandatory):** returns questions/critique not submittable prose; refuses to draft; leaves locked decisions untouched.

### Slice 5 — Grounded "ask my databank"
- **Goal:** ask "summarise my notes on X / what did I decide about Y" and get an answer grounded in *her* material, with provenance — or "you don't have that yet."
- **Touches:** local retrieval (SQLite **FTS5** baseline, per `SPEC.md` §8); `search_databank` tool-use loop; provenance (source/page); curated notes rank above raw PDF text. (If the existing supervisor already retrieves over her notes, extend it instead.)
- **Done-when:** real questions return cited answers; an unknown topic returns an explicit "not in your notes."
- **Tests (integrity, mandatory):** every answer cites returned chunks; empty retrieval → explicit not-found; **confabulation = failing test.**
- **Gate D — report after Slice 5.**

### Slice 6 — Word skeleton handoff (Office.js add-in)
- **Goal:** from a **locked** ArgumentStructure, inject a Word skeleton: heading styles per section, claim assertions as section leads, supporting atoms as cited bullets (Harvard), placeholder content controls, word budget + supervisor notes as Word comments. Surface the supervisor in the pane.
- **Touches:** Office.js task-pane add-in sharing the core + supervisor; deterministic projection of locked decisions.
- **Done-when:** locked structure produces a correct, navigable Word skeleton with placeholders + comments; document the one-time sideload.
- **Tests:** projection determinism; heading styles/bullets/comments correct.

### Slice 7 — Polish
- **Goal:** offline degradation, autosave/resume, cost meter, keyboard UX, the **tired-25-minute test** (`SPEC.md` §13).
- **Done-when:** a fresh tired user, no manual, in ~25 min: capture → 2 claims → sequence → lock → ask one databank question → Word skeleton.

---

## 7. Reference
- `SPEC.md` — full specification (domain model, supervisor/AI integration, retrieval, stack, Word handoff, testing, acceptance).
- `DECISIONS.md` — rationale (ADR log). Read before changing a decision.

---

## 8. Kickoff prompt (paste into Claude Code on the laptop)

> Read `BUILD.md`, `SPEC.md`, and `DECISIONS.md` in this project. Then execute **Phase 0**:
> obey my global `CLAUDE.md`; ensure the front-end skill and the `superpowers` skill are
> installed (install if missing per BUILD.md §0b); and review my existing PhD-workspace
> skills (especially output / processing / paper-extraction), past build-session notes, and
> the Zotero + supervisor implementations. Produce the **Reuse & Lessons Brief** and the
> Slice 0 plan, then **stop at Gate A** for my confirmation.
> After I confirm, build the **Synthesis Workbench** strictly in **vertical slices**
> (BUILD.md §6), testing each slice before the next, reusing my Zotero ingestion and
> supervisor, and stopping at each gate. Keep the thinking and writing mine — the
> supervisor tests and structures, it never ghostwrites or confabulates.
