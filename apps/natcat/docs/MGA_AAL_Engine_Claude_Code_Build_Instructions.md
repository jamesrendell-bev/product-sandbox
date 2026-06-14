# CERA® MGA AAL & Pricing Engine — Claude Code Build Instructions

*Paste this into Claude Code as the build brief. It assumes the existing `/engine` TypeScript modules are available to extend. Pair with `MGA_Pricing_Engine_Build_Spec.md` (full rationale) and `MGA_AAL_Engine_Approach_and_Methodology.md` (the why).*

---

## 0. Goal

Build a web app that lets an MGA underwrite a property submission end-to-end — triage → AAL (per-peril + total) → terms → capital-aware price → wording — for a single location or a bulk bordereau (BDX), with a dark-mode map. Reuse the existing AAL engine. Run on stub hazard data now; switch to the live CERA® API by setting env vars.

## 1. Tech stack

- **Language:** TypeScript throughout.
- **Build/app:** Vite + React + TypeScript. (Vanilla TS is acceptable if preferred, but React suits the staged, multi-panel UI.)
- **Styling:** CSS variables for the BirdsEyeView theme (below). No CSS framework required; Tailwind optional.
- **Maps:** Leaflet + `react-leaflet`, with CARTO **dark-matter** tiles. Marker clustering via `leaflet.markercluster`.
- **Spreadsheet ingest (BDX):** SheetJS (`xlsx`).
- **Charts:** lightweight (hand-rolled SVG or a small lib) for EP/loss curves and the layer tower.
- **No backend required for the PoC** (browser-only); the API client calls CERA® directly or uses stubs. (If CORS/keys require it, add a thin proxy later.)

**BEV theme tokens:** navy `#131F3C`, near-black `#020619`, hot pink `#FF66C4`, pale pink `#FFF0F9`, muted grey `#5A6178`, white. Font: Aptos → Inter → system. CERA® always with the ® symbol. Match the look of `CERA_Hazard_Feed_POC.html`.

## 2. Reuse & extend the existing engine (`/engine`)

> **GUARDRAIL — read first.** The `/engine` folder in this project contains the **only** engine to use. It is exactly five TypeScript files (listed below). Do **not** import, reference, scaffold from, or reconstruct any other engine, AAL calculator, or prior codebase — there are no others in scope. Build the new app in this fresh project and treat these five files as the trusted foundation.

Keep and build on these (verified, 14/14 sanity tests pass):

- `vuln-functions.ts`, `vuln-tables.ts` — flood (JRC), TC (Emanuel/Eberenz), EQ (GEM) MDR functions. **Keep.**
- `aal.ts` — `computeAAL` (AAL = Σ TIV × MDR × ΔP, tail cap 1-in-10,000). **Keep, extend.**
- `cera-client.ts` — API client with stub mode. **Keep, extend (Section 3).**
- `_sanity.ts` — tests. **Keep, extend (Section 9).**

**Extend the engine with:**

- **US Tornado** vulnerability: map EF0–EF4 → wind speed → a convective-wind sigmoid (reuse the TC sigmoid shape with its own threshold/V_half; flag EF→mph as PoC-grade).
- **Wildfire refactor:** replace the FLI sigmoid with a **single-term** model — `AAL_wildfire = P(severe) × MDR_severe(construction) × TIV`, where `MDR_severe` is a construction-indexed conditional damage ratio (timber/WUI high, non-combustible low) × a footprint-attribution factor. Wildfire returns one threshold only.
- **Hail (forward-ready stub):** `hailMDR(diameter_cm, roofClass)` — roof-driven, low default confidence, hazard stubbed until the model ships.
- **Total AAL** = Σ per-peril AALs.
- **Combined loss EP curve** across perils (occurrence basis): build `G(loss) = 1 − Π(1 − pₚₑᵣᵢₗ(loss))`; wildfire enters as a Bernoulli large-loss. Reuse the layering maths from `CERA_Hazard_Feed_POC.html`.
- **Confidence score** per peril + overall = data-completeness × per-peril reliability.

## 3. CERA® API client (stub → live switch)

Implement against the documented contract (api-docs.birdseyeview.ai). **Env vars:** `BEV_API_BASE_URL`, `BEV_API_KEY`. If `BEV_API_KEY` is unset → **stub mode** (canned curves shaped exactly like the real response). When set → live.

- **Triage:** `POST /v1/in-depth/lite` — relative scores + key RP thresholds (EQ MMI5, USTornado EF2, TC CAT3, Wildfire Severe, Flood/FloodLivePlus 1m).
- **Pricing (single / small batch):** `POST /v1/in-depth/daily` — header `X-API-Key`; body `{ perils:[...], events:[{ index, tag, location|latitude+longitude, start_date, end_date }] }`; **max 25 peril-event combos/call**.
- **Portfolio (bulk):** `POST /v1/in-depth/batch` (async — submit, poll). Chunk the BDX accordingly.
- **Response → AAL:** each `results[]` has `threshold[]`, `probability[]` (exceedance at each threshold), `return_period[]`, `unit`. Compute `ΔPᵢ = probability[i] − probability[i+1]`; feed `threshold`+`MDR` into `computeAAL`.
- **Peril name map:** `Flood`, `FloodLivePlus` (Fathom), `TropicalCyclone`, `Earthquake`, `USTornado`, `Wildfire`, `Lightning`. Hail/SCS not yet available — gate behind a feature flag.
- Handle `failed_items` (geocoding / model_execution) and surface them.

## 4. Domain modules

Create `src/domain/`:

- `marketProfiles.ts` — config per profile (**US** and **Australia** only — serving US MGAs, Lloyd's-US syndicates, and Australian MGAs): currency, default flood region, available perils, default vulnerability assumptions, wording template id, user-type tag. Drives the whole app from one selector.
- `inputModel.ts` — submission schema + the three input tiers (minimal / standard / full COPE) and a confidence calculator.
- `aalEngine.ts` — orchestrates per-peril AAL, total, combined EP curve (wraps `/engine`).
- `terms.ts` — deductibles (flat + % wind/quake with min/max), sublimits, layer tower (attach/exhaust/RoL/prob-touch); a `suggestTerms()` that targets a net-AAL/loss-ratio.
- `pricing.ts` — capital-aware technical premium (net AAL + expenses + cost-of-capital × tail capital (1-in-200 TVaR) + margin), confidence-gated; `rateAdequacy()` comparing charged rate (from BDX) vs technical rate.
- `triage.ts` — write/refer/decline rules (thresholds from the spec §6/D.2; configurable).
- `portfolio.ts` — BDX ingest → per-location AAL; Cresta-zone aggregation; event-based PML; marginal aggregate check; diversification.
- `wording.ts` — clause-selection against two template **skeletons** (US ISO CP / E&S; AU ISR Mark V), with optional LMA clause add-ons for the Lloyd's-US user. Output a marked-up schedule. **Do not embed copyrighted ISO/LMA text** — use section skeletons; production plugs in licensed wording.
- `geocode.ts` — single free-text address → lat/long via **Nominatim** (OSM) in stub mode; bulk uses BDX `AI_Output` coordinates; live uses CERA®'s resolved lat/long.

## 5. UI / UX — staged disclosure

Single-page flow, progressive disclosure (don't render later stages until reached):

1. **Market profile + mode** (single location | upload BDX).
2. **Triage panel** — address + TIV + occupancy → instant RAG decision + (if a book is loaded) aggregate-breach flag. "Continue to full assessment" button.
3. **Assessment panel** — COPE drop-downs (each optional, each raises confidence) → **per-peril + total AAL**, AAL rate, confidence chips, rate adequacy.
4. **Terms panel** (expandable) — suggested deductibles/sublimits; advanced layer tower.
5. **Price panel** (expandable) — capital-aware build-up.
6. **Wording panel** (expandable) — clause selection + schedule preview.
7. **Map** — single pin (dark) or, in portfolio mode, clustered markers with peak Cresta zones flagged red.
8. **Portfolio dashboard** (bulk mode) — table mirroring the results template (`#, Insured, Cresta, TIV, Construction, AAL per peril, AAL Total, Rate %`) + portfolio AAL/PML + map.

Always show confidence; always offer a "refer" path; keep Stage 1 to three fields.

## 6. Data & samples

- Ship **stub curves** per peril matching the API response shape and the docs' example values.
- Include the provided sample BDX files for bulk testing; map their columns (address, Cresta Zone, TIV split A/B/C/D + Total, currency, charged rate).
- A few pre-geocoded sample single locations across markets.

## 7. File structure (suggested)

```
src/
  engine/            # reused + extended (aal, vuln-*, cera-client, _sanity)
  domain/            # marketProfiles, inputModel, aalEngine, terms, pricing, triage, portfolio, wording, geocode
  ui/                # React components per panel + map
  data/              # stubs, sample BDX, market configs
  theme.css          # BEV tokens
```

## 8. Acceptance criteria

- Engine sanity tests still pass; add tests: total AAL = Σ per-peril; layer ELs reconcile to the full ground-up; wildfire single-term behaves; confidence falls as fields are removed.
- Single-location flow returns a per-peril + total AAL with confidence on stub data, end to end.
- BDX upload produces a portfolio table + map + accumulation flags.
- Setting `BEV_API_KEY` switches to live with no code change beyond config.
- Styling matches the BEV theme; map is dark.

## 9. Build sequence

1. Engine extensions (US Tornado, wildfire single-term, total AAL, combined EP) + tests.
2. API client stub/live + peril mapping.
3. Single-location UI: profile → triage → AAL + confidence.
4. Terms + capital price + rate adequacy.
5. Dark map (single pin) + Nominatim geocode.
6. Portfolio: BDX ingest → table → Cresta aggregation → PML → map clustering + peak-zone flags + aggregate check.
7. Wording clause-selection (3 skeletons).
8. Polish, acceptance tests.

## 10. Guardrails

- **No copyrighted wording text** (ISO/LMA) — section skeletons only; ISR Mark V may be referenced as it's public.
- **No API keys in the repo** — env vars only; never commit.
- All figures are **illustrative** until the live feed and calibrated curves land — label clearly.
- **Confidence-gate** the capital number; never show false precision on thin data.
- Conversions (CAT→m/s, MMI→PGA, EF→mph, hail diameter→MDR) are PoC-grade — mark them and keep them in one place for easy recalibration.
