# MGA AAL & Pricing Engine — Committed Change Punch-List (v1)

*COMMITTED by James, June 2026. Paste into Claude Code. Work through in order; keep both sanity suites green; add tests where stated. Engine core (`aal.ts`, `vuln-functions.ts`, `vuln-tables.ts`, `cera-client.ts`, `_sanity.ts`) stays untouched — changes go in the `-ext` files and domain/UI.*

---

## 0 · Confidentiality (do first)

Real client bordereaux must not live in the repo. **Delete** `BDX_AU_GOAT_KOKO.xlsx`, `BDX_AU_MGA_Build_with_AI_Output.xlsx` and any other Market Lane–derived files from the repo (including `public/`). Replace with the provided **`Synthetic_Sample_BDX.xlsx`** (500 fully synthetic AU rows, sheet `AI_Output`, mapper-compatible columns) as `public/sample-bdx.xlsx`.
**Accept:** repo contains no real client data; "Load sample AU bordereau" loads 500 synthetic rows.

## 1 · Live-API switch (`App.tsx`)

Rename env reads to `import.meta.env.VITE_BEV_API_KEY` / `VITE_BEV_API_BASE_URL` (Vite only exposes `VITE_`-prefixed vars by default — current names silently never activate). Add `.env.example` with both names and a comment: *production must route via a thin server proxy; never ship the key to the browser.*
**Accept:** setting `VITE_BEV_API_KEY` flips the header badge to LIVE.

## 2 · Remove Lightning from the AAL engine entirely

Lightning is an attritional fire-ignition peril, not a cat-modelled AAL driver. Remove from `MARKET_PROFILES.AU.perils` + `perilLabels` (`marketProfiles.ts`); delete `lightningMDR` (`vuln-functions-ext.ts`), `LIGHTNING_LEVEL_TO_MDR` (`vuln-tables-ext.ts`), the `Lightning` branches in `aal-ext.ts`, the lightning stub curve + `KEY_THRESHOLD.Lightning` (`cera-client-ext.ts`), and `Lightning` from `EXT_PERILS` / terms defaults / wording rows. (This also removes the L1–L5 vs Low/Moderate/Severe/Extreme naming bug.)
**Accept:** AU profile shows 4 perils; no lightning reference compiles.

## 3 · Defensive Lite-endpoint parsing (`cera-client-ext.ts`)

The live lite response shape is **unverified against the real API**. Make the parser tolerate alternates (`score|relative_score`, `key_threshold|keyThreshold`, `key_return_period|return_period`); derive `band` from `score` when absent; on parse failure fall back to the stub **and** surface a visible warning. In live mode show a one-line note: *"Lite response schema unverified — confirm on first live call."*
**Accept:** malformed live response degrades gracefully, never crashes triage.

## 4 · Sample bordereau (`public/`)

Covered by §0 — `public/sample-bdx.xlsx` = the synthetic file.

## 5 · Confidence only from used data

**5a — First-floor elevation (flood):** effective depth = `max(0, depth − firstFloorElevationM)` before `floodMDR`. Plumb `firstFloorElevationM` through `AALInputsExt` (`aal-ext.ts`) and `buildInputs` (`aalEngine.ts`).
**5b — Year-built factor:** add to `vuln-tables-ext.ts`: pre-1980 ×1.25 · 1980–2000 ×1.10 · 2000–2010 ×1.00 · post-2010 ×0.90 (MDR capped at 1). Apply to TropicalCyclone, USTornado, Earthquake in `mdrFor`. Flag PoC-grade.
Update the AssessmentPanel "gaps" copy — these two fields now genuinely move the number, so remove the "not used" admissions.
**Accept (tests):** raising elevation lowers flood AAL; year built 1975 vs 2015 changes wind/EQ AAL; both fields still raise completeness (now legitimately).

## 6 · Price Business Interruption — "Section 1 / Section 2" framing

Mirror the ISR wording the MGAs live in:
- **Section 1 — Material Damage:** existing engine (MDR × damageable TIV A+B+C).
- **Section 2 — BI:** same convolution per peril with `BI loss at node = BI_TIV × min(1, MDR_building × biFactor)`, scaled by `min(1, indemnityMonths/12)`. `biFactor` default 1.0, editable in the Assessment panel; add `indemnityMonths` (default 12) to `Submission` (`inputModel.ts`) and map from the BDX "Indemnity Period (Months)" column.
- Display Section 1, Section 2 and Total as separate lines (Assessment + Price panels). Total AAL = S1 + S2. **Property terms (deductibles/sublimits/layer tower) apply to Section 1 only**; Section 2 is added at the pricing step as its own line. Wildfire Bernoulli gets the same BI treatment at the single severe node.
- One-line explanation in the UI: *"If the building is 40% damaged we assume ~40% of the declared BI value is lost while it's repaired (factor adjustable, capped by indemnity period)."*
**Accept (tests):** S1+S2 = total; biFactor 0 reproduces old numbers; indemnity 6 months halves S2.

## 7 · Wire the marginal aggregate check into single-risk triage

Add app-level **"Load in-force book"** (BDX upload, shared state, persists across modes — reuse `parseBDXFile` + `mapBdxRow` + `assessLocation`). On every single-risk triage *and* post-terms re-evaluation, run `marginalCheck()` (`portfolio.ts`) for the submission's zone; pass real `aggregateBreach` into `triageLite` / `triageFull` (replace the hardcoded `false` in `App.tsx`). Display: zone TIV before/after, limit, marginal PML add.
**Accept:** with a book loaded, a new risk in a peak zone triggers refer/decline naming the zone; without a book, triage notes "no in-force book loaded — aggregate unchecked".

## 8 · NEW — "Underwriting Authority" section (appetite rules)

New `domain/authority.ts` + `ui/AuthorityPanel.tsx`. The binder reality: a capacity provider (e.g. **Hudson**, for a US coverholder like Amynta) grants authority within written guidelines; outside = prior-submit referral. Rules are explicit, editable objects **that the triage runs on**, and every referral reason cites the rule that fired.

- **Roles:** toggle Underwriter (read-only) vs Manager / Capacity Provider (edit). Rules stamped "set by + date". JSON export/import.
- **Single referral tier:** one editable `referTo` label (default "Capacity provider").
- **Stage-1 rules (eligibility + lite):** max TIV per location; permitted occupancies; permitted constructions; excluded states / Cresta zones; **per-peril hazard frequency rules at native thresholds** (e.g. "refer if CAT3 more frequent than 1-in-50", "decline if 1-in-100 flood depth > 1 m", "refer if P(severe wildfire) > 1-in-40"); max aggregate zone share % (feeds §7).
- **Stage-2 rules (post-assessment):** max total AAL rate to auto-bind + decline ceiling (**migrate the hardcoded `DEFAULT_THRESHOLDS` from `triage.ts` into the authority object**); minimum confidence; minimum terms floors (min wind ded %, min EQ ded %, mandatory flood sublimit — TermsPanel enforces as floors); rate floor (charged ≥ X% of technical).
- Each rule: `action: refer | decline`. Ship the **simple version** — flat rule list, no TIV-conditional construction rules yet (schema may allow later).
**Accept:** editing a rule changes the triage outcome; every refer/decline reason names its rule; no thresholds remain hardcoded in `triage.ts`.

## 9 · NEW — Referral report generator

When a decision is **refer** (or decline), show **"Generate referral report"**. Opens a branded, print-friendly view (new window + `window.print()` → PDF; BEV navy/pink, CERA® marked) containing:

1. Risk summary — insured, address (+ lat/lng), occupancy, construction, year built, TIV split A/B/C/D, indemnity period.
2. Authority outcome — decision + **the specific rule(s) that fired**, referred to *[referTo label]*.
3. Hazard profile — lite scores + key return periods per peril.
4. Loss view — per-peril AAL, Section 1 / Section 2 / total, confidence + reliability per peril.
5. Proposed terms — deductibles, sublimits, layer tower (attach/exhaust/RoL).
6. Price — technical premium build-up, rate adequacy vs charged.
7. Data & caveats — gaps/assumptions, PoC conversions, stub/live data source.
8. Footer — request line ("approve / decline / amend terms"), date, version.

File: `ui/ReferralReport.tsx`. This replaces the MGA hand-writing a contextual email to their capacity provider.
**Accept:** refer decision → one click → complete printable report with the firing rules named.

## 10 · Naming

Capacity-provider example is **Hudson** (not Howden) wherever an example label is used.

---

*Keep `_sanity.ts` (14) and `_sanity-ext.ts` (10) green; extend `_sanity-ext.ts` for §5 and §6. All new assumptions (year-built factors, biFactor, hazard-rule defaults) live in tables, flagged PoC-grade, centralised for the science team to recalibrate.*
