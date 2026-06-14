# Model reassessment guide

A walkthrough for interrogating what this engine actually does, where the numbers come from, and which of them are real vs placeholder. Read alongside `npm run trace` (the exact run is embedded in §5) and the build spec.

> **One-line framing:** the *machinery* (hazard curve → vulnerability → AAL → terms → capital → price) is sound and tested; the *inputs* are mostly stub/PoC values. Almost everything questionable is a **number in a table**, not a flaw in the maths. Every such number is centralised so you can change one value and re-run.

---

## 1. The five things most worth challenging

1. **The stub hazard curves are hot and arbitrary.** The demo's flood curve implies 0.5 m of water at **1-in-4 years**; flood alone comes out at ~5% of TIV and dominates everything. These return periods and depths are hand-picked placeholders ([cera-client-ext.ts](src/engine/cera-client-ext.ts) `stubCurveFor`), not CERA® output. Until the real feed lands, *every headline AAL is a property of the stub, not the risk.*
2. **Earthquake contributes ~$0** in the trace. The MMI→PGA conversion holds PGA at 0.001 g below MMI 5 ([vuln-tables.ts](src/engine/vuln-tables.ts) `mmiToPGA`), so low-MMI exposure produces no loss. Right for low-seismicity AU; worth checking it isn't *silently* zeroing EQ where it should bite (e.g. Sacramento).
3. **The single-risk capital number degenerates to the sublimit.** With a 50% flood sublimit, the combined loss is capped at $4.5m, so VaR₁₀₀ = VaR₂₀₀ = TVaR₂₀₀ = $4.5m (a point mass at the cap — see §5). The technical premium then lands at ~16% of TIV, driven almost entirely by "capital consumed = the sublimit." Capital-on-a-single-sublimited-risk is conceptually weak; this measure is really meant for the **portfolio** tail.
4. **Wildfire's whole AAL rests on two invented constants.** `footprint attribution = 0.55` and a `damage-if-burned` table ([vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts)). There is no severity curve — it's `P(severe) × MDR_severe × TIV`. Defensible structure, uncalibrated magnitude.
5. **Portfolio PML assumes full within-peril correlation.** Locations are summed at matched return periods (the standard accumulation *upper bound*), then perils combined independently. That's why diversification came out at only ×1.02 — it's baked in by the method, not discovered. Honest, but conservative and crude.

---

## 2. The pipeline (what happens to one risk)

```
CERA® hazard curve            threshold[] · probability[] (or return_period[]) · unit
   │   (stub now / live API by env var)
   ▼
physical intensity            CAT→m/s · MMI→PGA · EF→mph→m/s · depth m · hail cm     ← PoC conversions
   ▼
MDR(intensity)                flood JRC · TC Eberenz · EQ GEM · tornado/​wildfire/​hail   ← public science + PoC
   ▼
per-peril AAL                 Σ TIV_damageable × MDR_i × ΔP_i   (ΔP = p_i − p_{i+1}, tail cap 1-in-10,000)
   │                          wildfire = P(severe) × MDR_severe × TIV  (Bernoulli)
   ▼
total AAL                     exact Σ of per-peril                         ← headline
combined occurrence EP        G(loss) = 1 − Π(1 − p_peril(loss))           ← feeds tail/terms/capital
   ▼
terms                         deductible (flat / %wind / %quake) + sublimit → net curves
   ▼
layer tower                   EL = ∫ G dx over [attach, attach+limit]
capital-aware price           net AAL + expenses + CoC×(TVaR₂₀₀ − AAL) + profit
   ▼
triage (RAG) · wording        write/refer/decline · clause schedule
```

`TIV_damageable` = Buildings + Contents + Other (A+B+C). Business Interruption (D) is held out of the MDR step and only re-enters in the wording's Section 2. **Note:** per-peril AAL *rate* in the engine/trace is on damageable TIV; the app's headline rate is on **total** TIV. Worth aligning before anyone quotes a "% of TIV" externally.

---

## 3. Per-peril model — inputs, function, source, status

| Peril | Intensity in | Vulnerability function | Source | Status |
|---|---|---|---|---|
| **Flood / FloodLivePlus** | depth (m) | JRC Huizinga 2017 depth-damage, region × occupancy, piecewise-linear | [vuln-tables.ts](src/engine/vuln-tables.ts) `FLOOD_MDR` | **Real curve**, real source. Region defaults to profile (Oceania/N.America). FloodLivePlus reuses the same depth curve. |
| **Tropical Cyclone** | Saffir-Simpson cat → m/s | Emanuel/Eberenz 2021 sigmoid, by basin | [vuln-tables.ts](src/engine/vuln-tables.ts) `CYCLONE_PARAMS`, `TC_CAT_TO_MS` | Real sigmoid + calibration. **CAT→m/s midpoints are PoC** (`CAT3=50`, `CAT5=70`…). |
| **Earthquake** | MMI → PGA (g) | GEM 2023 lognormal fragility, by construction | [vuln-tables.ts](src/engine/vuln-tables.ts) `EARTHQUAKE_PARAMS`, `mmiToPGA` | Real fragility. **MMI→PGA (Worden 2012) holds ~0 below MMI5** → low-MMI risks read $0. |
| **US Tornado** | EF band → mph → m/s | convective-wind sigmoid (TC shape, own thresholds) | [vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts) `TORNADO_PARAMS`, `EF_TO_MPH` | **Structure reused; thresholds invented.** EF→mph midpoints PoC. |
| **Wildfire** | *(none — occurrence only)* | `P(severe) × footprint-attribution × damage-if-burned(construction)` | [vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts) `WILDFIRE_*` | **Single-term by design** (CERA® gives one "Severe" prob). `footprint=0.55` and damage-if-burned table both **invented**. |
| **Hail** | diameter (cm) | roof-driven sigmoid, capped | [vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts) `HAIL_PARAMS` | **Stubbed** — hazard not on the API yet. Returns `unsupported`, excluded from totals. |
| **Lightning** | severity level | small per-level conditional MDR | [vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts) `LIGHTNING_LEVEL_TO_MDR` | Minor peril, invented small values. |

---

## 4. Assumptions register — every hard-coded value to question

All in two files: [vuln-tables.ts](src/engine/vuln-tables.ts) (verified core) and [vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts) (extensions). Conversions also in [vuln-tables.ts](src/engine/vuln-tables.ts).

| Assumption | Value | Where | Why question it |
|---|---|---|---|
| Stub flood RP/depth | depths ×[1.05,4,15,40,90,250,600] yr | `stubCurveFor` | Implies flooding every ~4 yr → dominates AAL. **Biggest distortion.** |
| Stub curves generally | hand-picked RPs per peril | `stubCurveFor` | Not CERA®; placeholder shapes only. |
| CAT→m/s | CAT0..5 = 18,33,43,50,58,70 | `TC_CAT_TO_MS` | Band midpoints; replace with native m/s. |
| MMI→PGA floor | 0.001 g below MMI5 | `mmiToPGA` | Zeroes low-MMI EQ loss. |
| EF→mph | EF0..5 = 74,96,124,153,184,220 | `EF_TO_MPH` | Operational midpoints; coarse. |
| Tornado sigmoid | v_thresh 22–30, v_half 34–52 | `TORNADO_PARAMS` | Invented; no calibration source. |
| Wildfire footprint | 0.55 | `WILDFIRE_FOOTPRINT_ATTRIBUTION` | Single biggest wildfire lever; pure assumption. |
| Wildfire damage-if-burned | 0.30–0.95 by class | `WILDFIRE_DAMAGE_IF_BURNED` | Plausible ordering, invented magnitudes. |
| Hail params | all | `HAIL_PARAMS` | Stub; hazard absent anyway. |
| Confidence weights | base 0.5, +0.15/+0.10/… | [confidence.ts](src/engine/confidence.ts) `WEIGHTS` | Arbitrary; drives the refer nudge + capital gate. |
| Peril reliability | 0.30–0.95 | [confidence.ts](src/engine/confidence.ts) `PERIL_RELIABILITY` | Sets confidence band; subjective. |
| Pricing defaults | expense 30%, CoC 12%, profit 5%, TVaR 1/200 | [pricing.ts](src/domain/pricing.ts) `DEFAULT_PRICING` | Editable in UI; sanity-check vs real economics. |
| Triage thresholds | write<1.5%, decline>3% AAL; conf 65/40% | [triage.ts](src/domain/triage.ts) `DEFAULT_THRESHOLDS` | "Calibrate with a property underwriter." |
| Default terms | per-peril ded/sublimit | [terms.ts](src/domain/terms.ts) `DEFAULT_TERMS` | Reasonable, not market-checked. |
| Portfolio correlation | full within-peril, indep cross-peril | [portfolio.ts](src/domain/portfolio.ts) `portfolioPML` | Upper-bound accumulation; crude. |
| Appetite share (peak zone) | 0.20 of book TIV | [portfolio.ts](src/domain/portfolio.ts) | Flag trigger; arbitrary. |
| Row cap | 600 locations | [PortfolioPanel.tsx](src/ui/PortfolioPanel.tsx) | Demo compute cap (surfaced in UI). |
| Stub location factor | hash → 0.65–1.35 | `cera-client-ext.ts` `locFactor` | Makes addresses "feel" different; meaningless magnitude. |

---

## 5. The audit trace (real `npm run trace` output)

Reproducible run: commercial, **damageable TIV $9,000,000**, AU profile, stub location factor fixed at 1.0. Annotations in **bold**.

```
PERIL: TropicalCyclone   (Saffir-Simpson → m/s)   ⚠ CAT→m/s midpoints PoC
  1-in-50  CAT3  50.0   MDR 0.0333   ΔP 0.0133   loss $299,503   contrib $3,993
  1-in-500 CAT5  70.0   MDR 0.1726   ΔP 0.0019   loss $1,553,175 contrib $2,951
  → AAL = $13,008  (0.145% of damageable TIV)

PERIL: FloodLivePlus   (m → m)
  1-in-4   0.5   MDR 0.1400   ΔP 0.1833   loss $1,260,000   contrib $231,000   ← dominates
  1-in-15  1.0   MDR 0.2800   ΔP 0.0417   loss $2,520,000   contrib $105,000
  → AAL = $448,613  (4.985% of damageable TIV)        ← flood ≈ 88% of total

PERIL: Wildfire   (single-term)   ⚠ footprint 0.55 + damage-if-burned invented
  P(severe)=0.0167 (1-in-60), MDR_severe=0.3025, loss=$2,722,500
  AAL = P × MDR × TIV = $45,375  (0.504%)

PERIL: Earthquake   (MMI → PGA g)   ⚠ MMI→PGA ~0 below MMI5
  every row MDR≈0 → AAL = $0  (0.000%)               ← EQ silently contributes nothing

TOTAL NatCat AAL = $506,996  (5.633% of damageable TIV)   ← driven by the hot flood stub

DEFAULT TERMS → NET AAL
  TropicalCyclone  2%/100%  gross $13,008   net $6,504
  FloodLivePlus    1%/50%   gross $448,613  net $416,550   ← sublimit caps loss at $4.5m
  Wildfire         2%/100%  gross $45,375   net $42,375
  Earthquake       5%/50%   gross $0        net $0
  → TOTAL NET AAL = $465,429  (5.171%)

COMBINED OCCURRENCE EP (net)
  1-in-100 PML  = $4,500,000
  1-in-200 VaR  = $4,500,000      ← identical because loss is capped at the flood
  1-in-200 TVaR = $4,500,000        sublimit (50% × $9m). Tail = point mass at the cap.

LAYER TOWER
  L1  $2.25m xs $0.00m   touched 97.89%   EL $914,630   RoL 40.65%   ← flood almost always hits
  L2  $2.25m xs $2.25m   touched 10.80%   EL $91,246    RoL 4.06%
  L3  $4.50m xs $4.50m   touched  0.00%   EL $0         RoL 0.00%    ← nothing above the cap

CAPITAL-AWARE TECHNICAL PRICE (confidence 'Medium')
  net AAL                $465,429
  tail (TVaR 1/200)      $4,500,000
  capital consumed       $4,034,571   = tail − AAL  ← effectively just the sublimit
  capital load (12%)     $484,149
  expenses (30%)         $438,266
  profit (5%)            $73,044
  TECHNICAL PREMIUM      $1,460,888   (16.232% of TIV)   ← capital-dominated, implausibly high
```

**What this trace tells you to ask:**
- Is a 16%-of-TIV technical rate ever sane? No — it's an artifact of (a) the hot flood stub and (b) treating the sublimit as "capital consumed" on a single risk. **Capital pricing belongs at portfolio level**; for a single risk consider dropping it or basing the load on something other than a point-mass tail.
- Should EQ really be $0? Check whether `mmiToPGA`'s sub-MMI5 floor is hiding genuine exposure in US quake zones.
- Flood at ~5% TIV is the stub talking. Re-run with a realistic flood curve and the whole picture changes.

---

## 6. What each output *means*

- **AAL (per peril / total):** expected annual loss = area under the loss-vs-probability steps. Total is an exact sum (perils are additive in the mean).
- **AAL rate:** AAL ÷ TIV. (Engine: damageable TIV; app headline: total TIV — align this.)
- **Confidence:** data-completeness × peril reliability. Drives the refer nudge and **gates the capital number** (Low → range, not a point).
- **Combined EP / PML:** exceedance of the *maximum* peril loss in a year (occurrence basis), not the sum. PML₁₀₀ = loss at 1% annual probability.
- **TVaR₂₀₀:** average loss given you're beyond the 1-in-200 point — the capital proxy.
- **Technical premium:** loss cost + expense + capital load + profit. Treat as illustrative.
- **RAG:** write / refer / decline from the triage thresholds; re-evaluated after terms.

---

## 7. Deployment blockers (resolve before any public deploy)

1. **The sample BDX is real-looking coverholder data.** `public/sample-bdx.xlsx` (and `samples/`) contain insured names, addresses and TIVs (Market Lane format). **Do not publish this on a public Netlify site.** Replace with a synthetic bordereau, or password-gate the site, before deploy. (The "Load sample" button depends on it — swap the file, keep the button.)
2. **A live API key would be exposed.** Env vars are baked into the client bundle at build time ([vite.config.ts](vite.config.ts)). Deploy in **stub mode** (no key) for a public demo; going live needs a thin proxy holding the key (the brief flags this too). See `netlify.toml` comments.
3. **Align the AAL-rate denominator** (damageable vs total TIV) before the % is shown to a client.

Staged and ready (nothing pushed): `.gitignore`, `netlify.toml`, `.env.example`.

---

## 8. How to poke at it tomorrow

```bash
npm run trace        # the full numbers trace above — edit TIV/peril set at the top of src/engine/_trace.ts
npm run sanity       # 14/14 — vulnerability functions vs the Excel methodology
npm run sanity:ext   # 10/10 — extensions + total/EP/confidence invariants
npm run dev          # the app
```

Fastest experiments:
- **Cool the flood stub:** edit the flood `return_period` in `stubCurveFor` ([cera-client-ext.ts](src/engine/cera-client-ext.ts)) → re-run `npm run trace`.
- **Test the wildfire lever:** change `WILDFIRE_FOOTPRINT_ATTRIBUTION` ([vuln-tables-ext.ts](src/engine/vuln-tables-ext.ts)).
- **Stress EQ:** raise the stub MMI frequencies or check `mmiToPGA` at MMI 6–7.
- **Sanity-check pricing:** the build-up reacts live to the expense/CoC/profit inputs in the Price panel.
