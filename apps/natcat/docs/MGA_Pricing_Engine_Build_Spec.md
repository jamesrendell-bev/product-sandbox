# CERA® MGA AAL & Pricing Engine — Build Spec (v0.2)

*Internal build spec. June 2026. Supersedes v0.1. Now grounded in the real assets: the verified TS engine (`/engine`), `BEV_AAL_Engine_Paper_v2.docx`, `BEV_AAL_Calculator_v2.xlsx`, the Market Lane bordereaux, and the portfolio results template. Demo styling follows the CinFin look (`CERA_Hazard_Feed_POC.html`).*

---

## 0. What changed from v0.1

We now build on an existing, verified foundation rather than from scratch. The April 2026 AAL engine already implements the hazard→vulnerability→AAL chain for four perils with sourced open-source curves, and its maths is validated (14/14 sanity tests). v0.2 reuses that core and adds the MGA layers: more perils, total AAL, terms, capital-aware pricing, confidence, portfolio mode and wording.

## 1. Purpose & product context

Give a semi-sophisticated MGA everything to underwrite a new property submission — and make them more sophisticated — from whatever data they have, using owned CERA® hazard + public vulnerability science. Two products share this engine:

- **Sophisticated buyers (e.g. Cincinnati Global on hx):** consume the **hazard curve**; they apply their own vulnerability. (Separate CinFin track.)
- **MGAs (this build):** CERA® applies the vulnerability and returns **the answer** — triage, decision, AAL, price, terms, wording.

Scope: **property**, all occupancy/construction. Geographies: **US and Australia only** — serving US MGAs, Lloyd's syndicates writing US business, and Australian MGAs. (Europe and Canada are out of scope, which removes the European-windstorm coverage gap.)

## 2. Foundation (reuse from the existing engine)

- **AAL method (keep, it's documented & tested):** `AAL = Σ [ TIV × MDR(intensityᵢ) × ΔPᵢ ]`, `ΔP = 1/RPᵢ − 1/RPᵢ₊₁`, tail capped at 1-in-10,000. *(Reconcile the demo's earlier trapezoid+anchor to this step method so everything matches the paper.)*
- **Vulnerability library (reuse verbatim):** Flood = JRC Huizinga 2017 (depth m, region×occupancy); Wildfire = Emanuel 2011 sigmoid (FLI kW/m); TC = Emanuel + Eberenz 2021 sigmoid (wind m/s, by basin); Earthquake = GEM 2023 lognormal fragility (PGA g, by construction class).
- **CERA API contract (reuse):** `POST /v1/in-depth/daily` → per-peril `threshold[] / probability[] / return_period[] / unit` (full curve). Stub mode when no key.
- Defaults-with-overrides pattern already supports varying data levels.

## 3. Data status & the demo plan (important)

**There is no live hazard-distribution feed from data science yet.** So the working demo runs on:

1. the engine's **stub curves** (already present), and/or
2. **example response curves from the CERA API documentation** (James to provide) — preferred, because they make the demo reflect real CERA output shapes and units.

The engine is wired so that swapping the stub for the live `/v1/in-depth/daily` feed is a one-line change once data science ships it. Build against the API contract now; plug in live later.

## 4. Perils — live vs roadmap

- **Live now:** Flood, Tropical Cyclone, Wildfire, Earthquake (engine), **+ US Tornado** (Enhanced Fujita band → wind speed → convective-wind vulnerability; EF→mph flagged PoC-grade like the other conversions).
- **Roadmap (~year-end 2026):** **Australian Hail**, **US Hail** (severity = **hailstone diameter**; vulnerability is roof-driven and the least-served by public science → lower default confidence + "to-calibrate" flag; build the slot forward-ready, stub the hazard until the model ships), then **full SCS** (hail-led combination).
- **Honest GTM note:** convective coverage today is US Tornado only; the US convective story completes when hail/SCS land. Be straight with prospects about timing.

## 5. Input — the real BDX schema + tiered confidence

Source of truth: the **Lloyd's coverholder bordereau** (Market Lane format). What it reliably contains:

- **Always:** address (street/suburb/city/state/postcode/country), **Cresta Zone**, currency, **TIV split — A-Buildings / B-Contents&Stock / C-Other / D-Business-Interruption + Total Insurable Value**, policy limit, order %.
- **Sometimes:** construction class, year built, occupancy detail.
- **Rarely:** roof type/age, first-floor elevation, secondary modifiers.
- The CERA® **AI Ingestion Tool** already turns a raw BDX into an `AI_Output` sheet with **geocoded lat/long** + cleaned fields — this is the bridge from BDX → location → hazard API.

**Input tiers → confidence:**

| Tier | Data | Vulnerability | Confidence |
|---|---|---|---|
| 0 — minimal | address/geocode, TIV, broad occupancy | generic default curve for occupancy/region | low |
| 1 — standard | + construction class, year built | construction-specific curve (GEM class, etc.) | medium |
| 2 — full | + roof, elevation, secondary modifiers | characteristic-specific (Phase 2 / OED) | high |

**Confidence score** (per peril + overall) = data completeness × CERA® per-peril reliability at the location. Low confidence → "refer" nudge and suppresses the capital number (§8). This is the explicit mechanism for "give confident scores at varying levels of information."

**Single-location mode:** the user types/builds a location and selects from the broad fields they know (drop-downs for occupancy/construction), adding detail to sharpen. **Bulk mode:** upload a BDX (or its AI_Output), map columns once, score every row.

## 6. AAL output — per peril + total

For each in-scope peril: hazard curve → physical-unit conversion → MDR → per-peril AAL and AAL rate (% TIV). Then:

- **Total NatCat AAL = sum of per-peril AALs** (additive, exact) — the **headline** for the less-sophisticated user.
- **Per-peril breakdown** one click down (matches the portfolio results template: `AAL — EQ`, `AAL — Flood`, … `AAL — Total`, `AAL Rate %`).
- **Combined loss EP curve** for the tail (occurrence combination, not summed tails) — feeds terms, capital and portfolio PML.
- Apply MDR primarily to Buildings + Contents; treat **Business Interruption (TIV split D)** separately/with care (time-element) rather than lumping all TIV — a refinement the BDX TIV split enables.

## 7. Terms (suggested + manual)

Deductibles (incl. **% windstorm / % quake** with min/max), peril **sublimits**, and an optional **layer tower** (reuse the demo's multi-layer engine: attach / exhaust / rate-on-line / probability-of-touch). Engine **suggests** terms to hit a target (net AAL % / loss ratio / volatility) and the user overrides. Net AAL after terms shown live. *(Pulls forward the paper's Phase 4 financial module for the MGA product.)*

## 8. Capital-aware price (advanced layer — the differentiator)

`Technical premium = net AAL + expenses + capital load + profit`, where **capital load = cost-of-capital % × capital consumed**, capital consumed = a tail measure (default **1-in-200 TVaR**; VaR selectable) off the combined EP curve. Transparent line-by-line build-up. Defaults (editable): expenses ≈30%, cost of capital ≈12%, basis 1-in-200 TVaR. **Gated by confidence** — low-confidence risks show a range + refer, not a precise number. Framed as pricing to the capacity provider's economics, not replacing their capital model.

## 9. Triage / appetite (in-depth defaults, trimmable)

**Single risk:** auto-quote if net AAL < ~1.5% TIV and confidence > ~65% and no flags; refer if net AAL ~1.5–3%, or confidence ~40–65%, or any peril reliability low, or flood 1-in-100 depth >1m without sublimit; decline/strong-refer if net AAL > ~3% TIV, or 1-in-100 net loss > ~25% TIV, or confidence < ~40%, or ITV flag, or peak-zone aggregation full. **Portfolio:** Cresta-zone aggregation limits; flag risks that materially raise portfolio PML/peak zone; concentration & capacity warnings. *All thresholds calibrate with a property underwriter.*

## 10. Portfolio mode (bulk / BDX)

- Map BDX/AI_Output columns; per-location AAL + confidence; roll up by **Cresta Zone** (the BDX's native accumulation unit).
- **Total portfolio AAL** = sum of location net AALs.
- **Portfolio EP curve / PML via event-based accumulation:** apply each catalogue event footprint across all locations, sum per-event loss, repeat over the catalogue → portfolio distribution, 1-in-100/250 PML, TVaR. *(Rigour depends on event-footprint data per peril — confirm coverage; pull forward of paper Phase 4 OEP/AEP.)*
- **Accumulation by Cresta zone/peril**, **diversification benefit** (PML/AAL ratio), **capacity utilisation**.
- **Marginal pricing:** price a new risk on its contribution to portfolio PML/TVaR — diversifying cheaper, peak-zone dearer.
- Output mirrors and extends the existing **portfolio results template** (per-peril + total AAL + rate, by Cresta zone), plus PML and capital.

## 11. Wording — clause selection

From the priced/termed risk, **select clauses against an existing wording template**: perils covered, limits, sublimits, deductibles (incl. % deductibles), key exclusions/conditions — a marked-up clause selection / schedule, not a bespoke wording. *(Needs an example wording template from James.)*

## 12. UX & styling

Progressive disclosure: minimal input → instant **total AAL + confidence**; unfold to per-peril → terms → layers → capital only as the user wants more. Confidence always visible. Glass-box throughout; refer path on low confidence. **Styling: the CinFin look** (navy `#131F3C` / hot pink `#FF66C4`, Aptos, CERA® with ®) — not the old calculator styling.

## 13. Build approach & roadmap fit

- **Demo (here, Cowork):** extend the TS engine + a CinFin-styled front-end into a clickable single-/portfolio-mode PoC, running on stub / API-doc curves.
- **Production (Claude Code):** the same spec + engine continued as a proper repo when ready.
- **Maps to the paper's phases:** this build = Phase 1 (default engine, now incl. US Tornado) + accelerated Phase 2 (BDX/OED ingestion, construction/year enrichment) + pulled-forward Phase 4 (terms, capital, OEP/AEP/PML). Phase 3 (proprietary calibrated curves, Lloyd's approval) stays 2027.

## 14. Open items

- **CERA API docs** → example distribution curves to drive a live-feeling demo (replaces stub).
- **SCS/Hail API units** confirmed: Tornado = EF band (live); Hail = hailstone diameter (roadmap; cm vs inch to confirm).
- **Example wording template** for §11.
- **Live hazard feed** from data science — pending; engine ready to switch on.
- Calibrate the PoC-grade unit conversions (CAT→m/s, MMI→PGA, EF→mph, hail diameter→MDR) and the triage/pricing defaults with a property underwriter + the science team.

---

## Appendix A — CERA® API integration (confirmed from api-docs.birdseyeview.ai)

**Auth:** `X-API-Key` header; keys expire 1 year; per-peril permissions (check via `GET /v1/perils`). Base URL is provided separately (docs use an `api.example.com` placeholder). We have no key, so build on stub curves shaped to the exact response format below + the docs' example values; the live feed drops in unchanged.

**Endpoints and how we use each:**

- `POST /v1/in-depth/daily` — synchronous, **≤25 peril-event combinations** per call. Single-location and small-batch full-curve AAL.
- `POST /v1/in-depth/batch` — asynchronous. **Portfolio / bulk BDX** (thousands of rows).
- `POST /v1/in-depth/lite` — fast **triage**: globally-relative scores + key return-period thresholds (EQ MMI5, USTornado EF2, TC CAT3, Wildfire Severe, Flood / FloodLivePlus 1m).
- `/v1/in-depth/expanding` — contingency cumulative windows (not core to MGA property).

**Response → AAL input:** each `results[]` entry gives `threshold[]` (intensity values), `probability[]` (exceedance probability at each threshold), `return_period[]`, and `unit`. So `ΔPᵢ = probability[i] − probability[i+1]`, and `AAL = Σ TIV × MDR(thresholdᵢ) × ΔPᵢ` — consistent with the engine; use `probability[]` directly.

**NatCat perils live now (API name · unit · note):**

- `Flood` · m · GloFAS fluvial — multi-depth curve.
- `FloodLivePlus` · m · FATHOM combined pluvial/fluvial/coastal — multi-depth curve (preferred).
- `TropicalCyclone` · Saffir-Simpson · CAT0–CAT5.
- `Earthquake` · MMI · MMI3–MMI9.
- `USTornado` · Enhanced Fujita · EF0–EF4 (**live now**).
- `Wildfire` · single `Severe` threshold (>5ha in N. America/Australia, else FWI>24) — **occurrence probability, not a multi-point curve**, so wildfire AAL = P(Severe) × conditional MDR by construction.
- `Lightning` · severity levels.

**Not yet on the API:** Hail, full SCS (roadmap ≈ year-end). Build the slots forward-ready and stub them.

## Appendix B — Wording template (clause selection, §11)

Model clause-selection on the **ISR Mark V** wording (Industrial Special Risks — the exact policy class in the Market Lane BDX). Public reference copies: Allianz / einsure **POL566BA** (Mark V); Chubb, Zurich, Swiss Re, Ansvar (Mark IV).

**Structure to template:** Schedule (Situation, **Limits & Sub-Limits of Liability**, **Deductibles/Excess**) · **Section 1 — Material Damage** · **Section 2 — Business Interruption** · Basis of Settlement · Definitions (incl. Flood) · General Exclusions (incl. Flood inclusion/exclusion) · General Conditions · Memoranda.

**Why it lines up perfectly:** the BDX TIV split maps straight onto the wording — **A-Buildings / B-Contents / C-Other → Section 1**; **D-Business Interruption → Section 2** — and per-peril **Sub-Limits** and **Deductibles** are native ISR concepts, so our suggested terms slot directly into the schedule. Clause-selection output = pick perils covered, set per-peril sub-limits/deductibles, flag relevant exclusions (e.g. Flood), and produce a marked-up schedule against the Mark V skeleton.

## Appendix C — Multi-market profile selector & wording templates

**Market Profile selector at the top of the app** sets everything downstream from one choice. **Scope is deliberately narrowed to two risk geographies — US and Australia:**

| Profile | Serves | Currency | Default flood region | Peril set (live) | Wording template |
|---|---|---|---|---|---|
| **US** | US MGAs + Lloyd's syndicates writing US business | USD | North America | Hurricane (TC), US Tornado, Wildfire, Flood, Earthquake | **ISO Commercial Property** (CP 00 10 + CP 10 30) + manuscript endorsements |
| **Australia** | Australian MGAs | AUD | Oceania | Cyclone (TC), Bushfire (Wildfire), Flood, Earthquake, Lightning | **ISR Mark V** |

It also sets **user type** (Lloyd's-US syndicate / US MGA / Australian MGA) for terminology and default appetite, and toggles **roadmap perils** (AU/US Hail, SCS) as they go live. Both geographies are fully covered by CERA®'s live perils — no coverage gap.

**Three wording templates (model the standard skeletons; do not reproduce copyrighted text):**

- **Australia/NZ — ISR Mark V** (found, public): Schedule → Section 1 Material Damage → Section 2 Business Interruption → Sub-Limits → Deductibles → Basis of Settlement → Definitions → General Exclusions → Conditions → Memoranda.
- **Lloyd's syndicates writing US business** use **US forms** (ISO CP / E&S manuscript, as above); they may *add* standard **LMA clauses** (e.g. cyber, communicable-disease, war exclusions) from the Lloyd's Wordings Repository. So the engine carries two primary templates — US (ISO/E&S) and AU (ISR Mark V) — with optional LMA clause add-ons for the Lloyd's-US user.
- **US E&S — ISO Commercial Property forms**: Building & Personal Property Coverage Form (CP 00 10) + Causes of Loss–Special Form (CP 10 30) + Commercial Property/Common Policy Conditions, with surplus-lines manuscript endorsements. ISO text is copyrighted; model the standard section structure and plug in licensed forms in production.

**Honest peril-coverage notes:** AU/US **Hail** and full **SCS** are roadmap (≈year-end 2026) — build the slots forward-ready and stub them. With scope limited to US and Australia, **every other in-scope peril is live on the API**, so there is no material coverage gap (the European-windstorm issue is now out of scope).

## Appendix D — Wildfire loss treatment & the staged underwriting flow (design decisions)

### D.1 Wildfire without a severity curve
CERA® wildfire returns a single occurrence threshold ("Severe" = >5ha in N. America/Australia, else FWI>24), not a multi-threshold distribution. Do **not** fabricate a curve. Model it as a single-term AAL:

`AAL_wildfire = P(severe fire / yr) × MDR_severe(construction) × TIV`

- `MDR_severe` = conditional mean damage *given* a severe fire affects the property = P(property in burn footprint | severe fire) × damage-if-burned. Construction / defensible space / roof drive it (timber WUI ≈0.8–1.0; non-combustible/ember-resistant ≈0.3–0.5). Construction matters at the **vulnerability** step, not the hazard step.
- **Drop the PoC FLI sigmoid** for wildfire (it needs an intensity the hazard doesn't supply); replace with a construction-indexed conditional MDR, flagged to-calibrate.
- In the combined tail/EP curve, wildfire enters as a **Bernoulli large-loss** (loss = MDR_severe × TIV at probability P(severe)).
- Wildfire carries a **lower default confidence** (single threshold + footprint-attribution assumption). Future ask to data science: fire-size bands (5/50/500 ha) or distance-to-fire to build a real curve.

### D.2 Two-stage flow — triage first, then terms (maps to the API)
- **Stage 1 — Triage / clearance (minimal input, instant):** market profile + address + TIV + occupancy → fast read via the **Lite endpoint** (relative scores + key RPs) + **aggregate check** (if book loaded) → RAG decision: write / refer / decline.
- **Stage 2 — Full assessment (on demand):** add construction/year/COPE → full AAL via **In-Depth Daily** → suggested terms → capital price → wording. Drop-downs deepen only as the underwriter proceeds.
- Lite-for-triage / In-Depth-for-pricing mirrors CERA®'s Lite/In-depth modes and avoids running the full model on risks that will be declined.
- **Not strictly linear:** terms feed back into the decision (a ground-up "refer" can become "write" with a higher deductible/sublimit); the decision re-evaluates after terms.

### D.3 Aggregate / accumulation check (differentiator)
If the underwriter loads their in-force book (BDX/portfolio), each new risk is checked **marginally** at triage: does it push a Cresta zone / peril aggregate over the appetite limit, and what does it add to the portfolio 1-in-100/250 PML? An accumulation breach is a decline/refer trigger **independent of price**. This is why single-risk and portfolio live in one tool — portfolio context informs the single-risk call.

### D.4 Rate adequacy (low effort, high value — uses BDX data)
The BDX already carries charged premium and rate. Compare **charged rate vs technical rate** → an adequacy indicator per risk and per book ("charging 0.38%; technical 0.55% → ~30% underpriced"). Especially powerful on renewal books; surfaces from data the MGA already holds.

### D.5 Light, honest flags
- **ITV / values adequacy:** flag implausible TIV per sq ft / occupancy where size data exists.
- **Non-modelled perils:** explicitly state what is *not* in the number for the chosen market (e.g. EU windstorm gap, hail pre-launch), so the underwriter knows the number's scope.

**Refined end-to-end flow:** profile → triage (lite + aggregate) → [decision] → full COPE → AAL (per-peril + total + confidence + rate adequacy) → terms → capital price → wording — staged so each step asks for more only as the risk is worked. Technical enough for the expert; a three-field gate for everyone else.

## Appendix E — Map view & geolocation

- **Map (dark mode):** Leaflet (open-source) + **CARTO dark-matter** tiles (free, dark, on-brand with BEV navy). Single location → marker + popup (peril RAG / total AAL). Bulk BDX → all locations plotted with **marker clustering**, markers coloured/sized by AAL or TIV.
- **Accumulation flagging:** aggregate by **Cresta zone**; highlight **peak zones whose summed TIV/PML breaches the appetite limit** (red); optional heat layer for concentration. Visual companion to the Appendix D.3 aggregate check.
- **Geolocation (open-source) — mostly already solved upstream:** CERA®'s API resolves a `location` string to lat/long, and the BDX `AI_Output` sheet already carries coordinates from the AI Ingestion Tool. **Bulk plotting uses those existing coordinates — no live geocoding.** The only place the demo needs a standalone geocoder is **free-text single-address entry without an API key**, where we use **Nominatim (OpenStreetMap)** — free/open but rate-limited (~1 req/s, attribution required), so single lookups only, not bulk. Production uses CERA®'s own resolution / AI ingestion.
- **Practical note:** map tiles need internet, so the map view requires a live connection (unlike the offline CinFin demo).
- **Future (post-PoC, out of scope):** overlay the client's stored in-force exposure for true book-level accumulation.
