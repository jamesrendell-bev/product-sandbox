# CERA® AI — EDM & CEDE Converter

Drop a broker schedule (.xlsx). Get back a Moody's RMS EDM file **and** a Verisk CEDE file generated from the same canonical exposure object, with every estimated field flagged for underwriter review.

Built for BirdsEyeView as a CERA® AI product demo.

---

## What it does

1. **Parse** any reasonably-shaped broker schedule. Auto-detects the data sheet and fuzzy-maps columns by header keyword (Location, Address, Occupancy, Construction, Year Built, Stories, Sprinklers, Building/M&E/BI values…).
2. **Classify** every location's occupancy and construction with Claude, constrained to a fixed CERA taxonomy via tool-use schema enforcement. Rows where the broker narrative is clear are matched by deterministic rule first — Claude is only invoked on ambiguous rows (saves cost and latency).
3. **Gap-fill** TIV (Building / Contents / BI / Other) by class-based split ratio when partially supplied, secondary modifiers (sprinkler, roof, soft-storey, basement, ext-wall) by class default, peril coverage by US state.
4. **Workbench** — preview every row with green/pink/yellow/grey source-flag colouring, edit any broker-supplied cell inline, re-classify a single row or all rows with Claude.
5. **Export** RMS EDM and Verisk CEDE side-by-side. Same canonical object → two serialisations. EDM uses RMS code dictionaries (322, 343, 121…) and L0–L7 geocode levels; CEDE uses AIR codes (342, 354, 104…) and 1–5 geocode levels, plus AIR-specific peril codes (IF, SS, WT).

## Local development

```bash
# 1. Install
npm install

# 2. Set your Anthropic key
cp .env.example .env
# edit .env and paste your sk-ant-… key

# 3. Run the dev server (frontend + Netlify functions)
npm run dev
# opens http://localhost:8765
```

If no `ANTHROPIC_API_KEY` is set, the classifier falls back to deterministic rules end-to-end — the demo still works, but the "AI" label is honest only with the key.

## Deploy to Netlify

```bash
# First time
npx netlify init        # connect / create a Netlify site
npx netlify env:set ANTHROPIC_API_KEY sk-ant-...

# Subsequent deploys
git push                # if connected via Git
# or
npx netlify deploy --prod
```

The site is fully static (`publish = "."`) with four serverless functions:

| Route | Function | Purpose |
| --- | --- | --- |
| `POST /api/parse-input` | `netlify/functions/parse-input.mjs` | Reads the uploaded xlsx, returns canonical raw rows |
| `POST /api/classify` | `netlify/functions/classify.mjs` | Hybrid deterministic + Claude classification |
| `POST /api/export-edm` | `netlify/functions/export-edm.mjs` | Generates the RMS EDM xlsx |
| `POST /api/export-cede` | `netlify/functions/export-cede.mjs` | Generates the Verisk CEDE xlsx |

## Architecture

```
broker schedule.xlsx
        │
        ▼
   parse-input ───►  raw rows  ───►  classify (Claude) ───►  canonical builder (JS)
                                                                      │
                                          ┌───────────────────────────┴─────┐
                                          ▼                                 ▼
                                  export-edm (RMS)                    export-cede (AIR)
                                          │                                 │
                                          ▼                                 ▼
                              CERA-RMS-EDM-Export.xlsx         CERA-Verisk-CEDE-Export.xlsx
```

Shared canonical logic lives in `shared/` and is imported both by the Netlify functions and the browser. One source of truth, two serialisers — the same design as the Python reference.

## Files

- `index.html`, `style.css`, `app.js` — three-screen frontend (upload, workbench, export)
- `lib/upload.js`, `lib/workbench.js`, `lib/exporters.js` — frontend modules
- `shared/canonical.mjs` — vocabulary, ratios, perils, modifiers
- `shared/canonical-builder.mjs` — turns raw row + classification into canonical location
- `shared/rules-classifier.mjs` — deterministic occupancy / construction matcher
- `shared/claude.mjs` — Anthropic SDK wrapper with constrained tool-use
- `shared/{rms-codes,cede-codes}.mjs` — vendor code dictionaries
- `shared/palette.mjs`, `shared/exporter-common.mjs` — ExcelJS styling helpers
- `sample/sample-broker-input.xlsx` — American Sugar Refining schedule for demo
