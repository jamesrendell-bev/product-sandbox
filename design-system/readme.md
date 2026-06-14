# BirdsEyeView — Design System

The single source of truth for designing **BirdsEyeView** collateral: PowerPoint decks,
proposals, LinkedIn content, the **CERA®** product UI, and any
other branded artifact. Compiled into a runtime library so design agents can build
brand-correct interfaces and assets.

---

## 1. Company & product context

**BirdsEyeView** (one word — capital **B**, **E**, **V**; legal entity *BirdsEyeView
Technologies Ltd.*) is a London-based B2B **insurance-analytics** company. It models
**natural-catastrophe ('NatCat')** risk — earthquake, tropical cyclone, flood, wildfire —
for underwriters, MGAs and syndicates in the Lloyd's market and beyond. Developed **in
partnership with the European Space Agency (ESA)**.

### Products / trademarks (always carry their marks)
- **CERA®** — *Catastrophic Exposure and Risk Analytics.* The flagship product **and** the
  web platform / portal. Quantitative, pricing-ready return-period outputs across all primary
  and secondary perils, surfaced on an interactive hazard map (analysis, exposure management,
  live event tracking). The ® is mandatory on first use and on every prominent appearance
  (covers, headers, pricing).
- **RAPTOR™** — named product/model (carries the ™).

  > *Note: the platform previously branded "WEATHER ANALYTIX™" is now **CERA®**. Do not use the
  > old name.*

### What the platform does (from the proposal screenshots)
A dark, map-first web app: left icon-rail nav (Dashboard, Hazard Analysis, Results Archive,
Exposure Management, Information Hub), a satellite/hazard heat-map canvas, a right-hand
**Hazard Layers** panel (Earthquake, Tropical Cyclone, Flood, Wildfire, etc.), and analysis
panels with **Annual Return Period** sliders and a **Create New Risk** form (risk name, dates,
TIV in GBP, line size, broker, LOB). Primary actions ("Search", "Save Results") and the
active nav use the brand **hot-pink** accent on the navy UI.

### Representative commercial facts (from the Kaufman CERA proposal)
- Sold as multi-year subscriptions (e.g. £45k / £50k / £55k over three years).
- À-la-carte services seen in the style guide: Live Hazard Event Tracking (£1,800),
  AI Excel SOV Data Cleaning (£4,300), Exposure Management (£15,200).
- Perils: EQ (MMI 3–9, PGA), TC (Saffir-Simpson CAT 0–5, 1,000-yr synthetic set),
  Flood+ (Fathom — pluvial/fluvial/surge, 10–30m), Wildfire (proprietary ML model).
- Named clients referenced in collateral: Hiscox, Munich RE, Arch Insurance, HDI, AXA XL.

---

## 2. Sources provided

These were supplied to build this system. Stored under `brand-kit-source/` and `uploads/`.
The reader of this repo may not have access — paths are recorded for provenance.

| Source | What it is |
|---|---|
| `uploads/BEV-Brand-Kit.zip` | The official brand kit (Draft 0.5, May 2026). |
| ↳ `BirdsEyeView-Style-Guide.md` | The written rule book — the authority on colour, type, layout, voice, trademarks. Copied to `brand-kit-source/`. |
| ↳ `BirdsEyeView-Style-Guide.pptx` | The 11-slide reference deck (doubles as a template). Text extracted; backgrounds saved to `assets/backgrounds/`. |
| ↳ `BEV-Background-{Title,Gradient,White}.png` | The three locked slide backgrounds (BEV + ESA lockup baked in). |
| ↳ `BEV-Brand-Kit-Setup.md`, `BEV-Writing-Prompts.md`, `README.txt` | Setup, LLM writing prompts, quick reference. Copied to `brand-kit-source/`. |
| `uploads/(JR)BEV_Kaufman_CERA_Proposal_2026-06.pptx` | A model commercial proposal (H.W. Kaufman). Text extracted; product screenshots → `assets/product/`; client logos → `assets/clients/`. |
| `uploads/BEV-Atlantic Hurricane Outlook 2026.pdf` | A LinkedIn carousel (Atlantic hurricane outlook). |
| `uploads/Swiss Re 1.jpeg`, `Swiss Re 2.pdf`, `Swiss Re 3.pdf` | **Competitor** (Swiss Re CatNet&reg;) LinkedIn collateral, supplied as *design reference only*. Borrowed cues: a faint triangular-mesh corner motif, a thin rounded bracket device, numbered-zigzag lists, and a swipe affordance. Re-expressed entirely in BEV's navy + hot-pink system (never Swiss Re's purple/magenta). Not BEV IP — do not reuse their marks or palette. |

Brand owner / contact: **james.rendell@birdseyeview.ai**.

---

## 3. CONTENT FUNDAMENTALS — how BirdsEyeView writes

The voice is **British, punchy, concise, evidence-based, and never AI-shaped.** The test:
*"Could a plain-spoken British founder say this out loud without sounding like a press release?"*
If no, rewrite shorter.

**Tone & register**
- Marketing/proposals: confident, quantitative, direct. Formal CEO register in documents;
  warm and mildly self-deprecating in email.
- Every claim carries a **proof point** — a number, a named client, or a cited source.
  *"£40bn"* not *"a lot"*; *"11 named insurers"* not *"many clients"*.
- **Hedged-but-direct.** *"We estimate ~90%…"* beats *"experts say"*. Make the claim, own the hedge.
- Acknowledge risk plainly. Never airbrush downside.

**Casing & person**
- Headlines: **sentence case**, never ALL CAPS.
- Section eyebrows / tags: **ALL CAPS**, tracked (e.g. `01 / THE OPPORTUNITY`, `PRICING`).
- Table headers: ALL CAPS.
- **British spelling** throughout (colour, modelling, organise, centre).
- Drop the preamble: *"BEV believes…"* not *"At BirdsEyeView, we believe…"*. Use "we" sparingly;
  prefer the subject doing the thing ("CERA® gives…", "Underwriters bind in seconds").
- Define acronyms in single quotes on first use — *Natural Catastrophe ('NatCat')*.

**Numbers & structure**
- Specific numbers, currency right-thinking (GBP, "exclusive of VAT").
- Short, declarative sentences. Break walls of prose with headers, bullets, tables.
- Manual `—  ` dash prefix for list items (avoids PowerPoint's hidden bullet indent).

**Emoji & punctuation**
- **No emoji. No exclamation marks.** Ever, in external collateral.
- No italics for emphasis — use a heavier named face or hot-pink colour instead.

**Banned phrases** (consultancy/AI filler):
*best in class · world-class · market-leading · we are excited/committed/thrilled · going
forward · circle back · leverage · synergy · value-add · win-win · low-hanging fruit ·
best-of-breed · robust · seamless · cutting-edge · it goes without saying · as you know.*

**Trademark discipline**
- BirdsEyeView (one word, never "Birds Eye View"). "BEV" is internal-only — never in client prose.
- CERA®, RAPTOR™ always carry their marks.
- Legal entity: *BirdsEyeView Technologies Ltd.* (trailing period).
- External proposals carry **COMMERCIAL PROPOSAL — CONFIDENTIAL** top-left on the cover.

**Examples (real, from the proposal)**
- Eyebrow → headline: `01 / THE OPPORTUNITY` → *"Supporting Kaufman's new LatAm & Caribbean book."*
- Proof-point body: *"1,000 years of synthetic storm data generated from 1980–2021 historical
  events. Includes unseen and counterfactual events."*
- Closing: *"Target go-live: 1st July 2026."*

---

## 4. VISUAL FOUNDATIONS

**The one-liner:** *A navy canvas. Pink for emphasis.* Dark-mode is the default for marketing.

**Colour**
- **Navy `#000615`** is the workhorse dark — and body text on white. **Pure black is never used.**
- The marketing canvas is a **navy → mid-blue gradient** (`#000615 → #164F86`, top-to-bottom).
- **Hot pink `#FF6CAA`** is *highlight only*: eyebrows, the rule under a headline, card titles,
  key CTAs/numbers. Never body text, never headlines. If a slide has >2 pink elements, it's too much.
- **White** is the body type on dark; **Mist Grey `#C6C8CD`** for captions/hairlines.
- **Sky / Ocean Blue** for maps and data overlays only.
- The **extended palette** (blue/green/gold/orange/red/purple) is **chart-only** — never in headings.
- **Hot-pink is the single accent** — used for emphasis in marketing *and* for primary actions /
  active states in the product UI. There is no separate product accent colour.
- Roughly **80%** of marketing real-estate is navy or white.

**Type** (see §3 of the style guide)
- **Avenir Next**, named faces only: **Ultra Light** (display), **Regular** (body/H1),
  **Demi Bold** (sub-heads, card titles, eyebrows). **Never the Bold toggle** — switch the named face.
  *(Substituted here with **Mulish** — see `tokens/fonts.css`. Flagged for replacement.)*
- Headlines sentence case; eyebrows ALL CAPS tracked ~5–10%. No italics.

**The hot-pink headline rule** — *the* signature device. A short pink underline sits **0.30 in below
the visual bottom** of the headline, at **30–40% of the headline's width**. Drops with the headline if
it wraps. Same gap on every slide.

**Backgrounds & layout**
- Three locked slide backgrounds (BEV + ESA lockup baked top-right): **Title** (wildfire satellite
  imagery), **Gradient** (dark content), **White** (light content). Cover = Title; content alternates
  Gradient ↔ White.
- **Five-zone page:** slide counter / eyebrow (top-left) · **BEV + ESA partnership lockup (top-right,
  on every design — PowerPoint and LinkedIn alike)** · headline + pink rule · body · footer. On
  LinkedIn carousels the **slide counter** (`01 / 05`, pink current number) sits top-left; the lockup
  is always top-right at ~210px wide.
- **Box-spacing system:** 0.50 in outer margin · 0.30 in card gutter · 0.35 in card padding ·
  equal-height cards · top padding = bottom padding · text never touches a box's bottom edge.
- All left-aligned text shares the same left edge (the page margin).

**Cards** — navy panel, **hot-pink Demi Bold title**, white Regular body, with a **subtle white glow**
on the gradient background (see `--glow-card`). Three-up grid is the default content layout.
On light/product surfaces, cards are cleaner with a hairline + soft shadow.

**Tables** — white bg; header row navy fill / white ALL-CAPS; row labels navy Demi Bold; body cells
navy Regular; optional pale-grey banded rows; 1px navy hairlines, no heavy frame; **all cell text
vertically centred**; currency right-aligned.

**Imagery** — earth-from-above, satellite, weather and hazard scenes; dark and atmospheric. A **30–50%
navy overlay** on hero photos so white type reads. Hazard outputs use warm-to-cool heat-map gradients
(red → green) over terrain. **No stock office/handshake/people shots.**

**Corner radii** — marketing/slides are **rectangular/sharp** (0–2px). The product UI is **rounded**:
~6–10px inputs/cards, **pill** buttons.

**Shadows / glow** — on dark: a subtle white glow + faint white border on panels. On light: soft navy
shadows. Hot-pink elements may carry a faint pink glow (sparingly).

**Borders / hairlines** — 1px. White at low opacity on dark; navy at low opacity on light.

**Motion** — restrained and functional. Short fades/slides (120–320ms), standard easing. No bounce,
no infinite decorative loops. Reduced-motion respected.

**Hover / press** — hover lifts surfaces (stronger glow/shadow, slightly brighter action colour);
press darkens the action colour. No large scale transforms.

**Transparency / blur** — used lightly: low-opacity white hairlines on dark, the navy photo overlay,
optional faint backdrop blur on floating product panels. Not a glassmorphism brand.

**Geometric motif (mesh)** — a subtle **triangular-mesh tessellation** may bleed in from one corner and
fade out (radial mask), rendered in **hot-pink at ~14–18% opacity** on the navy canvas; optionally with
1–3 small solid pink triangles tucked into the densest corner. Decorative only — never behind body copy
at full strength. Used on LinkedIn covers and section starts (see `linkedin/`, `guidelines/brand-mesh.html`).
This is a BEV re-expression of a competitor cue — keep it quiet; one corner, low opacity, pink not purple.

---

## 5. ICONOGRAPHY

- The brand specifies **single-weight line icons** — **white on the gradient, navy on white,**
  hot-pink for accent. **No multi-colour or filled illustrated icons. No emoji** (the writing rules
  ban emoji entirely).
- The product UI (CERA®) uses simple line glyphs in the sidebar and on form fields
  (grid, chart, list, folder, chat, calendar, clock, pin, user, etc.) at a consistent ~1.5px stroke.
- **No bespoke icon font or SVG sprite shipped** in the brand kit. For this system we standardise on
  **[Lucide](https://lucide.dev)** (loaded from CDN) — single-weight, 1.5–2px stroke line icons that
  match the brand's line-icon spec closely. **This is a substitution / standardisation choice — flag
  to the brand owner.** Set `stroke: currentColor` so icons inherit white / navy / pink per context.
- **Maps / hazard overlays** use Sky Blue / Ocean Blue plus the extended chart palette for peril
  colour-coding (red→green heat ramps for hazard intensity).
- **Peril & parameter icons** — a bespoke single-weight line set ships in `assets/icons/perils/`
  (24px grid, 2px stroke, round joins, `currentColor`), matching the Lucide UI icons: **earthquake**
  (seismograph), **tropical-cyclone** (hurricane spiral), **us-tornado** (funnel), **wildfire** (flame),
  **flood** (waves), **rainfall** & **snowfall** (cloud + drops/flakes), **windspeed** (steady lines) vs
  **windgust** (curling gusts), and **temperature** (thermometer). See `guidelines/icon-perils.html`.
  The CERA kit reuses these glyphs inline (`ui_kits/cera/Icons.jsx`).
- **Unicode** characters used as glyphs in copy: the `—` em-dash list prefix, `·` middot separators,
  `®` `™` marks, `→` for steps.

**Logos & marks** (in `assets/logos/`, cropped from the locked backgrounds — see caveats):
- `bev-logo-dark.jpg` / `bev-logo-light.jpg` — the bird mark + *BirdsEyeView* serif wordmark.
- `bev-esa-lockup-dark.jpg` / `bev-esa-lockup-light.jpg` — the full "DEVELOPED IN PARTNERSHIP WITH
  [ESA]" lockup (baked on navy / white).
- `bev-esa-lockup-dark.png` / `bev-esa-lockup-light.png` — **transparent** knockouts of the same
  lockup (background removed via luminance). **Use these** on gradients/photos so there's no seam;
  dark PNG for dark surfaces, light PNG for white. The LinkedIn templates embed the dark one.
- `esa-space-solutions-white.png` / `esa-space-solutions-colour.png` — the ESA "space solutions"
  mark on its own (white for dark backgrounds, colour for white).
- The mark itself: a stylised **bird with spread wings** (blue/sky wings, a small gold accent at the
  body) above an elegant letter-spaced serif wordmark. **Never re-colour, stretch, rotate or
  recreate** the BEV or ESA marks.

---

## 6. Index / manifest

**Root**
- `styles.css` — global entry point (consumers link this). `@import`s only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter wrapper.

**`tokens/`** — `colors.css` · `typography.css` · `spacing.css` · `effects.css` · `fonts.css`

**`assets/`**
- `fonts/` — Mulish woff (Avenir Next substitute).
- `backgrounds/` — the three locked slide backgrounds (Title as `.jpg`, Gradient/White `.png`).
- `logos/` — BEV wordmark + ESA lockups (dark/light).
- `clients/` — client logos (Hiscox, Munich RE, Arch, HDI, AXA XL) — *third-party trademarks.*
- `product/` — CERA® platform screenshots.

**`guidelines/`** — foundation specimen cards (Type, Colours, Spacing, Brand) for the Design System tab.

**`components/`** — reusable React primitives (Button, IconButton, Input, Card, Badge, Eyebrow,
PinkRule, StatTile, Table, Tabs, NavRail…). See each directory's card + `.prompt.md`.

**`ui_kits/cera/`** — high-fidelity recreation of the CERA® platform (login → hazard analysis):
`NavRail`, `TopBar`, `AnalysisPanel` (return-period sliders + Create New Risk), `HazardLayersPanel`,
`MapCanvas`, composed in `CeraApp`. Teal-green primary actions + active states, hot-pink for logout.
Brand imagery embedded as data URIs (`ceraAssets.jsx`); hazard map drawn in CSS.

**`linkedin/`** — five self-contained 1080×1080 LinkedIn carousel templates (cover, numbered list,
quote, big-stat, closing) using the hot-pink rule + triangular-mesh motif. `li.css` is the editing source;
each template inlines it so it exports to PNG/PDF cleanly. Logo embedded as a data URI.

**`assets/icons/perils/`** — the 10 bespoke peril/parameter line icons (SVG).

**`slides/`** — sample slide layouts in the BEV deck system *(not yet built — see caveats)*.

> **Namespace:** components are exposed at `window.BirdsEyeViewDesignSystem_e42a1e.<Name>` in card HTML.

---

## 7. Caveats / open questions for the brand owner

1. **Fonts.** Avenir Next is licensed (macOS only, not web-embeddable). Shipped substitute is
   **Mulish**. Supply Avenir Next web licences (or an approved alternative) to swap in `tokens/fonts.css`.
2. **Logos.** No standalone vector logo shipped in the kit — the lockup is baked into the background
   PNGs. The raster logos in `assets/logos/` are crops from those backgrounds; I've since added clean
   **transparent-PNG lockups** (`bev-esa-lockup-{dark,light}.png`) and standalone ESA marks for
   compositing. Please still provide clean **vector (SVG)** BEV + ESA marks for print-grade scaling.
3. **Icons.** No icon set shipped; standardised on **Lucide** (CDN). Confirm or supply the real set.
4. **Title background** is stored as a compressed JPEG (the source PNG was 2.25 MB). Use the original
   PNG from the kit for print-quality decks.
