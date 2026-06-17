---
name: journal-finder
description: Identify the top journals to target for a topic, each with the keyword combinations that surface relevant work. Use when planning a literature search for an assignment.
---

# Journal finder

Tell her where the relevant conversation is happening and how to search each venue.

## Inputs
- The topic + the essay question (`knowledge/current-question.md`).
- `knowledge/sources.md` (the curated journal list is the starting point).

## Steps
1. From the question, extract the **core concepts** (topic terms) and the **context**
   (NHS / nursing / health care / public sector).
2. Rank the most relevant journals (start from `sources.md`, add others if the topic
   warrants — e.g. a policy or OB-heavy question).
3. For each journal, give a **search string** combining topic + context terms with
   Boolean operators, tuned to that venue's scope.

## Output
A ranked table:

| # | Journal | Why relevant to this question | Suggested search string |
|---|---------|-------------------------------|-------------------------|

…followed by a few **cross-database** strings she can paste into PubMed / Scholar /
the library, e.g.:
`("transformational leadership" OR "compassionate leadership") AND (NHS OR nursing OR "health care") AND (retention OR turnover)`

## Rules
- Always combine a topic term with a context term — the brief from `sources.md`.
- Point her at the **university library** for paywalled full text.
- Offer to run `paper-search` with the chosen strings.
