---
name: paper-summary
description: Produce a structured, critical summary of a single academic paper or report, tied to the current assignment. Use when she wants to understand a paper, decide whether to cite it, or capture it before reading in depth.
---

# Paper summary

Summarise one source so she can grasp it fast and judge its usefulness — critically,
not just descriptively.

## Inputs
- A PDF (read it directly) from `papers/`, or a DOI/URL, or pasted text.
- `knowledge/current-question.md` — so the summary connects to her assignment.

## Steps
1. Read the source. If it's a PDF, read the actual file.
2. Produce the summary in the structure below.
3. Always finish with relevance to her current question and a citation-ready reference
   (Harvard, per `knowledge/citation-style.md`). Do **not** invent details you can't
   see — if the year or journal isn't in the source, say so.

## Output structure
- **Reference** (Harvard, full).
- **In one line** — the core claim.
- **Thesis / argument** — what it argues, 2–3 sentences.
- **Type & method** — empirical (design, sample, setting) / theoretical / review /
  grey literature. Note the evidence strength.
- **Key findings or claims** — bullets.
- **Theoretical lens** — which models/frameworks it uses (cross-ref `frameworks.md`).
- **Limitations & critique** — methodological and conceptual weaknesses, who might
  disagree. This section earns the marks; don't skip it.
- **Relevance to "[current question]"** — how it supports, complicates or counters
  her argument; which theme in `notes/` it belongs to.
- **Quotable bits** — 1–3 short quotes with page numbers, if genuinely useful.

## After
Offer to: move the PDF to `papers/3-to-cite/` if she'll use it, and/or feed it to
`note-assimilator` for the themed notes.
