# 05 — The AI-Assisted Written Q&A Pipeline

This is the **wedge** (see [`01-market-analysis.md`](01-market-analysis.md)) and the
most sensitive system in the product. The goal: **no legitimate question goes
unanswered**, every published answer is **grounded, cited, and human-approved**,
and the same question answered once serves everyone who asks it again.

> **Non-negotiable principle: AI drafts, a human approves.** On theology and
> people's real lives, an unsupervised model is a brand-and-trust risk we do not
> take. Every published answer passes a human editor. We say so, visibly.

## A. The pipeline, end to end

```
        ┌────────────┐   ┌───────────┐   ┌────────────┐   ┌───────────┐   ┌─────────┐
Submit →│ 1. Intake  │ → │ 2. Triage │ → │ 3. Cluster │ → │ 4. Draft  │ → │ 5. Human│ → Publish
 form   │  & screen  │   │ & classify│   │ & dedupe   │   │ (grounded)│   │  review │   to archive
        └────────────┘   └───────────┘   └────────────┘   └───────────┘   └───────────┘
```

1. **Intake & screen.** Capture the question + optional context + topic. A fast,
   cheap model classifies: *legitimate question* vs *spam / abuse / not a
   question*, and flags **crisis content** (self-harm, abuse, emergencies).
   - Crisis → **never** an AI answer. Route immediately to a human + show
     real-world helpline resources. This branch is hard-coded, not model-trusted.
2. **Triage & classify.** Tag topic(s) (e.g. doubt, suffering, scripture
   interpretation, ethics, church practice), difficulty, and sensitivity. Use
   **structured outputs** so tags are machine-reliable.
3. **Cluster & dedupe.** Embed the question and compare to the existing answer
   library. If a near-duplicate already has a published answer, **route the asker
   straight to it** (and let them ask a follow-up). Otherwise, group it with
   similar open questions so one answer can address a cluster.
4. **Draft (grounded).** A strong model drafts a full written answer **only from
   an approved corpus** — scripture, vetted commentary, the platform's own
   library/essays, and the published doctrinal stance — with **citations** to
   sources. It is explicitly instructed to say "this is debated" where it is, and
   to never fabricate references.
5. **Human review.** An editor sees the draft, its citations, the source
   passages, and the triage tags. They edit, approve, or reject. On approve, the
   answer is published to the searchable archive, labeled **"AI-drafted,
   human-reviewed,"** with citations shown and an answer date.

## B. Why Claude, and which model where

We recommend **Claude (Anthropic)**. It's strong at careful, grounded, long-form
reasoning, supports **citations**, **structured outputs**, **prompt caching**
(cache the big shared corpus once), and a **Batches API** (50% cheaper) ideal for
non-urgent drafting. Assign models by job to control cost:

| Stage | Recommended model | Model ID | Why |
|---|---|---|---|
| Intake screen / crisis flag | **Claude Haiku 4.5** | `claude-haiku-4-5` | Fast, cheap, high-volume; binary-ish classification |
| Triage / tagging / dedupe assist | **Claude Haiku 4.5** or **Sonnet 4.6** | `claude-haiku-4-5` / `claude-sonnet-4-6` | Structured-output classification |
| **Answer drafting** | **Claude Opus 4.8** | `claude-opus-4-8` | The hard part — careful, well-reasoned, well-cited long-form. Use adaptive thinking + `effort: high`. |
| Editor assist (suggest edits, tighten) | **Claude Sonnet 4.6** | `claude-sonnet-4-6` | Good quality at lower cost for in-review help |

**Indicative pricing (per 1M tokens, verify before budgeting):** Opus 4.8
**$5 in / $25 out**; Sonnet 4.6 **$3 / $15**; Haiku 4.5 **$1 / $5**. (Source: the
bundled Claude API reference, cached 2026-05.)

**Cost levers that matter here:**
- **Prompt caching** for the shared corpus (doctrinal stance, style guide,
  retrieval context) — repeated drafting requests get the cached prefix at ~10%
  cost. *Keep the cached prefix byte-stable* (no timestamps/IDs in it).
- **Batches API** for drafting — answers aren't latency-sensitive (a human reviews
  them anyway), so batch them at **50% off**.
- **Right-size the model** per stage as above — don't draft on Haiku, don't screen
  on Opus.

## C. Grounding & retrieval (so answers are *true to the corpus*)

- Maintain an **approved corpus**: scripture (with translation chosen/licensed),
  vetted commentaries, the platform's own essays/books, and a written
  **statement of faith / doctrinal stance**.
- For each question, **retrieve** the most relevant passages and pass them to the
  drafting model; instruct it to **cite** them and to **not** assert anything it
  can't ground. Use Claude's **citations** feature so cited spans map to sources.
- Keep an **answer style guide** in the system prompt (warm, humble, plain-first,
  cites tradition, names disagreement honestly — see voice in
  [`03-brand-identity.md`](03-brand-identity.md)).

## D. Guardrails (the part that protects the mission)

- **Human-in-the-loop before every publish.** Always. No "auto-publish" mode.
- **Crisis routing is code, not model judgment.** Self-harm / abuse / medical /
  legal emergencies → human + resources, never an AI answer.
- **Doctrinal boundaries.** A published statement of faith defines the lane; the
  drafting prompt is held to it; the editor enforces it. Genuinely contested
  questions are answered as *"here's the range of faithful views,"* not a fake
  single verdict.
- **Transparency.** Every answer is labeled AI-drafted + human-reviewed, dated,
  and cited. We never imply a machine is a pastor.
- **No fabrication.** Drafting is grounded + cited; the editor checks citations.
  If the corpus can't support an answer, the editor escalates to a human author.
- **Abuse & prompt-injection.** Treat submitted text as untrusted input — it can't
  change system instructions; screen for prompt-injection attempts at intake.
- **Feedback loop.** "Was this helpful?" + editor corrections feed prompt/style
  improvements over time.

## E. Build options (a decision for [`09-open-decisions.md`](09-open-decisions.md))

| Option | What it is | Trade-off |
|---|---|---|
| **A. Direct API + your own loop** (recommended start) | Your backend calls Claude per stage, you run retrieval + the review UI | Most control over the human-in-loop, gating, logging; simplest to reason about |
| **B. Claude Managed Agents** | Anthropic hosts a stateful agent/session with tools | Powerful for autonomous multi-step work — *more* than we need for a draft-then-review flow; revisit if the pipeline grows tools |

Recommendation: **start with Option A** — a plain, auditable backend pipeline with
the editor UI as the control point. It's the right altitude for "draft, then a
human approves."

## F. What this gives us strategically

Every answered question becomes a permanent, searchable library entry. The
library **compounds**: the more questions answered, the more the platform attracts
seekers (SEO + word of mouth), the more it's worth subscribing to, and the harder
it is for anyone to copy. The AI makes it *scalable*; the human makes it
*trustworthy*; the archive makes it a *moat*.
