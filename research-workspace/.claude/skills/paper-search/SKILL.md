---
name: paper-search
description: Find actual papers and reports for a set of keywords, returning verifiable references with abstracts and relevance notes. Use to build a reading list once search terms are chosen.
---

# Paper search

Find real, citable sources for her search terms and present them so she can triage.

## Inputs
- Search strings (from `journal-finder`) or a topic.
- `knowledge/sources.md` (where to look) and `current-question.md` (relevance).

## Steps
1. Search across academic sources **and** grey literature (`sources.md`). Use web
   search; prefer sources that resolve to a real record (DOI, PubMed ID, or a
   stable URL).
2. For each hit, capture: authors, year, title, journal/source, DOI/URL.
3. Assess relevance to her question and note evidence type (empirical/review/grey).

## Output
A triage list:
```
1. Author(s) (Year) "Title". Source. [DOI/URL]
   Type: empirical / review / grey
   Relevance: how it bears on "[current question]"
   Get full text via: library / open access
```
Group by theme; mark a recommended **starter set**.

## Rules
- **Only list sources you can actually verify exist.** If you can't confirm a
  paper resolves to a real record, do not present it as found — say it needs
  checking. Fabricated citations are the single worst failure here.
- Always give the route to full text (university library for paywalled).
- Offer to save chosen items' references to `notes/_reading-list.md`, download
  guidance, and run `paper-summary` on the starters.
