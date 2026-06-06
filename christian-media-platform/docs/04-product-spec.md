# 04 — Product Specification

The product is four things that reinforce each other: **Read, Listen, Ask, Give.**
This spec describes each as features, with an MVP marker (✅ = build first,
◻️ = later phase).

## 1. Read — the book & essay library

**Vision:** "an amazing Kindle" for Christian material — a subscription library
you can read in a genuinely excellent reader.

- ✅ **Library browse** — cover-forward grid; filter by topic, format (book /
  essay / answer-collection), and "journeys" (finite, completable sets).
- ✅ **Reader** — clean reading surface with **sepia / light / dark (night)**
  themes, adjustable **font size, family, line-height, margins**; progress %;
  resume position synced to the account.
- ✅ **Essays** — short original written pieces (the in-house writing), same reader.
- ◻️ **Annotations** — highlights, notes, bookmarks; private by default.
- ◻️ **Dictionary / cross-reference on tap**; scripture references deep-link.
- ◻️ **Offline downloads** for subscribers.
- **Catalog strategy:** start with **public-domain classics** (Augustine, Spurgeon,
  à Kempis, Bunyan, etc.), **original in-house writing**, and **a few licensed /
  partner titles**. Grow deliberately; don't promise a huge catalog you can't
  license. (See licensing risk in [`01-market-analysis.md`](01-market-analysis.md).)

## 2. Listen — the podcast & audio library

**Vision:** a polished podcast + audiobook experience with a player as good as
Spotify/Audible.

- ✅ **Show pages** that bundle episodes into series; episode **cards** with art,
  duration, and progress.
- ✅ **Global persistent player** — one player for podcasts *and* audiobooks;
  play/pause, scrub, **speed**, skip ±15s, **continue listening** across sessions.
- ✅ **Transcripts** on every episode — accessibility, SEO, *and* they feed the AI
  Q&A pipeline as source material (a recorded answer becomes a written one).
- ◻️ **Sleep timer, chapters, bookmarks, downloads.**
- ◻️ **"Listen to this answer"** — TTS or recorded readings of written answers, so
  the Ask and Listen pillars merge.
- **Content strategy:** the founder's recorded podcast is the anchor; the written
  Q&A archive becomes a second "show" (read aloud); guest/partner shows later.

## 3. Ask — the written Q&A engine *(the wedge — build first)*

**Vision:** anyone can submit a question; legitimate questions get a **full,
thoughtful written answer**; answers become a permanent, searchable library. AI
does the heavy lifting; a human always approves before publish.

- ✅ **Submission form** — short and warm: the question, optional context, topic,
  and **submit anonymously** option. Unintimidating by design (see prototype).
- ✅ **Triage + drafting pipeline** — AI clusters/dedupes, screens spam & abuse,
  and drafts a grounded, cited answer from an approved corpus. *Full design in
  [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md).*
- ✅ **Human review & publish** — an editor edits/approves; the answer is labeled
  as AI-assisted + human-reviewed; citations shown.
- ✅ **Answer archive** — searchable, browsable by topic, rendered as long-form
  essays. *This is the compounding content moat.*
- ✅ **Dedup to existing answers** — if a question is already answered, the asker
  is routed to that answer immediately (and can ask a follow-up).
- ◻️ **Follow-ups / threads**, **"was this helpful?"** signal, **related answers.**
- ◻️ **Submitter notification** — "your question was answered" email/push.
- **Trust requirements (non-negotiable):** published doctrinal stance / statement
  of faith; visible "AI-drafted, human-reviewed" labeling; citations; a clear
  escalation path for sensitive questions (crisis/self-harm → human + resources,
  never an AI-only answer).

## 4. Give — generosity & the "gift a Bible"

**Vision:** let supporters directly offset the cost of a Bible for someone who
can't afford one, and let the premium tier fund the free experience for all.

- ✅ **Gift a Bible** — a one-tap flow to fund one or several Bibles; clear price
  per Bible; choose a region/partner if applicable; **impact confirmation**
  ("you funded N Bibles"). (See prototype `give.html`.)
- ✅ **Generosity (premium) tier** — a higher subscription that bundles full access
  *and* funds Bibles/free memberships for others; framed as joining the mission.
- ◻️ **Running impact counter** (community total Bibles funded), **gift on behalf
  of someone**, **recurring giving**, **gift a membership.**
- **Model & ethics:** be transparent about where money goes (fulfillment partner,
  overhead, % to Bibles). Mirror charity: water's clarity. (Money mechanics in
  [`07-monetization.md`](07-monetization.md).)

## 5. Account, community & cross-cutting

- ✅ **Auth** (email + social/Apple sign-in), profile, subscription management.
- ✅ **Home** — "continue" rail + one featured book + one featured podcast + one
  featured answer + prominent Ask & Give (see [`02-frontend-ux-teardown.md`](02-frontend-ux-teardown.md)).
- ✅ **Search** across books, episodes, and answers.
- ◻️ **Light community** — comments/discussion on answers, prayer requests,
  "journeys" you can do with friends. Quiet and moderated; *not* an algorithmic
  feed.
- **Cross-cutting:** accessibility (large-type, high-contrast, screen-reader,
  transcripts/captions), i18n-ready, analytics & moderation tooling.

## 6. Roles

- **Member / Subscriber** — reads, listens, asks, gives.
- **Editor** — reviews/edits/publishes AI-drafted answers; curates catalog.
- **Admin** — manages catalog, users, billing, the pipeline, moderation.
- **(Later) Creator** — publishes content, shares revenue.

## 7. Out of scope for v1 (explicitly)
- Rebuilding a full Bible reader (complement YouVersion, don't compete on it).
- Video courses, live streaming, native Android (web/PWA covers Android at first).
- An open creator marketplace (comes after the core proves out).
