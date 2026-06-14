---
name: birdseyeview-design
description: Use this skill to generate well-branded interfaces and assets for BirdsEyeView (BEV) — the insurance-analytics company behind the CERA® NatCat platform — for production or throwaway prototypes, slides, and LinkedIn content. Contains essential design guidelines, colours, type, fonts, logos, peril icons, the triangular-mesh motif, reusable CERA UI components, and LinkedIn carousel templates.
user-invocable: true
---

# BirdsEyeView design skill

Read **`readme.md`** in this folder first — it is the authority on company context, content
voice, visual foundations, iconography, and the file manifest. Then explore the other files.

## What's here
- `styles.css` → `tokens/*.css` — colours, type, spacing, effects, `@font-face` (Mulish, a
  flagged stand-in for Avenir Next).
- `assets/` — logos (BEV + ESA), client logos, the three locked slide backgrounds, CERA product
  shots, and `assets/icons/perils/` (10 single-weight peril/parameter line icons).
- `guidelines/*.html` — foundation specimen cards (type, colour, spacing, brand, iconography, mesh).
- `ui_kits/cera/` — React recreation of the CERA® platform (`CeraApp` composes `NavRail`, `TopBar`,
  `AnalysisPanel`, `HazardLayersPanel`, `MapCanvas`). Reusable peril/UI glyphs in `Icons.jsx`.
- `linkedin/` — five self-contained 1080×1080 carousel templates + `li.css` editing source.

## How to use it
- **Visual artifacts** (slides, LinkedIn images, mocks, throwaway prototypes): copy the assets you
  need and produce static, self-contained HTML the user can preview and export to PNG/PDF. The
  `linkedin/` templates already inline their CSS + logo — duplicate one and edit the copy.
- **Production code**: copy assets and read the rules here to design correctly in the brand. Reuse
  the CERA components by importing them; reference tokens via the CSS custom properties.

## Non-negotiable brand rules (see readme for detail)
- "A navy canvas. Pink for emphasis." Navy `#000615`, hot-pink `#FF6CAA` as **highlight only**.
- Headlines are **white, sentence case**, with the **hot-pink headline rule** beneath. Never pink
  headlines. Eyebrows/tags are ALL-CAPS tracked, in pink.
- British spelling. No emoji. No exclamation marks. CERA®, RAPTOR™ carry their marks.
- The CERA product UI uses **teal-green** for primary actions/active states and pink for logout —
  this is the one place pink is *not* the action colour.
- Triangular-mesh motif: pink, low opacity, one corner, decorative only.

If invoked with no brief, ask what the user wants to build or design, ask a few focused questions,
then act as an expert BEV designer who outputs HTML artifacts or production code as needed.
