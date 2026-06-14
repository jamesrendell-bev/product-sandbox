# BirdsEyeView Product Sandbox — guide for the Data Science team

This is the single place to find where to plug real BirdsEyeView data into the
product sandbox. The sandbox ships with reference curves and deterministic stubs
so every app runs anywhere. Each integration point below is isolated, so you can
swap in real data one app at a time without touching anything else.

The sandbox is four products behind one login:

| Product | Folder | What you connect |
|---|---|---|
| Property NatCat Pricing | `mga-engine-app/` | CERA® hazard API + vulnerability curves |
| Contingency Weather | `contingency-hub/` | CERA® hazard API + weather thresholds |
| EDM & CEDE Converter | `cera-ai-converter/` | Classification taxonomy + code tables |
| Exposure Analysis | (in build) | to follow |

Everything is static and deploys to GitLab Pages. No server is required.

---

## 1. Property NatCat Pricing

Full detail is in `mga-engine-app/INTEGRATION.md`. In short:

### Connect the CERA® (NatCat) API
No code change. Set two environment variables and rebuild:

```bash
# mga-engine-app/.env  (copy from .env.example)
VITE_BEV_API_KEY=your-cera-key
VITE_BEV_API_BASE_URL=https://api.birdseyeview.ai
```

With a key present the app calls the live endpoint
`POST {base}/v1/in-depth/daily`; with no key it uses the deterministic stub. The
in-app "Data source" badge shows "Live CERA® feed" when connected, so you can
confirm at a glance. All hazard goes through `src/engine/cera-client.ts`. If the
live response shape changes, the only edit is the response parser in that file.

### Insert or replace vulnerability curves
All vulnerability lives in three files. The engine reads only from these, so
editing them changes every AAL number in the app.

- `src/engine/vuln-tables.ts` — the curves. Flood depth-damage by region and
  occupancy (`FLOOD_MDR`), wildfire and cyclone sigmoid parameters, earthquake
  fragility. Keep the same keys and node counts, replace the numbers.
- `src/engine/vuln-tables-ext.ts` — hazard-to-model unit conversions
  (Saffir-Simpson to m/s, EF band to m/s, MMI to PGA). Flagged values to
  recalibrate sit here.
- `src/engine/vuln-functions.ts` — the maths that maps an intensity to an MDR.
  Only touch this if a curve shape changes.

After editing, run `npm run trace` for the embedded audit and `npm test`.

---

## 2. Contingency Weather

- **CERA® hazard:** same two env vars as above (`VITE_BEV_API_KEY`,
  `VITE_BEV_API_BASE_URL`). The catastrophe triage view goes live when the key is
  set; otherwise it uses region-aware stubs in `server/routes/cera.ts`.
- **Weather thresholds and climatology:** the cancellation thresholds (rainfall,
  wind, gust, heat, cold, snow) and the per-peril statistical fits live in
  `src/lib/climatology.ts` and `src/lib/weatherPerils.ts`. Underwriters can also
  edit thresholds in-app under "Referral thresholds".

---

## 3. EDM & CEDE Converter

The converter now runs entirely in the browser, so it needs no backend and
deploys on GitLab Pages with the rest. The classification is deterministic
against the CERA taxonomy. Three things you may maintain:

- **Classification rules:** `shared/rules-classifier.mjs` — the keyword rules that
  map broker occupancy and construction narrative to the CERA taxonomy (eight
  occupancy keys, seven construction keys). Add or refine keywords here.
- **Vendor code tables:** `shared/rms-codes.mjs` (Moody's RMS) and
  `shared/cede-codes.mjs` (Verisk CEDE) — the crosswalk from the CERA taxonomy to
  each vendor's occupancy, construction and geocode codes. Update these to match
  the exact code dictionaries your Risk Modeler or Touchstone instance expects.
- **Methodology defaults:** TIV split ratios, peril coverage by state and
  secondary-modifier defaults are documented in the generated ReadMe and
  Methodology sheets, and set in `shared/canonical-builder.mjs`.

Optional AI classification: the deterministic rules cover the schedule on their
own. If you later want Claude to classify ambiguous rows, stand up a small
classify endpoint (the original `netlify/functions/classify.mjs` shows the
Claude tool-use call) and point the browser at it; the rules engine stays the
default and fallback.

---

## 4. Running and testing locally

Each app is a standard build.

```bash
# NatCat and Contingency (Vite)
cd mga-engine-app && npm install && npm run dev
cd contingency-hub && npm install && npm run dev

# Converter (static — any static server works)
cd cera-ai-converter && python3 -m http.server 8894
```

Run the NatCat test suite with `npm test` after changing curves.

---

## 5. Getting real data in front of clients

For client testing, deploy each app with its environment variables set. The
sandbox shell embeds each product by URL, so once a product is live with a key
and your calibrated data, every client opening the sandbox sees real CERA®
output with no further change to the shell.
