# 07 — Monetization & the "Gift a Bible" Model

Two jobs: **fund the platform sustainably** and **express the mission** (let
people offset the cost of a Bible for someone who can't afford one). The model is
proven — we're applying the faith-app + creator-subscription playbook from
[`01-market-analysis.md`](01-market-analysis.md), not inventing it.

## A. Subscription tiers (provisional — price points are open)

| Tier | Indicative price | Includes |
|---|---|---|
| **Free** | $0 | The full **Ask** experience (browse answers, ask questions), a sample of books/episodes, daily/weekly free content. *Never gate the first meaningful experience.* |
| **Member** | **~$8–10/mo** or **~$70–80/yr** | Full library (books + audio), offline downloads, the reader's full features, ad-free, priority Q&A. |
| **Generosity / Patron** | **~$20–30/mo** | Everything in Member **+ funds Bibles and free memberships for others**, plus a visible "you've funded N Bibles" impact. Framed as joining the mission. |

Benchmarks: Hallow charges **$9.99/mo or $69.99/yr**; this range is the proven
sweet spot for paid faith apps. (See [`01-market-analysis.md`](01-market-analysis.md).)
Annual discount drives commitment and cash flow. Offer a **free trial** of Member.

## B. The "Gift a Bible" / generosity mechanic

The differentiator. Make giving **clear, joyful, and visible** — the
charity: water "100% / show the impact" pattern.

- **One-tap gift:** "Fund a Bible — $X." Choose quantity; optionally choose a
  region/partner. Confirm with **impact** ("You funded 3 Bibles 🎉").
- **Generosity tier:** a higher subscription that *bundles* full access with
  ongoing Bible funding + sponsoring free memberships for those who can't pay.
- **Community impact counter:** a running total ("12,480 Bibles funded by this
  community") — social proof + mission, on the home and give screens.
- **Later:** gift a membership to a friend, recurring giving, dedicate a gift.

**Ethics & trust (essential):**
- **Be transparent** about where the money goes — fulfillment partner, what % goes
  to actual Bibles vs. overhead/processing. Publish it.
- Decide and disclose the **fulfillment model**: partner with an established Bible
  distributor (e.g. a Bible society) vs. running distribution yourself. *(Open
  decision — see [`09-open-decisions.md`](09-open-decisions.md).)*
- If you imply "100% goes to Bibles," you must actually fund operations separately
  (the charity: water model). Decide this deliberately.
- Giving is **never** a guilt-trip or a dark-pattern upsell. It's a privilege,
  framed with joy.

## C. Payments & the app-store tax (plan for it now)

- **Web (Stripe):** subscriptions and the gift flow via Stripe — **~2.9% + $0.30**
  processing, you keep the rest. This is the cheapest channel.
- **In-app (Apple/Google):** native-app digital subscriptions generally must use
  **store IAP**, which takes **15–30%** (often 15% under the small-business / >1yr
  subscriber programs). **Donations to a registered nonprofit can be exempt** from
  IAP on Apple — *which is highly relevant to gift-a-Bible*; confirm against
  current store policy and your legal structure.
- **Strategy:** acquire and convert subscribers on the **web** (Stripe) where you
  keep ~97%; treat the app as access to an existing subscription where store rules
  allow; route **gifting through the channel with the lowest take** (web, or
  IAP-exempt nonprofit donations if you qualify).

## D. Other / future revenue

- **Pay-what-you-want** or one-off purchases for premium books/courses.
- **Partner/affiliate** with publishers for licensed titles.
- **Creator revenue-share** (later) when teachers/podcasters publish on the
  platform.
- **Patron founding memberships** at launch to fund v1 (lifetime/early-supporter).

## E. Unit-economics sanity check (illustrative, not a forecast)

At **$9/mo** Member with Stripe (~$0.56 fee + processing), net ≈ **$8.4/mo**. The
main variable cost is the AI pipeline — mitigated by **batching (50% off)**,
**prompt caching (~10% of cost on cached prefix)**, and **right-sizing models**
(see [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md)); drafting cost per answer is
small and the answer is **reused** across everyone who asks it again. Content
licensing and audio hosting are the other cost centers. The **Generosity tier**
cross-subsidizes the free tier — that's the mechanism that lets the mission scale.

> All numbers here are **illustrative placeholders** to frame the model. Real
> price points, fees, and the fulfillment split are decisions for
> [`09-open-decisions.md`](09-open-decisions.md), to be set with current data.
