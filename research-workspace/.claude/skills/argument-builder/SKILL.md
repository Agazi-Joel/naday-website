---
name: argument-builder
description: Turn themed notes and a thesis into a logical essay structure — claim, sub-claims, evidence, counter-arguments — showing where support is thin. Use to plan an essay before drafting.
---

# Argument builder

Bridges notes and drafting. Takes her thesis + themed notes and proposes a
**structure** — not prose — exposing where the argument is strong and where it's thin.

## Inputs
- `notes/` (themed notes from `note-assimilator`).
- `knowledge/current-question.md` — title, word count, marking criteria, her thesis.

## Steps
1. Restate the **question** and her **working thesis** in one line each. If the thesis
   is unclear, surface that first — a strong essay needs a clear line of argument.
2. Propose a structure:
   - **Introduction** — framing, thesis, roadmap.
   - **Main sections** — each as: *claim → supporting evidence (cited) → counter-view
     → her evaluation → link to practice.* Map each to a theme in `notes/`.
   - **Conclusion** — what the argument establishes; implications for her practice.
3. Allocate an approximate **word budget** per section against the total count.
4. Flag, explicitly:
   - claims with **thin or no evidence** (→ more reading needed),
   - sections that risk being **descriptive** rather than analytical,
   - missing **counter-arguments**,
   - where her **practice example** would strengthen the point.

## Output
A structured outline (headings, bullet claims, cited evidence, word budget) saved to
`outputs/<assignment>-outline.md` on request.

## Rules
- Produce **structure and signposting**, not finished paragraphs.
- Every evidence bullet cites a real source from her notes/`papers/3-to-cite/`.
- Push the critical + applied shape these assignments reward.

## After
Offer `socratic-discussant` to stress-test the thesis, or `essay-draft` once the
structure is approved.
