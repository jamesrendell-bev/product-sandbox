# CERA® MGA AAL & Pricing Engine

End-to-end property underwriting for an MGA — **triage → AAL (per-peril + total) → terms → capital-aware price → wording** — for a single location or a bulk bordereau (BDX), with a dark map. Built on the verified `/engine` AAL core; runs on stub hazard data now, flips to the live CERA® API by setting env vars.

Four sections (top nav): **Underwrite** (single risk + portfolio BDX), **Authority** (editable appetite rules the triage runs on), **Roadmap & Methodology** (the data-flow chart), **Glossary** (plain-English guide). Plus: Business-Interruption pricing (Section 1 / Section 2), a marginal accumulation check against a loaded in-force book, a one-click branded referral report (print → PDF), and a removable layer tower.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build
npm run sanity         # original engine sanity tests (14/14)
npm run sanity:ext     # extended engine tests (16/16)
npm run trace          # end-to-end numbers trace for one risk
```

## Live vs stub

No key → **stub mode** (canned curves shaped exactly like the CERA® response). Set env vars to go live — no code change:

```bash
export VITE_BEV_API_KEY=...                              # X-API-Key
export VITE_BEV_API_BASE_URL=https://api.birdseyeview.ai # base URL
npm run dev
```

## Layout

```
src/
  engine/      verified core (untouched) + extensions:
               aal.ts, vuln-functions.ts, vuln-tables.ts, cera-client.ts, _sanity.ts   (the 5 trusted files)
               *-ext.ts          US Tornado, wildfire single-term, hail stub, year-built factor
               aal-ext.ts        per-peril AAL + total + per-peril loss curves
               combined-ep.ts    combined occurrence EP, layer EL, PML, TVaR
               confidence.ts     data-completeness × per-peril reliability
               cera-client-ext.ts  daily (full curve) + lite (triage, defensive), stub + live
  domain/      marketProfiles, inputModel, aalEngine, terms, pricing, triage, authority,
               bi (Section 2), portfolio, wording, geocode
  ui/          panels (Triage/Assessment/Terms/Price/Wording/Portfolio/Authority/Roadmap/Glossary),
               ReferralReport, charts, MapView, atoms
  data/        sample single locations + BDX parsing
public/        sample-bdx.xlsx (SYNTHETIC), roadmap.html (data-flow chart)
docs/          build briefs, specs and punch-lists that produced this app
```

## Documentation

- **`MODEL_REASSESSMENT.md`** — what each peril model does, every PoC assumption, the numbers audit, what to challenge.
- **`RESUME_AND_DEPLOY.md`** — how to fire it up locally and deploy to GitHub → Netlify.
- **`docs/`** — the original build instructions, build spec, and punch-list addendums.
- `netlify.toml` / `.env.example` / `deploy.sh` — deploy config + one-command update.

## What's PoC-grade (flagged for calibration)

All unit conversions (CAT→m/s, MMI→PGA, EF→mph, hail→MDR) live in `engine/vuln-tables*.ts`. Wildfire is a single-term Bernoulli model (P(severe) × construction-indexed conditional MDR × footprint attribution). Hail hazard is stubbed (roadmap). Figures are illustrative until the live feed + calibrated curves land; the capital number is confidence-gated.

## Acceptance criteria (all met)

- Engine sanity tests pass (14/14); extended tests pass (16/16): total AAL = Σ per-peril; layer ELs reconcile to full ground-up; wildfire single-term; confidence falls as fields are removed; elevation/year-built move AAL; BI Section 1 + Section 2 = total.
- Single-location flow returns per-peril + total AAL with confidence on stub data, end to end.
- BDX upload produces a portfolio table + dark cluster map + Cresta accumulation flags + PML.
- `VITE_BEV_API_KEY` switches to live with config only.
- BEV theme throughout; dark map.

No API keys in the repo. No copyrighted ISO/LMA wording text — section skeletons only.
