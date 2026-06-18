# Synthesis Workbench

The **middle layer** of an academic research toolchain — the part that sits *above*
individual papers and *below* drafting an essay, where scattered ideas become
**propositional claims** that get **stitched into a structured argument**.

Built for a time-poor mature student (senior NHS leader) studying healthcare
leadership & management. Familiar mental models, minimal surface, local-first,
laptop-only. The thinking and the writing stay hers; the app finds, organises,
tests, and structures.

## For Claude Code

This folder is a **build spec**, not yet an implementation.

- **`SPEC.md`** — the full app specification: scope, domain model, UI, supervisor/AI
  integration (models, tool-use grounding, caching, streaming), local retrieval, stack,
  the Word handoff, build milestones, testing, and acceptance criteria. Build from here.
- **`DECISIONS.md`** — the reasoning behind every major choice (ADR log). Read this
  before changing a decision; append new entries rather than rewriting history.

To start building: follow `SPEC.md` §12 (milestones M0→M7). Match the host app's stack
where this integrates into an existing app; the portable core is the domain model
(§5), the supervisor behaviours (§7), and the Word handoff (§10).

## The shape, in one diagram

```
   READ (separate)         SYNTHESISE (this app)            WRITE (real Word)
 ┌──────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐
 │ PDF + highlights │──▶│ atoms → claims → argument │──▶│ Word + add-in pane   │
 │ (reading bench)  │   │ + locked decisions        │   │ (skeleton + supervisor)│
 └──────────────────┘   └───────────────────────────┘   └──────────────────────┘
                            one shared local brain + grounded AI supervisor
```

## Non-negotiables (see DECISIONS.md)

- **She decides; the AI tests** — no ghostwriting, no silent restructuring.
- **Grounded or silent** — answers cite her own notes/papers, or admit they aren't there. Never confabulate.
- **Familiar model, minimal surface** — Outlook/Word patterns; always one obvious next action.
- **Local-first** — her work stays on her laptop; offline-capable except live AI calls.
