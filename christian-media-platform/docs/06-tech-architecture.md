# 06 — Technical Architecture

Goal: one product that is a **website and an app on iPhone / iPad** (Android too,
via web/PWA first), with a reader, an audio player, the Q&A pipeline, payments,
and the gift-a-Bible flow. Everything below is presented as **options with a
recommendation** — final stack choice lives in [`09-open-decisions.md`](09-open-decisions.md).

## A. The core decision: how to be "web + app" at once

| Approach | What it means | Pros | Cons | Verdict |
|---|---|---|---|---|
| **PWA-first** (installable web app) | One web codebase; "install" to home screen | Cheapest, fastest, one codebase, no app-store gatekeeping, instant updates | iOS PWA limits (push, background audio quirks); no App Store presence | Great for **MVP / web** |
| **Cross-platform (React Native / Expo)** | One React-ish codebase → real iOS + Android apps | Real native apps, App Store presence, near-native feel, shares logic with web (React) | Some native nuance; still subject to store rules/tax | **Recommended for the apps** |
| **Fully native (Swift + Kotlin)** | Separate iOS and Android codebases | Best possible native polish | 2–3× the build/maintenance; slowest; overkill at this stage | Not now |

**Recommendation:** **Web-first as a polished, PWA-ready Next.js app**, then ship
the iOS/iPad (and Android) apps with **React Native (Expo)**, reusing React
components, the design system, and all business logic. This gives a real App Store
presence *and* one team/skillset. (If app-store timing matters less than speed, a
PWA wrap via Capacitor is a faster interim step.)

## B. Recommended stack (provisional)

```
┌──────────────────────────────────────────────────────────────┐
│  Clients                                                       │
│   • Web / PWA      → Next.js (React) + TypeScript              │
│   • iOS / iPad / Android → React Native (Expo), shared logic   │
└───────────────┬────────────────────────────────────────────────┘
                │  HTTPS / API
┌───────────────▼────────────────────────────────────────────────┐
│  Backend / BaaS                                                  │
│   • Auth, Postgres DB, file/object storage, serverless funcs     │
│     → Supabase (Postgres-native)  *or*  Firebase                 │
│   • Q&A pipeline service (Node/TS or Python) → Claude API        │
│     (see 05) — retrieval + draft + review queue                  │
│   • Search → Postgres full-text / pgvector (embeddings) or Algolia│
└───────────────┬───────────────────────────┬─────────────────────┘
                │                           │
        ┌───────▼───────┐           ┌────────▼─────────┐
        │  Payments     │           │  Media           │
        │  Stripe (web) │           │  Audio/CDN host   │
        │  + store IAP  │           │  (Mux/Cloudflare  │
        │  where required│          │   /S3+CDN)        │
        └───────────────┘           └──────────────────┘
```

- **Frontend web:** **Next.js + TypeScript + Tailwind** (the prototype is plain
  HTML/CSS to stay dependency-free, but maps cleanly to this). SSR/SSG gives the
  answer archive **great SEO** — important, the archive is our discovery engine.
- **Apps:** **React Native (Expo)** — shares the design system and logic.
- **Backend:** a **managed BaaS** to move fast. **Supabase** (Postgres, auth,
  storage, edge functions — recommended for relational data + pgvector search) or
  **Firebase** (fastest to start, great mobile SDKs, but NoSQL). See the option
  table in [`09-open-decisions.md`](09-open-decisions.md).
- **Q&A pipeline:** a small dedicated service calling the **Claude API** (see
  [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md)) with retrieval + an editor review
  queue.
- **Search:** Postgres FTS + **pgvector** for semantic dedupe/search (keeps it in
  one place); Algolia if instant-search UX becomes a priority.
- **Payments:** **Stripe** for web subscriptions + the gift-a-Bible flow; **store
  IAP** in the native apps where Apple/Google rules require it (see
  [`07-monetization.md`](07-monetization.md)).
- **Media:** a CDN-backed audio host (Cloudflare R2/Stream, Mux, or S3+CloudFront)
  with a player that supports range requests, resume, and speed control.

## C. Data model (first pass)

Core entities: `User`, `Subscription`, `Book`, `Chapter`, `PodcastShow`,
`Episode`, **`Question`**, **`Answer`** (with `status: submitted|triaged|drafted|in_review|published`,
`citations[]`, `topics[]`, `ai_model`, `reviewed_by`), `Topic`, `Donation`
(gift-a-Bible), `ImpactCounter`, `ReadingProgress`, `ListeningProgress`,
`Highlight`. The **Question → Answer** lifecycle mirrors the pipeline in doc 05.

## D. Cross-cutting

- **Auth:** email + Sign in with Apple + Google (Apple sign-in is required by
  Apple if you offer other social logins).
- **Accessibility:** semantic HTML, screen-reader labels, large-type & high-
  contrast modes, transcripts/captions on all audio (also feeds SEO + the AI
  corpus).
- **Offline:** PWA service worker for web; downloads for app subscribers (later).
- **Analytics & moderation:** privacy-respecting analytics; an admin/editor
  console for the review queue, catalog, and moderation.
- **i18n-ready** from the start (faith content travels globally — see the
  Sub-Saharan/MENA growth in [`01-market-analysis.md`](01-market-analysis.md)).
- **Security & privacy:** treat submitted questions as sensitive PII; encrypt at
  rest; clear data-retention policy; allow anonymous submission.

## E. Why this stack

It optimizes for the two things that matter now: **shipping the wedge fast** (BaaS
+ one React skillset across web and apps) and **SEO on the answer archive**
(Next.js SSR). It avoids premature complexity (no custom infra, no native
double-build) while leaving clean exits: Supabase is just Postgres if you outgrow
the BaaS layer, and React Native shares code with the Next.js web app. Re-evaluate
custom backend vs BaaS once volume and team size justify it.
