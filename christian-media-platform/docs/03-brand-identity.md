# 03 — Brand Identity

> **Nothing here is chosen.** This is a slate of options with a recommendation and
> the rationale, plus the working system the prototype uses so the screens feel
> real. The prototype's placeholder name is **"Selah."**

## A. Naming

### The brief
The platform takes questions seriously and answers them in writing; it's a
library you read and listen to; it should feel warm, literary, trustworthy, and
*not* kitschy. It also needs to be: app-store-friendly, pronounceable,
trademark-able, and `.com`/handle-available (verify before choosing).

### Candidate names

| Name | Meaning / why it fits | Watch-outs |
|---|---|---|
| **Berean** | Acts 17:11 — the Bereans "examined the Scriptures daily to see whether these things were so." *Perfect* for a Q&A-driven platform built on examining questions honestly. Strong, ownable story. | Slightly insider; some existing ministries use "Berean." Check TM. |
| **Selah** | A Hebrew word in the Psalms meaning (likely) "pause and reflect." Short, brandable, calm, app-store friendly. Used as the prototype placeholder. | Used by some existing brands/songs; check availability. |
| **Lampstand** | Rev 1 / Matt 5 — the church as the stand that holds up the light. Light = illumination of scripture. Warm, concrete, visual (great for a logo). | Two syllables longer; a few churches use it. |
| **Cornerstone** | Christ the cornerstone (Eph 2:20). Recognizable, solid, trustworthy. | Heavily used (banks, churches); hard to own/TM. |
| **Manna** | Daily bread (Ex 16) — daily spiritual nourishment. Short, soft, friendly. | Common word; crowded. |
| **Vellum / Quire / Folio** | Bookmaking words — leans hard into the "made like a fine book" identity; distinctive in faith space. | "Vellum" is a known book-formatting app; "Quire" used by Google. |
| **Ekklesia / Koinonia** | "Assembly" / "fellowship" — the community angle. | Hard to spell/say for many; insider Greek. |

**Recommendation:** **Berean** is the strongest *strategic* fit because the name
*is* the value proposition (examine questions, test them against scripture) — it
explains the wedge in one word and has a built-in origin story. **Selah** is the
strongest *consumer* fit (short, calm, brandable, easiest to say). Shortlist
both, run a trademark + domain + handle check, and decide. Avoid Cornerstone/Manna
(too crowded to own).

> **How to rename the prototype:** the working name appears as the text token
> `Selah` in the HTML/CSS and as `data-brand` / the `.brandmark` in the logo SVG.
> Find-and-replace `Selah` across `prototype/` and swap `assets/logo.svg`.

## B. Visual identity — "Illuminated, not inspirational"

The single most important brand decision: **reject the faith-app cliché kit**
(sunsets, swirly gradients, script fonts, generic crosses) and instead evoke a
**finely made book / illuminated manuscript / quiet reading room.** This signals
*depth and care*, which in a faith context reads as *trustworthy*.

### Palette (the prototype's system)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C1814` | Primary text; near-black, warm |
| `--ink-soft` | `#4A423A` | Secondary text |
| `--cream` | `#FBF7EF` | Primary background ("paper") |
| `--vellum` | `#F1E7D4` | Raised surfaces / cards |
| `--gold` | `#A9772B` | Primary accent ("gilt") — antique gold, not yellow |
| `--gold-bright` | `#C99A45` | Hover / highlight gold |
| `--night` | `#211F33` | Deep indigo for dark sections / dark reader |
| `--sage` | `#5E6B57` | Quiet secondary accent (success, tags) |

The logic: **paper + ink + a single line of gilt.** One accent, used sparingly,
the way a gilt edge or an illuminated initial sits on a page. (See the prototype —
the accent appears only on key actions, never everywhere.)

### Typography

- **Display / headings:** a characterful serif — **Fraunces** (with Georgia
  fallback). Gives the "old book, made now" feeling.
- **Long-form reading body:** a readable serif — **Spectral** or **Source Serif**
  (Georgia fallback), ~18–20px, ~1.7 line-height, 65–72ch measure.
- **UI / labels / nav:** a clean humanist sans — **Inter** (system-ui fallback).
- **Rule:** serif for *content and identity*, sans for *chrome*. Never script fonts.

### Logo / mark

The provisional mark in `prototype/assets/logo.svg` is an **open book whose pages
rise into a flame** — book + light, i.e. *scripture that illuminates*. It's drawn
as a single elegant line in ink with a gilt fill, works at favicon size, and sits
left of the wordmark set in Fraunces.

Alternative mark directions to explore: an **illuminated initial** (a single drop-
cap letter in a gilt square, manuscript-style); a **lampstand** glyph (if the name
is Lampstand); a **dove/leaf** only if it can be done without cliché. Keep it
**monoline, monochrome-capable, and recognizable at 16px.**

### Imagery & texture
- Prefer **typography, paper texture, and generous space** over photography.
- If photography is used: real, warm, documentary — people reading, listening,
  in real places — never stock "hands raised at golden hour."
- Subtle paper grain is OK; heavy textures and drop-shadows are not.

### Motion
- Gentle, brief fades and slides. Calm is the brand. No bounce, no parallax circus.

## C. Voice & tone

- **Warm, honest, unhurried, never preachy or salesy.** We take hard questions
  seriously and don't pretend they're easy.
- **Plain language first**, scripture and tradition cited clearly, jargon
  explained. A doubter and a seminarian should both feel respected.
- **Humble about AI:** answers that are AI-drafted and human-edited say so. We
  never pretend a machine is a pastor. (See [`05-ai-qa-pipeline.md`](05-ai-qa-pipeline.md).)
- **Generosity is joyful, not guilt-tripping.** "Gift a Bible" is framed as a
  privilege, with visible impact — never a shaming upsell.

## D. Brand guardrails (one-line tests)

- Would this look at home on the cover of a beautifully made book? *(If no, rework.)*
- Could a skeptic take it seriously? *(No kitsch.)*
- Is the gilt accent used like punctuation, not paint? *(Restraint.)*
- Does it still read at 16px in greyscale? *(Logo test.)*
