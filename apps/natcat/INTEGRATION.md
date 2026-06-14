# Connecting real data — guide for the data science team

This app (Property NatCat Pricing) ships with reference curves and a deterministic
stub of the CERA® hazard feed so it runs anywhere. To put real BirdsEyeView data
behind it, there are two jobs: connect the CERA® API, and replace the vulnerability
curves. Both are isolated so you can change one without touching the rest of the app.

When the live feed is connected the in-app "Data source" label switches from
"CERA® reference data" to "Live CERA® feed", so you can confirm at a glance.

---

## 1. Connect the CERA® (NatCat) API

The whole hazard layer goes through one file:

- **`src/engine/cera-client.ts`** — `fetchHazardCurves()`
- **`src/engine/cera-client-ext.ts`** — the extended Lite triage client

It already speaks the real endpoint:

```
POST {BASE_URL}/v1/in-depth/daily
Headers: X-API-Key: <key>, Content-Type: application/json
Body:    { perils: [...], events: [{ index, location }] }
```

You do not edit code to go live. Set two environment variables and rebuild:

```bash
# .env  (copy from .env.example)
VITE_BEV_API_KEY=your-cera-key
VITE_BEV_API_BASE_URL=https://api.birdseyeview.ai
```

With a key present, `fetchHazardCurves()` calls the live endpoint. With no key it
falls back to the deterministic stub. That is the only switch.

If the live response shape ever changes, the only place to adjust is the response
parser inside `cera-client.ts` (the `data.results` mapping). Nothing else in the app
reads the API directly.

---

## 2. Insert or replace vulnerability curves

All vulnerability lives in three files. The engine reads from these tables only, so
editing them changes every AAL number in the app.

- **`src/engine/vuln-tables.ts`** — the curves themselves (the port of the
  `VULN_TABLES` sheet from `BEV_AAL_Calculator_v2.xlsx`).
- **`src/engine/vuln-tables-ext.ts`** — hazard-to-vulnerability unit conversions
  (Saffir-Simpson to m/s, EF band to m/s, MMI to PGA, wildfire band to kW/m).
  Flagged values to recalibrate sit here.
- **`src/engine/vuln-functions.ts`** — the maths that maps an intensity to an MDR
  using the tables above. Only touch this if a curve **shape** changes.

### What each peril expects

- **Flood** — depth-damage table. Depth nodes in `FLOOD_DEPTHS_M`; MDR rows in
  `FLOOD_MDR`, keyed `"${region}_${occupancy}"` (for example
  `"North America_Commercial"`). To add a region, add its three occupancy rows and
  list the region in `FLOOD_REGIONS`. Each row is an MDR (0 to 1) per depth node.
- **Wildfire, Tropical cyclone** — Emanuel sigmoid parameters
  (`WILDFIRE_PARAMS`, the TC equivalents): an intensity threshold and a half-loss
  intensity per construction class. Replace the numbers with your calibrated values.
- **Earthquake** — GEM fragility parameters. Same idea: swap the parameters.

### How to swap in your own curves

1. Replace the numbers in `vuln-tables.ts` with your calibrated values, keeping the
   same keys and node counts.
2. If you change the conversion from hazard units to model units, edit
   `vuln-tables-ext.ts` (it is centralised there on purpose).
3. Run `npm run trace` for the embedded audit, then `npm test`. The suite checks the
   curves stay monotonic and the AAL identity holds.

Keep the citations comment block at the top of `vuln-tables.ts` current so the source
of every curve is traceable.

---

## 3. Putting real data into the deployed sandbox

For client testing, deploy this app with the two env vars set (above). The sandbox
shell embeds it by URL, so once it is live with a key, every client opening the
sandbox sees real CERA® output and your calibrated curves, with no further change to
the shell.
