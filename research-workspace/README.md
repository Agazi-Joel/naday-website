# Academic research workspace

A Claude Code workspace for a master's student in **healthcare leadership &
management** (senior NHS background). It helps her find and process literature,
develop and critique her own arguments, and produce outputs — while keeping the
thinking, and the writing, hers.

> **How to use it:** open this folder in Claude Code and talk to it normally
> ("survey the field on X", "summarise this paper", "critique my draft"). It will
> reach for the right skill. The skills live in `.claude/skills/`.

## The workflow

```
        DISCOVER                 READ & PROCESS              THINK                 OUTPUT
  ┌──────────────────┐     ┌──────────────────────┐   ┌────────────────┐   ┌──────────────────┐
  │ field-survey     │     │ extract-annotations  │   │ socratic-       │   │ essay-draft      │
  │ journal-finder   │ ──▶ │ paper-summary        │──▶│   discussant    │──▶│ presentation-    │
  │ paper-search     │     │ note-assimilator     │   │ supervisor-     │   │   builder        │
  └──────────────────┘     └──────────────────────┘   │   critique      │   └──────────────────┘
                                                       │ argument-builder│
                                                       │ theory-to-      │
                                                       │   practice      │
                                                       └────────────────┘
```

## The paper pipeline

Drop PDFs in `papers/1-to-read/`. As she reads and annotates, they move to
`papers/2-processing/`, and the ones she'll cite end in `papers/3-to-cite/`.
See `knowledge/workspace-conventions.md`.

## Reading & note-taking (Zotero or just a folder)

No paid software needed. Highlights and comments are saved inside the PDF by any
free reader (Zotero's built-in reader, macOS Preview, Adobe Acrobat **Reader**,
Foxit, Okular…). Don't "flatten" or print-to-PDF — that destroys the annotation data.

1. Read and **highlight + comment** in any free PDF reader.
2. Save the annotated PDF in `papers/2-processing/`.
3. `extract-annotations` pulls out the highlights + comments **automatically** via
   its bundled script (`pip install pymupdf` once):
   ```
   python .claude/skills/extract-annotations/extract_annotations.py papers/2-processing/ -o notes/raw-annotations.md
   ```
4. `note-assimilator` clusters them across papers into themed notes in `notes/`.

If she uses **Zotero**: right-click an item → *Add Note from Annotations* →
export that note into `papers/2-processing/` for the cleanest extraction. A Zotero
MCP server can be added later for full-library search (see "Next steps").

## The skills

| Skill | What it does |
|---|---|
| `field-survey` | Map a topic — debates, seminal works, gaps |
| `journal-finder` | Top journals + keyword strings for the question |
| `paper-search` | Find real, citable papers & reports |
| `paper-summary` | Critical structured summary of one source |
| `extract-annotations` | Pull highlights/comments out of annotated PDFs |
| `note-assimilator` | Cluster notes across papers into themes |
| `socratic-discussant` | She leads an idea; it asks questions + finds weaknesses |
| `supervisor-critique` | Marks a draft like a demanding supervisor |
| `argument-builder` | Turn notes + thesis into an essay structure |
| `theory-to-practice` | Apply a model to her NHS practice, critically |
| `essay-draft` | Working draft from an approved outline (she rewrites it) |
| `presentation-builder` | Turn material into a slide outline + speaker notes |

## Knowledge files (the workspace's memory — keep them updated)

- `knowledge/current-question.md` — **the live assignment.** Fill this in first.
- `knowledge/workspace-conventions.md` — folder rules + **academic integrity rules**.
- `knowledge/citation-style.md` — Harvard (Cite Them Right) by default.
- `knowledge/field-context.md` — her background + what these assignments reward.
- `knowledge/sources.md` — where to search (incl. NHS grey literature).
- `knowledge/frameworks.md` — leadership/management/change models + their critiques.

## Academic integrity

This is a thinking and structuring partner, **not a ghostwriter**. It finds sources,
organises notes, critiques, questions, and scaffolds — but reflective and analytical
prose must be her own words, and every citation must be real and verifiable. The full
rules are in `knowledge/workspace-conventions.md`.

## Getting started

1. Fill in `knowledge/current-question.md` with the assignment title and criteria.
2. "Survey the field on \<topic\>" → read the starters.
3. Drop PDFs in `papers/1-to-read/`, read & annotate, extract → assimilate notes.
4. Talk through the argument with `socratic-discussant`; build it with `argument-builder`.
5. Draft, then `supervisor-critique` before submission.

## Next steps / possible upgrades (v2)

- **Zotero MCP server** for whole-library search by tag/collection.
- A **Semantic Scholar / arXiv / PubMed MCP** for richer in-tool search.
- A **SessionStart hook** that prints the current question + pipeline status on open.
- Per-module variants if her citation style or focus changes.
