---
name: extract-annotations
description: Pull highlights and margin comments out of annotated PDFs (or a Zotero/notes export) into clean, structured text. Use as the first step before note-assimilator, when she has marked up papers in papers/2-processing/.
---

# Extract annotations

Turn her marked-up reading into clean, structured text the rest of the workspace can
work with. This is the bridge between "reading a PDF" and "having usable notes."

## Inputs (any of)
- Annotated PDFs in `papers/2-processing/` — read the file; surface highlighted
  passages and any comments/sticky notes you can see.
- A **Zotero** export: in Zotero, right-click an item → *Add Note from Annotations*,
  then export that note (Markdown/HTML) into `papers/2-processing/`. Read it here.
- A plain notes file she typed while reading.

## Fastest path: the extraction script (automatic, free)
This skill ships with `extract_annotations.py`. It reads the highlights + comments
straight out of the PDF — no paid software, works offline. One-time setup:
`pip install pymupdf`. Then:

```
python .claude/skills/extract-annotations/extract_annotations.py papers/2-processing/ -o notes/raw-annotations.md
```

Run this first. If it returns annotations, use that Markdown as the input and skip
to step 3 (tagging). Only fall back to reading the PDF visually if the script finds
nothing (e.g. the file was flattened/printed to PDF, which destroys annotation data).

## Steps
1. For each source, list its annotations **in reading order**, preserving:
   - the highlighted text (quote it),
   - her comment on it (clearly distinguished from the quote),
   - the page number.
2. Keep her comments verbatim — they are her thinking and must stay in her voice.
3. Tag each annotation with a likely **theme** (cross-ref existing files in `notes/`).
4. Note anything ambiguous (couldn't read a comment, unclear page) rather than guessing.

## Output
A clean per-source list:
```
### AuthorYear — short title
- p.12 — "highlighted quote…"  → [her comment]  #theme
- p.14 — "…"  → [her comment]  #theme
```

## After
Offer to run `note-assimilator` to cluster these across papers by theme.

## Note on PDF annotations
PDF highlights/comments aren't always machine-readable depending on the reader used.
If extraction looks incomplete, the most reliable route is the Zotero
*Add Note from Annotations* export above, or she pastes her highlights in directly.
Be honest when you can't see annotations rather than inventing them.
