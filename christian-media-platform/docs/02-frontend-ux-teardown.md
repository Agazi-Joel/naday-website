# 02 — Front-End & UX Teardown

What the best products in (and adjacent to) this space actually *do* on screen,
what to borrow, and what to deliberately avoid. This is the reference behind the
prototype's design choices.

## A. Christian apps — patterns worth stealing

### YouVersion (Bible App)
- **Calm, content-first home.** A single "Verse of the Day" hero, then plans. No
  clutter. The screen has *one* obvious next action.
- **Reading Plans** as the engagement loop — structured, finite, shareable,
  streak-tracked. *Borrow this:* turn our books and answer-collections into
  finite "plans/journeys" people can start and complete.
- **Social-but-quiet** — friends, plan-sharing, prayer lists, without becoming a
  noisy feed. *Borrow:* lightweight social proof, not an algorithmic timeline.
- **Free + frictionless.** The first session has zero paywall. *Borrow:* never
  gate the first meaningful experience.

### Hallow
- **Premium, meditative aesthetic** — deep calm palettes, generous whitespace,
  ambient imagery, restrained motion. It *feels* expensive, which justifies the
  $9.99/mo. *Borrow:* the "this is worth paying for" production value.
- **Session-based content** with clear durations ("3 min", "Night prayer"). Sets
  expectations and lowers commitment. *Borrow:* label every piece of content with
  time-to-consume.
- **Strong onboarding** — a few taps about who you are / what you want, then a
  tailored first session. *Borrow:* a 30-second onboarding that personalizes the
  home screen.

### Glorify / Pray.com
- **Daily ritual framing** (morning/evening), tiered subscription, celebrity/well-
  known voices for pull. *Borrow cautiously:* a daily touchpoint is good; the
  glossy, influencer-heavy styling is *not* our brand.

### Dwell
- **Audio-first with beautiful player UX** and curated "playlists" of scripture.
  *Borrow:* treat audio as a first-class citizen with a real, persistent player.

### What Christian apps get WRONG (avoid)
- **Kitsch & cliché:** generic crosses, sunset-over-mountains stock photos, swirly
  gradients, "inspirational" script fonts. It reads cheap and dates instantly.
- **Shallow depth:** most stop at a verse and a vibe. There's nowhere to take a
  *real* question. That's our entire wedge.
- **Over-gating:** aggressive paywalls before any value. Erodes trust, which is
  the one thing a faith brand cannot spend.

## B. Secular apps — the craft bar we're held to

### Kindle / Kindle Unlimited
- **The reader is the product.** Typographic control (font, size, margins, line
  height), dark/sepia/light themes, dictionary on tap, progress %, sync across
  devices. *Borrow:* a genuinely excellent reader with parchment/sepia/dark modes
  and adjustable type. (Prototype demonstrates the reading surface.)
- **Library as a calm grid of covers.** Covers do the merchandising. *Borrow:* a
  cover-forward grid; make covers beautiful even when auto-generated.

### Audible
- **Persistent mini-player** that follows you across the app; speed control,
  chapters, sleep timer, bookmarks. *Borrow:* one global player for all audio
  (podcasts + audiobooks share it).
- **Credits/membership mental model** — simple, predictable value. *Borrow:* make
  "what my subscription gets me" instantly legible.

### Spotify / Apple Podcasts
- **Episode cards** with art, duration, progress, and a one-tap play. **Show
  pages** that bundle episodes into series. *Borrow:* our podcast/answer content
  uses the same card + show-page grammar people already know.
- **Resume everywhere / continue listening** row. *Borrow:* a "Pick up where you
  left off" rail on the home screen.

### Substack / Patreon / Medium
- **Reading is sacred** — wide line-height, ~65–75ch measure, serif body, no junk
  in the margins. *Borrow:* our written answers and essays use classic long-form
  reading typography (the prototype does this).
- **Frictionless submission & subscribe.** One field to start. *Borrow:* the
  question-submission form is short, warm, and unintimidating.
- **The paywall is honest** — you see the start of the piece, then a clean "become
  a member to continue." *Borrow:* preview-then-upgrade, never a hard wall on a
  cold visitor.

## C. The synthesis — our front-end principles

1. **Literary, not "appy."** Lead with type and text. The brand is *books and
   thinking*, so the interface should feel like a well-made book and a quiet
   reading room — warm paper, real serifs, restrained gilt accent. (See
   [`03-brand-identity.md`](03-brand-identity.md).)
2. **One clear action per screen.** Borrowed from YouVersion. Home = "continue +
   one featured thing + ask a question."
3. **Audio is global and persistent.** Borrowed from Audible/Spotify. A single
   player serves podcasts and audiobooks.
4. **Reading is excellent and adjustable.** Borrowed from Kindle. Sepia/light/dark,
   type controls, comfortable measure.
5. **The Q&A submission is the friendliest thing in the product.** Short, warm,
   anonymous-allowed, with examples. This is the front door to the wedge.
6. **Give is celebrated, not buried.** Borrowed from charity: water's clarity —
   show the impact ("you funded N Bibles"), make it feel like the best thing you
   can do here, not an upsell.
7. **Production value signals trustworthiness.** In a faith context, "made with
   care" reads as "you can trust the content." Cheapness reads as the opposite.
8. **Accessibility is doctrinal here.** Large-type mode, high contrast, screen-
   reader-clean, captions/transcripts on all audio (transcripts also feed the AI
   pipeline and SEO — double win).

## D. Concrete UI inventory (what the prototype shows)

- **Global nav + persistent audio player bar** (Audible/Spotify pattern).
- **Home**: continue rail, one featured book, one featured podcast, one featured
  answer, and a prominent "Ask a question" + "Gift a Bible."
- **Library**: cover-forward grid, filters, a reader sample with sepia/light/dark
  + type controls (Kindle pattern).
- **Podcasts**: show pages + episode cards with durations and progress (Spotify
  pattern); plays into the global player.
- **Questions**: a warm submission form + a searchable archive of published
  answers rendered as long-form essays (Substack pattern). This is the wedge.
- **Give**: subscription tiers + a "gift a Bible" flow with impact framing
  (charity: water pattern).

## E. Platform/tech front-end choices observed in the space

- **PWA-first is common** for faith content apps because it dodges some app-store
  friction and ships one codebase; native wrappers are added once traction is
  proven. (Detail and recommendation in [`06-tech-architecture.md`](06-tech-architecture.md).)
- **System fonts + one or two web fonts** (not five) keeps it fast and elegant.
- **Restraint in motion** — gentle fades, no bouncy gimmicks; calm is the brand.
