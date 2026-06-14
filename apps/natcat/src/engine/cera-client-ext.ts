// src/engine/cera-client-ext.ts
//
// Extended CERA® API client for the MGA build.
//   • STUB mode when no apiKey → canned curves shaped exactly like the live
//     response (threshold[] / probability[] / return_period[] / unit).
//   • LIVE mode when apiKey set → POST {baseUrl}/v1/in-depth/daily (full curve),
//     POST /v1/in-depth/lite (triage). One env flip, no code change.
//
// Peril name map (CERA®): Flood, FloodLivePlus, TropicalCyclone, Earthquake,
// USTornado, Wildfire. Hail/SCS not yet on the API (feature-flagged).

import type { ExtPerilId, RawHazardCurveExt } from "./aal-ext";

export interface FetchArgs {
  location?: string;
  latitude?: number;
  longitude?: number;
  perils: ExtPerilId[];
  apiKey: string;
  baseUrl: string;
}

export interface FailedItem {
  index: number;
  stage: string; // geocoding | model_execution
  error: string;
}

export interface HazardBundleExt {
  resolvedLat: number;
  resolvedLng: number;
  results: RawHazardCurveExt[];
  failed: FailedItem[];
}

export function isLive(apiKey: string): boolean {
  return !!apiKey;
}

// ─── DAILY (full curve) ──────────────────────────────────────────────────────
export async function fetchHazardCurvesExt(args: FetchArgs): Promise<HazardBundleExt> {
  if (!args.apiKey) return stubBundle(args);

  const events = [
    args.latitude != null && args.longitude != null
      ? { index: 0, latitude: args.latitude, longitude: args.longitude }
      : { index: 0, location: args.location ?? "" },
  ];
  const res = await fetch(`${args.baseUrl}/v1/in-depth/daily`, {
    method: "POST",
    headers: { "X-API-Key": args.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ perils: args.perils, events }),
  });
  if (!res.ok) throw new Error(`CERA® API error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    results: {
      index: number;
      peril: string;
      latitude: number;
      longitude: number;
      threshold: (number | string)[];
      probability: number[];
      return_period: number[];
      unit: string;
    }[];
    failed_items?: FailedItem[];
  };
  return {
    resolvedLat: data.results[0]?.latitude ?? 0,
    resolvedLng: data.results[0]?.longitude ?? 0,
    results: data.results.map((r) => ({
      peril: r.peril as ExtPerilId,
      threshold: r.threshold,
      probability: r.probability,
      return_period: r.return_period,
      unit: r.unit,
    })),
    failed: data.failed_items ?? [],
  };
}

// ─── LITE (triage) ───────────────────────────────────────────────────────────
export interface TriageScore {
  peril: ExtPerilId;
  score: number; // 1..5 globally-relative
  band: string;
  keyThreshold: string; // e.g. "CAT3", "MMI5", "1m", "EF2", "Severe"
  keyReturnPeriod: number; // years at that threshold
}
export interface TriageLite {
  resolvedLat: number;
  resolvedLng: number;
  scores: TriageScore[];
  failed: FailedItem[];
  /** Surfaced in the UI — schema-unverified note (live) or parse-fallback warning. */
  warning?: string;
}

// Tolerant field pickers — the live Lite response shape is unverified.
function altNum(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && isFinite(Number(v))) return Number(v);
  }
  return undefined;
}
function altStr(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

// Fixed severity threshold the Lite endpoint reports a return period at, per peril.
// These align with the Underwriting Authority hazard-frequency rules.
const KEY_THRESHOLD: Partial<Record<ExtPerilId, string>> = {
  Earthquake: "MMI6",
  USTornado: "EF2",
  TropicalCyclone: "CAT3",
  Wildfire: "Severe",
  Flood: "1m",
  FloodLivePlus: "1m",
};

export async function fetchTriageLite(args: FetchArgs): Promise<TriageLite> {
  if (!args.apiKey) return stubTriage(args);

  // The live Lite response shape is UNVERIFIED against the real API. Parse
  // defensively, tolerate alternate keys, and never crash triage: on any
  // failure fall back to the stub with a visible warning.
  try {
    const events = [
      args.latitude != null && args.longitude != null
        ? { index: 0, latitude: args.latitude, longitude: args.longitude }
        : { index: 0, location: args.location ?? "" },
    ];
    const res = await fetch(`${args.baseUrl}/v1/in-depth/lite`, {
      method: "POST",
      headers: { "X-API-Key": args.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ perils: args.perils, events }),
    });
    if (!res.ok) throw new Error(`Lite ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      results?: Record<string, unknown>[];
      failed_items?: FailedItem[];
    };
    const results = Array.isArray(data?.results) ? data.results : [];
    if (!results.length) throw new Error("no results in Lite response");

    const scores: TriageScore[] = results.map((r) => {
      const score = altNum(r, ["score", "relative_score", "relativeScore"]) ?? 0;
      return {
        peril: String(r.peril) as ExtPerilId,
        score,
        band: altStr(r, ["band"]) ?? scoreBand(Math.round(score)), // derive band when absent
        keyThreshold: altStr(r, ["key_threshold", "keyThreshold"]) ?? "",
        keyReturnPeriod:
          altNum(r, ["key_return_period", "keyReturnPeriod", "return_period", "returnPeriod"]) ?? 0,
      };
    });

    return {
      resolvedLat: altNum(results[0], ["latitude", "lat"]) ?? 0,
      resolvedLng: altNum(results[0], ["longitude", "lng", "lon"]) ?? 0,
      scores,
      failed: Array.isArray(data.failed_items) ? data.failed_items : [],
      warning: "Lite response schema unverified — confirm on first live call.",
    };
  } catch (err) {
    const stub = stubTriage(args);
    return {
      ...stub,
      warning: `Live Lite response could not be parsed (${String(err)}); showing stub triage — verify the API schema.`,
    };
  }
}

// ─── Stub machinery ──────────────────────────────────────────────────────────
// Deterministic per-location severity factor so different addresses feel alive.
function locFactor(args: FetchArgs): number {
  const seed = `${args.location ?? ""}${args.latitude ?? ""}${args.longitude ?? ""}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 0.65 + (h % 1000) / 1000 * 0.7; // 0.65 .. 1.35
}

const GUESS: Record<string, [number, number]> = {
  sydney: [-33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
  brisbane: [-27.4698, 153.0251],
  cairns: [-16.9203, 145.771],
  perth: [-31.9523, 115.8613],
  miami: [25.7617, -80.1918],
  houston: [29.7604, -95.3698],
  "new orleans": [29.9511, -90.0715],
  charleston: [32.7765, -79.9311],
  sacramento: [38.5816, -121.4944],
  "oklahoma city": [35.4676, -97.5164],
  tampa: [27.9506, -82.4572],
};
function guessLatLng(args: FetchArgs): [number, number] {
  if (args.latitude != null && args.longitude != null) return [args.latitude, args.longitude];
  const lower = (args.location ?? "").toLowerCase();
  for (const k of Object.keys(GUESS)) if (lower.includes(k)) return GUESS[k];
  return [-27.4698, 153.0251]; // Brisbane default
}

function withProb(threshold: (number | string)[], return_period: number[], unit: string, peril: ExtPerilId): RawHazardCurveExt {
  return {
    peril,
    threshold,
    return_period,
    probability: return_period.map((rp) => 1 / rp),
    unit,
  };
}

export function stubCurveFor(peril: ExtPerilId, f: number): RawHazardCurveExt {
  const sc = (rps: number[]) => rps.map((rp) => Math.max(1.02, rp / f)); // higher f → shorter RP
  switch (peril) {
    case "Flood":
      return withProb([0, 0.5, 1.0, 1.5, 2.0, 3.0].map((d) => +(d * f).toFixed(2)), [1.05, 5, 20, 50, 100, 500], "m", peril);
    case "FloodLivePlus":
      return withProb([0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0].map((d) => +(d * f).toFixed(2)), [1.05, 4, 15, 40, 90, 250, 600], "m", peril);
    case "TropicalCyclone":
      return withProb(["CAT0", "CAT1", "CAT2", "CAT3", "CAT4", "CAT5"], sc([2, 8, 25, 50, 150, 500]), "Saffir-Simpson", peril);
    case "Earthquake":
      return withProb(["MMI3", "MMI4", "MMI5", "MMI6", "MMI7", "MMI8"], sc([10, 50, 200, 750, 2500, 8000]), "MMI", peril);
    case "USTornado":
      return withProb(["EF0", "EF1", "EF2", "EF3", "EF4"], sc([5, 20, 80, 300, 1200]), "Enhanced Fujita", peril);
    case "Wildfire":
      // Single occurrence threshold — Severe.
      return withProb(["Severe"], sc([60]), "Severe", peril);
    case "Hail":
      // Hazard not yet on the API — empty curve → engine flags unsupported.
      return { peril, threshold: [], return_period: [], probability: [], unit: "cm" };
  }
}

export function stubBundle(args: FetchArgs): HazardBundleExt {
  const f = locFactor(args);
  const [lat, lng] = guessLatLng(args);
  return {
    resolvedLat: lat,
    resolvedLng: lng,
    results: args.perils.map((p) => stubCurveFor(p, f)),
    failed: [],
  };
}

function scoreBand(n: number): string {
  return ["", "Low", "Moderate", "Elevated", "High", "Very High"][n] ?? "Low";
}

function stubTriage(args: FetchArgs): TriageLite {
  const f = locFactor(args);
  const [lat, lng] = guessLatLng(args);
  const scores: TriageScore[] = args.perils.map((peril) => {
    const curve = stubCurveFor(peril, f);
    const keyT = KEY_THRESHOLD[peril] ?? String(curve.threshold[curve.threshold.length - 1] ?? "");
    // find the RP nearest the key threshold
    let idx = curve.threshold.findIndex((t) => String(t).includes(keyT.replace("m", "")));
    if (idx < 0) idx = Math.min(2, curve.threshold.length - 1);
    const rp = curve.return_period?.[idx] ?? 100;
    // relative score: shorter RP at the key threshold → higher score
    const n = rp <= 0 ? 1 : Math.max(1, Math.min(5, Math.round(6 - Math.log10(rp) * 1.6)));
    return { peril, score: n, band: scoreBand(n), keyThreshold: keyT, keyReturnPeriod: Math.round(rp) };
  });
  return { resolvedLat: lat, resolvedLng: lng, scores, failed: [] };
}
