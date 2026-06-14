# BirdsEyeView · Contingency Weather Risk Triage

A triage workbench for **event & conference cancellation** underwriters. The hero is a
single-venue **weather** risk triage against the five perils that cancel outdoor events, with an
indoor/outdoor methodology and researched cancellation thresholds. Clean Vite + React + TS,
BirdsEyeView house style. **Guidance, not a pricing tool.**

## Modules

| Module | What it does | Data |
|---|---|---|
| **Weather risk triage** (hero) | One venue + dates + indoor/outdoor. Probability each of rainfall / wind speed / wind gust / temperature / snowfall breaches its cancellation threshold on the event dates → Accept / Refer / Decline. Dark map with a 5-segment peril ring + station provenance. | Meteostat climatology |
| **Further event intel** | Enter a location → shows all live contingency risks (conflicts, strikes, terror tiers, disease, weather patterns) and flags those affecting that country. | Curated `liveRisks` (ported from the portfolio stress-test app) |
| **Weather lookback** | Day-by-day recorded weather over the event window ± a buffer, flagged over/under threshold. | Meteostat ground stations |
| **Catastrophe exposure** (secondary) | Multi-location CERA® cat triage (cyclone / flood / quake / wildfire / tornado). | CERA® API (stub until a key is set) |
| **Guidance** | Methodology + how the thresholds were derived from event-management & safety plans, with sources. | — |
| **Referral thresholds** | Editable weather cancellation thresholds + referral/decline probability bands. Saved to the browser. | — |

## Methodology

- **Indoor** events assume wind, rain, heat and cold do not cancel — only heavy **snow** (access /
  roof load, ≥ 150 mm) can refer. **Outdoor** events check all five perils.
- For each peril we take the nearest station's history and, for every past year, the worst value
  across the event window; the chance of breaching the cancellation threshold is a blend of the
  empirical share of years and a parametric tail fit (Gamma rain/snow, Gumbel wind, Normal temp).
- A peril is **amber** at/above the referral probability (default 20%) and **red** at/above the
  decline probability (default 50%). The venue's outcome is the worst peril.

### Researched cancellation thresholds (defaults, editable)

| Peril | Field | Default | Basis |
|---|---|---|---|
| Rainfall | `prcp` | ≥ 25 mm/day | waterlogging / abandonment; rain-insurance triggers 10–25 mm |
| Wind speed | `wspd` | ≥ 40 km/h | stage/tent "wind hold" ~25 mph sustained |
| Wind gust | `wpgt` | ≥ 60 km/h | evacuation / structure-failure 35–50 mph gusts |
| Temperature (heat) | `tmax` | ≥ 32 °C | WBGT 28 °C delay / 32–33 °C cancel |
| Temperature (cold) | `tmin` | ≤ −5 °C | frost / extreme cold |
| Snowfall | `snow` | ≥ 30 mm out / ≥ 150 mm in | footing/access; indoor = transport / roof load |

Caveats: `wspd` is the daily **average** (gusts run higher — that's the gust test); `snow` is snow
**depth**, used as a proxy for snowy conditions.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5180
```

Single dev server: Vite serves the app **and** mounts `/api/*` in-process (`server/`) — no Netlify
CLI. Set `VITE_BEV_API_KEY` to take the Catastrophe-exposure view live; otherwise it uses stubs.

The Claude web-search modules (organiser due-diligence, location intel) are **not in the nav** — the
code is kept under `server/routes/organiser.ts` / `locationIntel.ts` and can be re-enabled, but
web search is token-heavy against a 10k input-tokens/min account limit.
