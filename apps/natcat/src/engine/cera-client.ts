// src/engine/cera-client.ts
//
// Minimal client for the BirdsEyeView CERA hazard API.
// In STUB mode (when no apiKey is supplied) returns canned curves so the front-end
// can be developed and demoed before the API key is provisioned.
//
// Real endpoint:  POST {baseUrl}/v1/in-depth/daily
//   Headers: X-API-Key, Content-Type: application/json
//   Body: { perils: string[], events: [{ location: string, ... }] }

import type { PerilId, RawHazardCurve } from "./aal";

export interface FetchHazardArgs {
  location: string;
  perils: PerilId[];
  apiKey: string;
  baseUrl: string;
}

export interface HazardBundle {
  resolvedLat: number;
  resolvedLng: number;
  results: RawHazardCurve[];
}

export async function fetchHazardCurves(args: FetchHazardArgs): Promise<HazardBundle> {
  if (!args.apiKey) return stubHazardBundle(args.location, args.perils);

  const res = await fetch(`${args.baseUrl}/v1/in-depth/daily`, {
    method: "POST",
    headers: {
      "X-API-Key": args.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      perils: args.perils,
      events: [{ index: 0, location: args.location }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CERA API error ${res.status}: ${text}`);
  }
  const data = await res.json() as {
    results: { index: number; peril: string; latitude: number; longitude: number;
               threshold: (number|string)[]; probability: number[]; return_period: number[]; unit: string }[];
    failed_items: { index: number; stage: string; error: string }[];
  };
  if (data.failed_items?.length) {
    throw new Error(`CERA API: ${data.failed_items[0].stage}: ${data.failed_items[0].error}`);
  }
  return {
    resolvedLat: data.results[0]?.latitude ?? 0,
    resolvedLng: data.results[0]?.longitude ?? 0,
    results: data.results.map((r) => ({
      peril: r.peril as PerilId,
      threshold: r.threshold,
      return_period: r.return_period,
      unit: r.unit,
    })),
  };
}

// ─── Stub data ───────────────────────────────────────────────────────────────
// Hand-crafted hazard curves shaped to mimic representative CERA outputs for an
// Australian east-coast location (e.g. coastal Queensland — TC-exposed, modest
// flood, low-moderate wildfire, low EQ). Replaced by live API once key is set.

function stubHazardBundle(location: string, perils: PerilId[]): HazardBundle {
  const lower = location.toLowerCase();
  // Very rough geocoding for stub mode — enough to make the demo "feel" alive.
  const guesses: Record<string, [number, number]> = {
    sydney:    [-33.8688, 151.2093],
    melbourne: [-37.8136, 144.9631],
    brisbane:  [-27.4698, 153.0251],
    cairns:    [-16.9203, 145.7710],
    perth:     [-31.9523, 115.8613],
    auckland:  [-36.8485, 174.7633],
    london:    [51.5074, -0.1278],
  };
  let lat = -27.4698, lng = 153.0251;
  for (const k of Object.keys(guesses)) {
    if (lower.includes(k)) { [lat, lng] = guesses[k]; break; }
  }

  const results: RawHazardCurve[] = perils.map((p) => stubFor(p));
  return { resolvedLat: lat, resolvedLng: lng, results };
}

function stubFor(peril: PerilId): RawHazardCurve {
  // Intensity nodes match common CERA threshold tables; return periods are
  // illustrative — annual exceedance probabilities decreasing with severity.
  switch (peril) {
    case "Flood":
      return {
        peril,
        threshold:     [0,    0.5,   1.0,   1.5,  2.0,  3.0],
        return_period: [1.05, 5,     20,    50,   100,  500],
        unit: "m",
      };
    case "TropicalCyclone":
      return {
        peril,
        threshold:     ["CAT0", "CAT1", "CAT2", "CAT3", "CAT4", "CAT5"],
        return_period: [2,      8,      25,     50,     150,    500],
        unit: "Saffir-Simpson",
      };
    case "Wildfire":
      return {
        peril,
        threshold:     ["Low", "Moderate", "Severe", "Extreme"],
        return_period: [3,     15,         60,       250],
        unit: "Severity",
      };
    case "Earthquake":
      return {
        peril,
        threshold:     ["MMI3", "MMI4", "MMI5", "MMI6", "MMI7", "MMI8"],
        return_period: [10,     50,     200,    750,    2500,   8000],
        unit: "MMI",
      };
  }
}
