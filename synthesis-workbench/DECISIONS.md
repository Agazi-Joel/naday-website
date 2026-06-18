# Decisions & rationale (ADR log)

Why the Synthesis Workbench is the way it is. Each entry: the decision, the reasoning,
the alternatives rejected, and consequences. **Read this before changing a decision** —
it captures judgement calls from the design conversation so future choices stay
consistent instead of relitigating settled ground. When a new decision is made, append
an entry rather than editing history.

Format: **D-NN — Decision.** Context · Decision · Why · Rejected · Consequences.

---

### D-01 — Optimise for familiarity over minimalist novelty
- **Context:** The user is a time-poor mature student (senior NHS leader, parent/carer). Highest risk is week-1 abandonment.
- **Decision:** Adopt familiar mental models (Outlook three-pane, Word bullet outline, Teams-style chat) as the organising metaphor.
- **Why:** Jakob's Law — the tax that breaks a tired learner is a *new mental model*, not a tidy screen. Minimising the learning curve protects adoption.
- **Rejected:** A clean, novel, minimalist UI (elegant but high onboarding cost); a chat-first blank box (the "what do I type?" problem).
- **Consequences:** UI borrows interaction *patterns*, not visual chrome. Familiarity and minimalism are treated as orthogonal — we want both ("familiar model, minimal surface").

### D-02 — "Familiar" is concretely the Microsoft/Office world
- **Context:** Confirmed the user lives in Outlook, Word, Teams, OneDrive, WhatsApp.
- **Decision:** Target Office visual/interaction language specifically; reuse the Outlook three-pane layout and Word bullet-outline gestures.
- **Why:** Familiarity only reduces the curve if it maps to *her* actual daily tools.
- **Consequences:** The Word handoff (D-05) and the outline-first sequencing surface (D-07) follow directly.

### D-03 — Don't put the front door in a terminal
- **Context:** The capability was first prototyped as Claude Code skills (a CLI).
- **Decision:** Keep the skill *logic* as the engine; replace the terminal front door with a GUI app.
- **Why:** A command line is the *most* unfamiliar interface possible for this persona — it contradicts D-01. The engine is reusable; the front door is not.
- **Consequences:** Skills become buttons/behaviours inside the app; nothing of the thinking is lost.

### D-04 — The app is a command-centre, not a monolith (don't reinvent Word/files)
- **Context:** "Proper app" could mean all-in-one or a wrapper around real tools.
- **Decision:** Build the synthesis layer + supervisor + databank; defer drafting to real Word and files to real OneDrive folders.
- **Why:** Rebuilding a Word-class editor is the hardest, most bug-prone part and would never beat the Word she trusts. A buggy editor that dies mid-deadline is worse than no editor. More familiar *and* less to build.
- **Rejected:** Option A all-in-one with its own editor.
- **Consequences:** Out-of-scope list (SPEC §1); Word handoff via add-in (D-05).

### D-05 — Writing lives "in Word" via an Office.js task-pane add-in
- **Context:** She juggles app + Word + PDFs; wants the interface "in Word" without leaving.
- **Decision:** For the *writing* phase, the supervisor and skeleton injection run inside Word as a task-pane add-in (the Grammarly/Editor pattern). Reading stays in the app; PDFs can't sensibly live in Word.
- **Why:** It's the only way to be genuinely "in Word" without rebuilding Word; feedback as native comments is maximally familiar; collapses app+Word into one window for writing.
- **Consequences:** Two purpose-built surfaces (read-bench in app, write in Word), one shared brain. Accept the one-time add-in sideloading + Word-desktop requirement (SPEC §10).

### D-06 — The claim (proposition) is the native unit of this layer
- **Context:** Defining what the middle layer manipulates.
- **Decision:** Build everything around the `Claim` object: assertion (her words) + supporting cluster + tension + status + role.
- **Why:** The note belongs to the layer below (evidence); the paragraph to the layer above (prose). A claim carrying all five parts *is* a paragraph that earns marks — it matches what the discipline rewards (critical evaluation + application).
- **Consequences:** UI, retrieval, structured outputs, and the Word skeleton all key off `Claim`.

### D-07 — Sequencing surface is an outline first; card-board is deferred
- **Context:** "Aligning points into a loose structure" could be a nested outline or a spatial card board.
- **Decision:** Ship the **nested draggable outline** (Tab to indent, drag to reorder) in v1; make the card-board view a v1.1 toggle.
- **Why:** Indent/reorder is Word muscle memory (familiar, D-02). A spatial board is powerful but a newer metaphor; add only if she turns out to think spatially.
- **Consequences:** v1 has one structuring surface; lower build cost; revisit with real usage.

### D-08 — Local desktop app, local-first storage
- **Context:** Laptop-only requirement; privacy of academic work; offline use in fragments.
- **Decision:** Desktop shell (Tauri recommended, Electron if host app uses it); SQLite local store; PDFs stay as OneDrive paths.
- **Why:** Matches laptop-only; no login/hosting friction; her material stays on her machine (integrity/privacy); works offline. A web app with a login adds setup friction and a server to maintain.
- **Rejected:** Cloud web app; server-side store.
- **Consequences:** Offline-capable design (SPEC §11); AI calls are the only network dependency.

### D-09 — Scope discipline: no editor, no reference manager, no mobile, no cloud (v1)
- **Context:** Risk of the "proper app" ballooning.
- **Decision:** Explicit non-goals (SPEC §1).
- **Why:** Each is well-served by an existing trusted tool (Word, Zotero) or excluded by requirement (mobile, multi-user). Focus the build on the unfilled gap — the synthesis layer.
- **Consequences:** Smaller, shippable v1; integration over reinvention.

### D-10 — She decides; the AI tests (agency stays with her)
- **Context:** Risk of an AI that quietly restructures her argument or writes her essay.
- **Decision:** The supervisor asks, critiques, proposes, and retrieves — it never silently edits structure, never writes submittable prose, and won't touch *locked* decisions.
- **Why:** The argument and the marks are hers; reflective/analytical voice must be hers (Turnitin + learning). Inherited from the Socratic-discussant ethos of the original skills.
- **Consequences:** System-prompt rules (SPEC §7.4); acceptance criteria 4–5; the "lock = stop relitigating" behaviour (D-12).

### D-11 — Grounded retrieval with provenance, or explicit silence — never confabulate
- **Context:** "Ask my databank" must reflect *her* material, not the model's general knowledge.
- **Decision:** Retrieval-grounded answers via a `search_databank` tool-use loop; every answer cites the returned source/page; empty retrieval → "you don't have that yet."
- **Why:** A databank assistant that makes things up is worse than none — and it's the academic-integrity line. The earlier note-assimilation pipeline exists precisely to build a good index for this.
- **Consequences:** Mandatory grounding tests (SPEC §13); provenance carried through retrieval (SPEC §8); confabulation = failing test.

### D-12 — Decisions are a graduated *state*, not a separate place
- **Context:** Avoid three separate interfaces (notes / planning / decisions).
- **Decision:** One board where items flow captured → organised → locked. A "decision" is a locked claim/structure (with rationale), shown via a Decisions filter.
- **Why:** Minimal surface (D-01); decisions made once, deliberately; locked items deterministically drive the Word skeleton and stop the AI relitigating at 11pm.
- **Consequences:** No separate Decision table (SPEC §5.6); lock affordance; Word skeleton is a pure projection of locked state.

### D-13 — Model routing: Opus 4.8 default, Sonnet/Haiku for cheaper jobs
- **Context:** Cost vs capability across very different AI jobs.
- **Decision:** `claude-opus-4-8` for claim-testing/sequencing/synthesis; `claude-sonnet-4-6` for interactive Q&A; `claude-haiku-4-5` for tagging. Per-route configurable.
- **Why:** The marks live in the hard reasoning (Opus); chat volume is cheaper on Sonnet; tagging is trivial (Haiku). Don't pay Opus rates for classification, don't risk quality on the reasoning that matters.
- **Consequences:** A settings model-map, not hardcoded IDs (SPEC §7.2); prompt caching + streaming to control cost/latency.

### D-14 — Retrieval baseline is keyword (FTS5); semantic is an optional local upgrade
- **Context:** Anthropic has **no embeddings endpoint**; local-first wants offline retrieval.
- **Decision:** Ship SQLite FTS5 (BM25) as the always-works baseline; add a *local* embedding model + vector store as a v1.1 semantic upgrade. Curated notes rank above raw PDF text.
- **Why:** FTS5 makes "ask my databank" work day one, offline, with zero extra dependencies. Semantic search shouldn't require sending her corpus to a third-party embeddings API (privacy, D-08) — keep it local.
- **Consequences:** v1 retrieval is keyword; semantic deferred (SPEC §8, §12); honest about the limitation rather than implying free semantic search.
