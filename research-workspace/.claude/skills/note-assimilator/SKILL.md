---
name: note-assimilator
description: Cluster highlights and notes from across many papers into themed, structured notes mapped to the argument. Use after reading several sources, to turn scattered annotations into organised notes in the notes/ folder.
---

# Note assimilator

The heart of the workspace. Takes notes/annotations from **many** papers and
reorganises them **by theme/argument**, not by paper — because one paper feeds
several themes and one theme draws on several papers.

## Inputs
- Extracted annotations (run `extract-annotations` first if needed).
- Existing files in `notes/` (extend them; don't duplicate).
- `knowledge/current-question.md` and her working thesis.

## Steps
1. Identify the recurring **themes** across all the annotations.
2. For each theme, create or update `notes/<theme>.md` containing:
   - **The point** — synthesised, but keeping her wording where she made the comment.
   - **Evidence** — which sources support it, each with an in-text Harvard cite and
     page number, drawn only from real annotations.
   - **Tensions** — where sources disagree, or where her view differs. Flag these;
     they're often the most fertile material.
   - **Gaps** — what's missing / needs more reading.
3. Maintain a top-of-file map in `notes/_index.md` linking themes to her thesis.

## Rules
- Never attribute a claim to a source that didn't make it. Every cite traces to a
  real annotation or paper.
- Keep her own reflections clearly marked as hers (`> her note:`), separate from
  source claims — protects her voice and academic integrity.
- Synthesise, don't just concatenate. The value is in the connections.

## After
Offer to run `argument-builder` to turn the themed notes into an essay structure.
