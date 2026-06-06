# 09 — Open Decisions

Per the brief, this project deliberately **does not lock the big choices**. This
is the register of everything still on the table, each with options, a
recommendation, and what it affects. When you're ready to start deciding, this is
the page to work through — tell me your calls and I'll fold them into the plan and
the prototype.

> Legend: ⭐ = my recommendation (with the reasoning already in the linked doc).

## 1. Brand name
- Options: **Berean** ⭐ (strategic — the name *is* the Q&A value prop) · **Selah**
  ⭐ (consumer — short, calm, brandable; the prototype placeholder) · Lampstand ·
  Cornerstone · Manna · Vellum/Quire.
- Affects: logo, domain, handles, every screen. **Run a trademark + domain +
  handle check before committing.**
- See [`03-brand-identity.md`](03-brand-identity.md).

## 2. Deliverable depth right now
- You chose **plan docs + working prototype**, built here and transferable. ✅
- Still open: how far to take the prototype (more screens? real auth? wire one
  real AI answer?) before standing up the production stack.

## 3. Backend / BaaS
- Options: **Supabase** ⭐ (Postgres + pgvector for semantic dedupe/search, auth,
  storage — best fit for our relational Q&A data) · **Firebase** (fastest start,
  best mobile SDKs, but NoSQL) · **Custom backend** (most control, most work — not
  now).
- Affects: data model, search, cost, team skillset.
- See [`06-tech-architecture.md`](06-tech-architecture.md).

## 4. App strategy
- Options: **PWA-first now, React Native (Expo) for the apps** ⭐ · PWA-only (wrap
  with Capacitor) for speed · fully native (not now).
- Affects: timeline, App Store presence, cost.
- See [`06-tech-architecture.md`](06-tech-architecture.md) §A.

## 5. AI provider & pipeline shape
- Provider: **Claude (Anthropic)** ⭐ — grounded long-form, citations, structured
  outputs, prompt caching, batches.
- Pipeline: **direct API + your own review loop** ⭐ vs Managed Agents (more than
  needed for draft-then-review).
- **Degree of AI autonomy:** *recommendation is fixed here* — **human-in-the-loop
  before every publish is non-negotiable.** The open part is how much editor
  assistance to automate, not whether to keep the human.
- See [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md).

## 6. Pricing
- Options to set: Member price (**~$8–10/mo** ⭐), annual discount, **Generosity
  tier** price (**~$20–30/mo** ⭐), free-trial length, founding-patron offer.
- Affects: revenue model, conversion, runway.
- See [`07-monetization.md`](07-monetization.md).

## 7. Gift-a-Bible fulfillment
- Options: **partner with an established Bible distributor / society** ⭐ (trust,
  logistics handled) vs run distribution yourself (more control, much more
  operational load).
- Also decide: the **transparency model** (publish the % to Bibles; charity: water
  "100%" model vs. a disclosed split).
- Affects: ethics, trust, ops, the give-screen copy.
- See [`07-monetization.md`](07-monetization.md) §B.

## 8. Content & catalog strategy
- Options: start **public-domain classics + original writing + a few licensed
  titles** ⭐, grow deliberately vs. chase a large licensed catalog (expensive,
  slow).
- Decide: scripture **translation** to license/use; which partner publishers.
- Affects: licensing cost, catalog size at launch.

## 9. Doctrinal stance / statement of faith
- **You** (and any advising pastors/theologians) must author this. It defines the
  lane the AI pipeline and editors operate in, and how contested questions are
  handled. **Blocking for Phase 1** — the pipeline can't safely draft without it.
- See [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md) §D.

## 10. Repository & ownership
- You want this transferable to **its own private GitHub repo**. Built here in a
  self-contained folder so the move is a clean copy (the GitHub connector was
  unstable this session — see the session notes). Decide *when* to create the new
  private repo and whether to seed it from this folder or start the production app
  fresh using these docs as the spec.

---

### How to use this page
Pick the ones you're ready to decide, give me your answers (e.g. *"name = Berean,
backend = Supabase, Member = $9/mo, partner for fulfillment"*), and I'll: update
the docs to reflect the decisions, rename the prototype, and tighten the roadmap
around the locked choices. Everything you *don't* decide stays open with the
recommendation as the default.
