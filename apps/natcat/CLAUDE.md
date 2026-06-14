# CLAUDE.md — BirdsEyeView Product Sandbox

Read this before changing anything. It is the shared brief for **every** Claude session
working on this repo, so James and Muskan get identical results. Pair it with the
`birdseyeview-design` skill (see "Design system" below).

## What this is
A **Vite + React + TypeScript** web app — the **BirdsEyeView Product Sandbox**: an umbrella
that hosts the latest BirdsEyeView products we are trialling with clients. Each product is a
self-contained module. The first is **Property NatCat Pricing**; others (Exposure Management,
Rate Adequacy, Live Event Response) are placeholders for now.

Deployed: private GitHub repo → Netlify (auto-deploy on push to `main`). Runs on stub data;
the live CERA® API switches on via `VITE_BEV_API_KEY` / `VITE_BEV_API_BASE_URL`.

## Design system — NON-NEGOTIABLE
This app uses the **`birdseyeview-design`** skill (in `~/.claude/skills/birdseyeview-design/`).
Invoke it for any visual work. The rules, distilled:

- **"A navy canvas. Pink for emphasis."** Navy `#000615` (also body text on white). Hot-pink
  `#FF6CAA` is the **only** accent — eyebrows, the headline rule, active states, primary
  buttons, key numbers. Never pink body text, never a pink/full-navy background behind content.
- **Hybrid:** dark navy is for the **chrome (nav, footer) and hero/landing only**. Every content
  page sits on a **white** surface with navy text. ~80% navy-or-white; pink is the highlight.
- **Type:** Mulish (300 display / 400 body / 600 demibold). Never the bold toggle.
- **Signature devices on every page:** an ALL-CAPS tracked **pink eyebrow**, a **pink headline
  rule** under the heading (`.h-rule`), one-line plain-English intro.
- **Icons:** `lucide-react` (pinned `0.460.0` — the registry's "latest" tag is a broken 1.17.0,
  do not bump blindly). `strokeWidth` ~1.75, `currentColor`. **No emoji anywhere.**
- **Voice:** British spelling, sentence-case headlines, confident and specific, every claim with a
  proof point. No exclamation marks. Banned filler: *world-class, market-leading, best-in-class,
  cutting-edge, seamless, robust, leverage, synergy* (CEO may override case-by-case).
- **Marks:** CERA®, RAPTOR™ always carry their marks. BirdsEyeView is one word.

The shared CSS lives in `src/bev.css` (re-skins the older `theme.css`). Reuse its classes:
`.bevnav .bevhero .bevcard .eyebrow .h-rule .stepper .btn .btn-primary .product-card`.

## Architecture
- `src/App.tsx` — the **sandbox shell** + the NatCat product. `product` state (`null` = the
  product directory). `view` state drives the NatCat journey (home / authority / underwrite /
  roadmap / glossary).
- `src/ui/SandboxHome.tsx` — the **product directory**. Add products to `SANDBOX_PRODUCTS`.
- `src/engine/` — the **verified AAL core**. The five files `aal.ts vuln-functions.ts
  vuln-tables.ts cera-client.ts _sanity.ts` must stay **byte-identical** — extend via `*-ext.ts`.
- `src/domain/` — pricing logic (authority, terms, pricing, portfolio, bi, …).

## How to add a new product to the sandbox
1. Add an entry to `SANDBOX_PRODUCTS` in `ui/SandboxHome.tsx` (id, name, tagline, status, Lucide
   icon, `enterable`). `status`: `live` → "Live now", `dev` → "In preview", `planned` → "Coming next".
2. Build the product as its own component under `src/ui/` (or a folder for a big one). Reuse the
   design-system classes; lead with an eyebrow + headline rule + plain-English intro.
3. In `App.tsx`, render it when `product === "<your-id>"` (mirror the `product === "natcat"` block),
   with a `‹ All products` back-link in the nav.
4. Keep it **self-contained** — don't change other products' modules.

## Conventions
- Work on a **branch**, open a **PR**, let the other review, merge to `main` (see `COLLABORATION.md`).
- Keep both sanity suites green: `npm run sanity` (14) and `npm run sanity:ext` (16).
- `npm run dev` (localhost:5173) · `npm run build` (type-check + build) · `npm run trace`.
- No API keys in the repo. No real client bordereaux (`public/sample-bdx.xlsx` is synthetic).
- British spelling, no emoji, CERA® with its mark.
