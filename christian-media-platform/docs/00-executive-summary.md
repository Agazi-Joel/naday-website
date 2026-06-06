# 00 — Executive Summary

## The idea in one sentence

A premium, beautifully made subscription platform — web first, then iPhone and
iPad — where people **read** Christian books, **listen** to a podcast and audio
library, and **ask** real theological and life questions that get answered *in
full writing*, with an AI-assisted pipeline doing the heavy lifting so no honest
question goes unanswered. Supporters can pay a premium tier and **gift a Bible**
to someone who can't afford one.

## Why now

- The faith-tech category has been *proven* by real money and real scale. The
  YouVersion Bible App passed **1 billion installs** (Nov 2025) and reaches
  **100M+ monthly actives**. Hallow crossed **22M downloads** with an estimated
  **~$51M annual revenue** and has raised **$84M+**. Glorify raised **$84.6M**.
  Investors (a16z, Kleiner Perkins) treat this as a serious vertical, not a niche.
- But the category is dominated by **prayer/meditation/devotional** apps and by
  the **Bible text itself**. The thing you're describing — a *content + answers*
  platform that takes questions seriously and answers them in long form — is
  **underserved**. Nobody owns "ask hard questions, get a thoughtful written
  answer, and a library that backs it up."
- Audiobooks are the fastest-growing format in publishing (US audiobook revenue
  **+23.8% YoY to ~$1.1B in 2024**), which validates the "listen" pillar.
- The creator-subscription playbook (Substack/Patreon) is mature and well
  understood, so we are not inventing a business model — we're applying a known
  one to an underserved, mission-aligned audience.

(Full figures and sources in [`01-market-analysis.md`](01-market-analysis.md).)

## The wedge — what makes this different

Most faith apps are **habit** products (pray daily, read a verse). This is a
**depth** product. The differentiated, defensible core is the **written Q&A
engine**:

1. Anyone can submit a question (faith, doubt, scripture, ethics, suffering).
2. AI triages it — dedupes, clusters similar questions, flags what's legitimate
   vs. spam/abuse, and drafts a grounded, well-cited answer from an approved
   corpus (the library, vetted commentary, scripture).
3. A human editor reviews, edits, and publishes. The answer becomes a permanent,
   searchable library entry — so the same question answered once serves thousands.

Over time this creates a **proprietary, growing answer library** that is the moat:
it's the content competitors can't copy, it's what ranks in search, and it's what
makes a subscription worth paying for.

## The three pillars + the gift

| Pillar | What it is | Closest analog |
|---|---|---|
| **Read** | Subscription book library + clean reader | Kindle Unlimited / Audible |
| **Listen** | Podcast + audio library, episodes & series | Spotify / Apple Podcasts |
| **Ask** | Submitted questions → full written answers | (no direct competitor) |
| **Give** | Premium tier + sponsor a Bible for someone | charity: water's "100% model" |

## The headline recommendation (provisional)

- **Build web-first as a PWA-ready single codebase**, then wrap for iOS/iPad. The
  recommended stack is **Next.js (React) + a managed backend (Supabase or
  Firebase) + Stripe for web payments**, with **React Native (Expo)** or a
  **PWA-to-native wrap** for the app stores. Rationale and alternatives in
  [`06-tech-architecture.md`](06-tech-architecture.md).
- **Use Claude (Anthropic) for the Q&A drafting pipeline**, with a human always in
  the loop before publish. Details and model/cost guidance in
  [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md).
- **Monetize with a freemium subscription** (~$8–10/mo, annual discount) plus a
  **"Generosity" premium tier** that funds Bibles, mirroring proven faith-app
  pricing. See [`07-monetization.md`](07-monetization.md).
- **Brand**: warm, literary, "illuminated manuscript" feel — *not* the glossy,
  gradient, stock-photo look of most faith apps. Candidate names and the full
  identity in [`03-brand-identity.md`](03-brand-identity.md). The prototype uses
  the placeholder **"Selah."**

## What I'm explicitly NOT deciding for you

Per your brief, the following stay open with options laid out: the **name**, the
**exact stack** (managed BaaS vs. custom backend), **native vs. cross-platform vs.
PWA** for the apps, the **price points**, and the **degree of AI autonomy** in the
Q&A pipeline. These live in [`09-open-decisions.md`](09-open-decisions.md) — that's
the page to read when you're ready to start locking things in.

## Suggested first 90 days

1. **Weeks 1–4:** lock name + brand, design system, and the Q&A submission →
   answer flow on paper. Stand up the web shell (auth, library skeleton).
2. **Weeks 5–8:** ship the **Ask** pillar end-to-end (submit → AI draft → human
   edit → publish → searchable archive). This is the wedge; ship it first.
3. **Weeks 9–12:** add the reader + a starter book/podcast catalog, wire up
   Stripe subscriptions and the "gift a Bible" flow, soft-launch to a small list.

Detail in [`08-roadmap.md`](08-roadmap.md).
