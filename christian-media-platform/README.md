# Christian Media Platform — Plan & Prototype

A subscription platform for Christian books, podcasts, and written Q&A — "an
amazing Kindle" for the faith space, plus a recorded/written podcast library, an
AI-assisted pipeline that turns submitted questions into full written answers,
and a generosity feature that lets supporters fund a Bible for someone else.

> **Status: planning + prototype. Nothing here is a final decision.**
> Per the brief, this repository deliberately keeps the big choices *open* —
> brand name, tech stack, pricing — and presents them as options with
> trade-offs and a recommendation. See [`docs/09-open-decisions.md`](docs/09-open-decisions.md).

---

## What's in here

```
christian-media-platform/
├── README.md                      ← you are here
├── docs/
│   ├── 00-executive-summary.md     One-page synthesis + the headline recommendation
│   ├── 01-market-analysis.md       Market size, players, money, and the gap we fill (cited)
│   ├── 02-frontend-ux-teardown.md  What works in Christian + secular apps, and why
│   ├── 03-brand-identity.md        Name candidates, logo rationale, palette, type, voice
│   ├── 04-product-spec.md          Features: reader, podcasts, written Q&A, community, giving
│   ├── 05-ai-qa-pipeline.md        How AI triages questions and drafts answers (with humans)
│   ├── 06-tech-architecture.md     Web + iOS + Android: the options and a recommendation
│   ├── 07-monetization.md          Subscriptions, tiers, the "gift a Bible" model, app-store tax
│   ├── 08-roadmap.md               Phased plan from MVP to scale
│   └── 09-open-decisions.md        The decision register — everything still on the table
└── prototype/
    ├── index.html      Landing / home
    ├── library.html    Book library (Kindle-style grid + reader sample)
    ├── podcasts.html   Podcast library + player UI
    ├── questions.html  Q&A archive + the submission form (front door to the AI pipeline)
    ├── give.html       "Gift a Bible" generosity checkout (mockup)
    ├── styles.css      The whole design system in one file
    ├── app.js          Light interactivity (no framework, no build step)
    └── assets/logo.svg The provisional wordmark/mark
```

## The prototype is real but provisional

- It runs with **no build step and no dependencies** — open `prototype/index.html`
  in a browser, or serve the folder:
  ```bash
  cd christian-media-platform/prototype
  python3 -m http.server 8000   # then visit http://localhost:8000
  ```
- It uses the **working name "Selah"** purely so the screens feel real. This is
  *not* a chosen name — it's a placeholder you can swap. The name appears as a
  single token; see `docs/03-brand-identity.md` for the real candidate slate and
  how to rename.
- The book covers, podcast art, and avatars are **generated in CSS** — there are
  no binary image assets to license or lose. Only the logo is an SVG.

## Moving this to its own private repo

This folder is self-contained. To lift it out:

```bash
# from a fresh clone of the new private repo
cp -r naday-website/christian-media-platform/. .   # contents become repo root
git add -A && git commit -m "Import platform plan + prototype"
```

Nothing in here imports from the surrounding `naday-website` site, so the move is
a clean copy. The GitHub connector in this session was unstable, which is exactly
why the work was built here first and committed — see the session notes.

## How to read this

If you have ten minutes: read `00-executive-summary.md`, click through the
prototype, then skim `09-open-decisions.md` and tell me which calls you want to
make. Everything else is the supporting depth behind those two.
