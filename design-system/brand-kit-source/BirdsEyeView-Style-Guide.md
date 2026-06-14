# BirdsEyeView — Brand & Style Guide

*Derived from the BirdsEyeView PowerPoint master ("CERA® Commercial Proposal" template). This guide is the single source of truth for colour, typography, layout and trademark usage across decks, documents, emails and broker-facing collateral.*

---

## 1. Brand Fundamentals

**Company name.** Always written as one word: **BirdsEyeView** — capital B, capital E, capital V, no space, no hyphen. Never "Birds Eye View", "BEV Ltd", or "Birdseyeview" in external collateral. The legal entity is **BirdsEyeView Technologies Ltd.**

**Product name.** **CERA®** — Catastrophic Exposure and Risk Analytics. The registered-trademark symbol **must** appear on the first use of CERA in any document, and on every prominent appearance in titles, headers and pricing pages.

**Tagline / positioning line.** *"CERA®: Catastrophic Exposure and Risk Analytics"* is the canonical descriptor.

**Confidentiality marker.** External proposals carry **"COMMERCIAL PROPOSAL — CONFIDENTIAL"** in the top-left corner of the cover slide/page, set in tracked caps.

**Partnership lockup.** Where applicable, the **"DEVELOPED IN PARTNERSHIP WITH [ESA / partner logo]"** badge sits top-right, beneath the BirdsEyeView logo.

---

## 2. Colour Palette

### 2.1 Core palette (in-use)

| Role | Name | HEX | RGB |
|---|---|---|---|
| Primary background (dark) **and** primary text on light | **BEV Navy** | `#000615` | 0, 6, 21 |
| Primary accent | **BEV Hot Pink** | `#FF6CAA` | 255, 108, 170 |
| Primary text on dark | **White** | `#FFFFFF` | 255, 255, 255 |
| Secondary text / hairlines | **Mist Grey** | `#C6C8CD` | 198, 200, 205 |
| Supporting accent (data viz) | **Sky Blue** | `#0BA7FC` | 11, 167, 252 |
| Supporting accent (deep) | **Ocean Blue** | `#3484C9` | 52, 132, 201 |

**Pure black is not part of the BEV palette.** Use **BEV Navy `#000615`** for every dark usage — including body text on white backgrounds. The brand reads as navy-and-pink, never black-and-pink.

**Rule of thumb.** Dark-mode is the default for marketing collateral (decks, proposals, pitch). Navy `#000615` is the canvas; white is the body type; hot pink `#FF6CAA` is reserved for emphasis, eyebrows, underlines and CTAs — never used as body text.

### 2.2 Extended theme palette (data viz, charts, secondary collateral)

| Role | HEX |
|---|---|
| Theme dark 1 (slate) | `#5C6677` |
| Theme dark 2 | `#53585F` |
| Theme light 2 (panel grey) | `#DCDEE0` |
| Accent 1 — Blue | `#0365C0` |
| Accent 2 — Green | `#00882B` |
| Accent 3 — Gold | `#DCBD23` |
| Accent 4 — Orange | `#DE6A10` |
| Accent 5 — Red | `#C82506` |
| Accent 6 — Purple | `#773F9B` |

Use the extended palette for chart series, peril colour-coding and secondary diagrams. Do **not** introduce new hues outside this palette without sign-off.

### 2.3 Usage rules

- Hot pink is a **highlight colour**. Reserve it for: section eyebrows ("THE OPPORTUNITY", "PRICING"), the rule line under a headline, card sub-headings, and key CTAs. If a slide has more than two pink elements, it's too much.
- Navy `#000615` and white are the workhorses. Around 80% of marketing real-estate should be one of these two.
- Sky / Ocean blue are for data overlays, maps and supporting visuals — not body text.
- The extended palette is **chart-only**. Don't use Theme Green or Theme Orange in headings.

---

## 3. Typography

### 3.1 Type family

The BEV system uses **Avenir Next** as the primary brand family across all collateral.

**Important:** weight is always set via the named face — `Avenir Next Ultra Light`, `Avenir Next Regular`, `Avenir Next Demi Bold`. **Never** apply the "Bold" toggle/button to plain Avenir Next; this produces a faux-bold render that breaks the brand. If you need weight, change the font name, not the bold setting.

| Use | Named font face |
|---|---|
| Display / cover titles | Avenir Next Ultra Light |
| Headlines / H1 | Avenir Next Regular |
| Sub-headings / card titles | Avenir Next Demi Bold |
| Body copy | Avenir Next Regular |
| Captions / metadata | Avenir Next Regular (smaller size) |
| Eyebrows / tags ("PRICING", "THE OPPORTUNITY") | Avenir Next Demi Bold, **ALL CAPS**, tracked |

### 3.2 Theme fallback (master file)

The underlying PowerPoint theme is set to:
- **Major font (headings):** *Avenir Next Condensed Demi Bold*
- **Minor font (body):** *Avenir Next Condensed Medium*

These remain in the master for legacy compatibility but new collateral should default to standard (non-condensed) **Avenir Next** unless space is constrained.

### 3.3 System fallbacks

When Avenir Next is unavailable (Office on Windows, web, mobile signatures):

1. **Helvetica Neue** (light / regular / thin)
2. **Helvetica**
3. **Aptos** (Microsoft default — acceptable in internal Word documents)
4. **Arial** (last resort)

For long-form Word documents in the BEV house style, **Aptos** is the sanctioned substitute (see `bev-document-style`).

### 3.4 Type rules

- **Never use the Bold toggle on Avenir Next.** Switch to `Avenir Next Demi Bold` as the named face instead. Faux-bold breaks the brand.
- Headlines: sentence case, never ALL CAPS (except eyebrows/tags).
- Eyebrows and section tags: ALL CAPS, letter-spacing ~5–10%, set in `Avenir Next Demi Bold`.
- Avoid italics for emphasis — use a heavier named face or colour (hot pink) instead.
- Underlines: reserve for the **hot-pink rule line** beneath a headline. Do not underline body text.

---

## 4. Backgrounds & Lockup

### 4.1 Three locked background PNGs

The lockup (BirdsEyeView wordmark + DEVELOPED IN PARTNERSHIP WITH + ESA logo) is **baked into the slide background image** — you never position it manually. Three master backgrounds ship with the brand kit:

| File | Use |
|---|---|
| `BEV-Background-Title.png` | The cover slide. Wildfire satellite imagery + client logo strip at the bottom + locked lockup top-right. |
| `BEV-Background-Gradient.png` | All dark content slides. Navy → mid-blue top-to-bottom gradient + locked lockup top-right. |
| `BEV-Background-White.png` | All light content slides. White + locked lockup top-right (in navy). |

To start a new deck: open PowerPoint → Design → Format Background → Picture or Texture Fill → insert the appropriate PNG. The wordmark and ESA mark are already in the right place.

### 4.2 Alternation

- **Slide 1 (cover):** `BEV-Background-Title.png`
- **Slide 2 onwards:** alternate `BEV-Background-Gradient.png` ↔ `BEV-Background-White.png`

### 4.3 Working with the locked backgrounds

- Top-right area (~the rightmost 2.6 inches, top 1.1 inches) is reserved for the locked lockup. Keep content out.
- Cover background: bottom ~1.5 inches reserved for the client logo strip. Keep title + metadata above y = 5.6".
- The lockup never moves. If a slide needs more top-right space, restructure the content — never reposition the lockup.

### 4.4 General brand-asset rules

- Never re-colour, stretch, rotate or recreate the BirdsEyeView or ESA mark.
- Never embed an alternative ESA logo file — the one in the background PNGs is the approved version.
- For other imagery (cover photography on bespoke decks, screenshots, partner logos), leave a clearly-labelled placeholder rectangle and drop in the final asset by hand. We do not auto-embed.

---

## 5. Layout System

### 5.1 Page architecture (slides & documents)

A standard BEV slide / page has five zones:

1. **Top-left:** confidentiality / section eyebrow (CAPS, white or pink, small).
2. **Top-right:** BirdsEyeView logo, with optional partnership lockup beneath ("DEVELOPED IN PARTNERSHIP WITH …").
3. **Headline block (upper-mid):** sentence-case headline in white (on dark) or navy (on light), followed by a **hot-pink horizontal rule** roughly 30–40% of the headline's width.
4. **Body / content zone:** cards, columns, tables or paragraph copy.
5. **Footer:** page number bottom-right (white on dark, navy on light); optional partner logo strip bottom-centre.

### 5.2 Cover slide / front page

- Full-bleed photographic background, dark and atmospheric (satellite imagery, weather systems, hazard scenes). Image should sit behind a subtle dark overlay so white type reads cleanly.
- Top-left: `COMMERCIAL PROPOSAL — CONFIDENTIAL`.
- Top-right: BirdsEyeView logo + partnership badge.
- Centre-left stack: product title (white, Ultra Light), descriptor (`CERA®: Catastrophic Exposure and Risk Analytics`), pink rule, pink section tag (e.g. `PRICING`), and a small block of metadata in white:
  - `Prepared for: [Client]`
  - `Prepared by: [Name], [Title] | BirdsEyeView Technologies Ltd.`
  - `[Month Year]`
- Bottom: partner / client logo strip in white, evenly spaced.

### 5.3 Section slides

- Single-column dark navy background.
- Eyebrow (CAPS, white or pink) → headline → pink rule.
- Body content sits in either a single-column paragraph or a 2–3 card grid.

### 5.4 Card grid (the "three-up")

Default content layout. Three equal-width cards on navy.

- Card background: a subtly lighter navy panel (≈ `#0A1530` to `#101D3A`) or transparent over a darker zone.
- Card title: **hot pink**, Demi Bold, sentence case.
- Card body: white, Regular, ~11–12 pt on slides.
- Vertical rhythm: equal top-aligned, equal padding.

### 5.5 Tables (e.g. pricing, feature comparisons)

- White background for data-heavy tables (proposals, pricing).
- Header row: **navy fill, white text, Demi Bold, ALL CAPS**.
- Row labels (left-most column): navy text, Demi Bold.
- Body cells: **navy `#000615`** text, Regular. (Not charcoal, not black.)
- Optional banded rows: pale grey `#F4F5F7` alternating with white.
- Currency right-aligned. Item names left-aligned.
- **All cell text is vertically centred** within the row. Never top-aligned.
- 1 px navy hairline borders. No heavy outer frame.

### 5.6 Spacing & grid (the box-spacing system)

These values are the single source of truth for box / card / table spacing across all BEV decks. If a slide's boxes feel "off", check these first.

| Element | Value |
|---|---|
| Slide dimensions | 16:9, 1920 × 1080 (LAYOUT_WIDE = 13.3 × 7.5") |
| Outer page margin (left and right) | **0.50 in** |
| Outer page margin (top eyebrow / bottom footer) | 0.30 in / 0.45 in |
| Card gutter (horizontal gap between cards) | **0.30 in** |
| Card internal padding | **0.35 in, all sides** |
| Card title → body gap (inside a card) | 0.55 in |
| Pink rule under headline → content below | 0.65 in |
| Minimum gap between any two distinct elements | 0.20 in |

### 5.7 Alignment rules

- **All left-aligned text shares the same left edge.** Eyebrow, headline, body, footer caption all flush at the page margin (0.50 in from the slide edge). Mixed indents are the most common source of "off" slides.
- Cards in a grid are always **equal height**. Pad the short ones; do not crop the long ones.
- Top padding inside a box equals bottom padding. Left padding equals right padding.
- Avoid pptxgenjs / PowerPoint default bullets — they introduce a hidden indent that pushes the text right of the heading. Use a manual `—  ` dash prefix instead so the text starts flush with the heading above.
- If a slide feels tight, take something out before changing the spacing.

### 5.8 Headline clearance from the top-right lockup

The BirdsEyeView + ESA lockup is baked into the top-right of every background PNG and occupies approximately the rightmost **2.6 inches** of the top **1.3 inches** of the slide.

- **Headline text boxes must end at least 0.30 in before the lockup zone.** Maximum headline width = **9.5 in** (`x = 0.5` to `x = 10.0`). Never extend further right.
- **Long titles wrap to two lines or get shortened.** Never let a title run into or sit close to the lockup.
- The pink rule under the headline shares the same maximum width as the headline text box (max 6.5 in).

### 5.8a Pink rule distance below the headline — THE rule

**The pink rule under any headline sits exactly 0.30 inches below the visual BOTTOM of the rendered headline text.** Not below the top. Not below the first line. Below the **bottom** of whatever has actually been typeset.

If the headline is one line, the rule sits 0.30 in below that one line. If the headline wraps to two lines, the rule drops with it and sits 0.30 in below the second line. The gap between text and rule is always the same.

**Canonical reference — match this exactly.**

The reference is the **Typography slide** ("Avenir Next, end to end.") and the **title slide** ("Brand & Style Guide"). The gap between the lowest line of headline text and the pink rule on those two slides is the gap every other slide must match. If your slide has a noticeably bigger or smaller gap than those two, it's wrong.

**Common mistake to avoid.**

A headline that *fits on one line* must be treated as one line — the rule sits 0.30 in below the single line. Do not place the rule as if the headline were wrapping when it isn't, or it lands too far below and leaves a dead band of empty space. A 36 pt Avenir Next Regular headline holds **up to ~38 characters on one line** at 9.5 in wide. Headlines under 38 characters do not wrap.

**Exact positions (36 pt headlines starting at `y`).**

| Headline state | Position of rule | Why |
|---|---|---|
| One line (≤38 chars) | y + 0.60 + 0.30 = **y + 0.90 in** | one line at 36 pt is ≈ 0.60 in tall |
| Two lines (39–76 chars) | y + 1.20 + 0.30 = **y + 1.50 in** | two lines at 36 pt are ≈ 1.20 in tall |

**Code (single source of truth).**

In `_build_styleguide.js`, this is enforced by three named constants:

```javascript
const HEADLINE_LINE_HEIGHT    = 0.60;  // height of one 36 pt line, in inches
const HEADLINE_RULE_GAP       = 0.30;  // ALWAYS this far below the lowest line
const HEADLINE_CHARS_PER_LINE = 38;    // wrap threshold for 36 pt at 9.5 in wide
```

Never tweak these per-slide. If a headline needs a different position, the answer is to **shorten the headline** (per the writing-voice rule) — not to adjust the rule.

### 5.9 Text-in-box overflow

Text inside a card, panel or table cell must **never touch or run past the bottom edge** of the box.

- Bottom padding inside a card = top padding (default **0.35 in** both).
- For the standard three-up card (3.6 in tall, 13 pt body), the body text box height is **2.15 in** (= `cardH − 1.45`). Anything longer must either shrink the body wording or grow the card.
- If body text overflows, **make the box taller** — never reduce the font size below the named tiers (Body = Regular 12–14 pt, Caption = Regular 9–10 pt).
- If extending the box pushes content into the footer, **trim the wording** — proof points and numbers stay, motivational filler goes first.
- Always render a draft slide and visually inspect: every box should have an obvious bottom margin of white space. If the text is flush with the bottom, the box is too small.

---

## 6. Imagery & Iconography

- Photography should be **earth-from-above, satellite, weather and hazard imagery** — dark, atmospheric, scientific. Avoid stock-photo people, handshakes, or generic office shots.
- Treat all hero imagery with a 30–50% navy overlay so white type retains contrast.
- Icons (used in feature cards, peril lists) should be **line icons, single-weight, white or hot pink** on dark; navy on light. Avoid multi-colour or filled illustrated icons.
- Maps / overlays use the **Sky Blue / Ocean Blue** palette plus the extended chart colours for peril classification.

---

## 7. Trademark & Compliance Guardrails

- **CERA®** — the ® symbol is mandatory on first use in any external document, and on every prominent occurrence (cover, headers, pricing). Within body paragraphs after the first use, plain "CERA" is acceptable.
- **BirdsEyeView** — never "Birds Eye View"; never "BEV" in external client-facing prose (BEV is acceptable internally and in filenames).
- **Legal entity** — when referenced, use the full name **BirdsEyeView Technologies Ltd.** with the trailing period.
- Confidentiality marker is required on all commercial proposals and pricing collateral.

---

## 8. Voice & Tone (cross-reference)

This guide governs the visual system. For written voice — emails, memos, board updates, broker collateral — see the companion guides:

- `bev-email-style` — for email drafted in James's voice.
- `james-writing-style` — for long-form documents, memos and strategy notes.
- `bev-document-style` — for Word document visual formatting (mirrors this guide for .docx output).

In short: **British, warm, concise, evidence-based, mildly self-deprecating in email; formal CEO register in documents.**

---

## 9. File & Naming Conventions

- Proposals: `BEV_[Client]_[Product]_Proposal_[YYYY-MM].pptx`
- Internal memos: `BEV_[Topic]_[Audience]_[YYYY-MM-DD].docx`
- One-pagers: `BEV_[Product]_OnePager_[YYYY-MM].pdf`
- Always export client deliverables to PDF in addition to the editable source.

---

## 10. Quick Reference Card

| Element | Spec |
|---|---|
| Navy | `#000615` |
| Hot pink | `#FF6CAA` |
| White | `#FFFFFF` |
| Mist grey | `#C6C8CD` |
| Display font | Avenir Next Ultra Light (named face — not Bold toggle) |
| Body font | Avenir Next Regular |
| Sub-head font | Avenir Next Demi Bold (named face — not Bold toggle) |
| Fallback (Word) | Aptos |
| Slide ratio | 16:9 (1920 × 1080) |
| Eyebrow style | ALL CAPS, tracked, Demi Bold |
| Headline rule | Hot pink, 30–40% headline width |
| Card title colour | Hot pink |
| Table header | Navy fill, white CAPS |
| Trademark | CERA® always, BirdsEyeView one word |

---

*Maintained by: BirdsEyeView. Questions / exceptions: james.rendell@birdseyeview.ai.*
