# 08 — Roadmap

Sequencing principle: **ship the wedge first.** The written Q&A engine is the
cheapest-to-build, most-defensible, content-compounding piece — it should be live
and creating library entries before we invest in a big catalog or native apps.

## Phase 0 — Foundations (Weeks 1–4)
- Lock **name + brand** and finalize the design system (from
  [`03-brand-identity.md`](03-brand-identity.md)).
- Stand up the **web shell**: Next.js app, auth, the design system in code,
  account basics. (BaaS chosen per [`09-open-decisions.md`](09-open-decisions.md).)
- Write the **statement of faith / doctrinal stance** and the **answer style
  guide** (these gate the AI pipeline).
- Design the Q&A submission → answer flow on paper; pick the moderation/editor UI.

## Phase 1 — The Ask wedge, end to end (Weeks 5–8) ← **the priority**
- Submission form (warm, anonymous-allowed) → **intake/triage/cluster** (Claude
  Haiku/Sonnet) → **draft** (Claude Opus 4.8, grounded + cited) → **editor review
  queue** → **publish** to a searchable archive. (Full design in
  [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md).)
- **Crisis routing** hard-coded; transparency labels live.
- **Seed the archive** pre-launch: answer the ~50–100 most-asked questions in
  advance so day-one visitors hit a non-empty, valuable library (beats cold-start).
- Public answer archive with **SEO** (SSR) — this is the discovery engine.

## Phase 2 — Read, Listen, and money (Weeks 9–12)
- **Reader** with sepia/light/dark + type controls; a **starter catalog**
  (public-domain classics + original essays + a few licensed/partner titles).
- **Podcast/audio**: show pages, episode cards, the **global player**, transcripts.
- **Stripe** subscriptions (Free / Member / Generosity) + **Gift a Bible** flow
  with impact confirmation and a community counter.
- **Soft-launch** to a small invite list / founding patrons; gather feedback.

## Phase 3 — Apps & polish (Months 4–6)
- **React Native (Expo)** iOS/iPad app (+ Android), reusing web logic/design;
  store IAP where required (see [`07-monetization.md`](07-monetization.md)).
- Offline downloads, push notifications ("your question was answered"),
  highlights/annotations, "continue" rails.
- Q&A follow-ups/threads, "was this helpful," related-answers.

## Phase 4 — Community & scale (Months 6–12)
- Light, moderated community on answers (discussion, prayer requests, journeys).
- Recurring giving, gift-a-membership, deeper impact reporting/transparency page.
- Begin **creator** onboarding (teachers/podcasters publish, revenue-share).
- i18n / localization for the highest-growth regions.

## Definition of done for v1 (end of Phase 2)
A person can: **ask** a question and get a thoughtful written answer (or find it
already answered), **read** from a real library in a great reader, **listen** to
the podcast in a real player, **subscribe**, and **gift a Bible** — on the web,
installable as a PWA, with the brand fully realized.

## Key risks to watch (from earlier docs)
- **Doctrine/trust** on AI answers → human-in-the-loop is the mitigation; don't
  cut it under deadline pressure.
- **Content licensing** → start small (public-domain + original), grow deliberately.
- **App-store tax** → convert on web first.
- **Cold-start** → seed the archive before launch.
