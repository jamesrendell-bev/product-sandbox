import type { ApiCtx } from "../index";

// Cat perils CERA scores for the contingency triage. Key threshold + unit match
// the BEV CERA API and the MGA app's underwriting-authority defaults.
export const CERA_PERILS = [
  { id: "TropicalCyclone", label: "Tropical cyclone", keyThreshold: "CAT3", unit: "Saffir-Simpson" },
  { id: "FloodLivePlus", label: "Flood", keyThreshold: "1m depth", unit: "m" },
  { id: "Wildfire", label: "Wildfire", keyThreshold: "Severe", unit: "band" },
  { id: "Earthquake", label: "Earthquake", keyThreshold: "MMI6", unit: "MMI" },
  { id: "USTornado", label: "US tornado", keyThreshold: "EF2", unit: "EF" },
] as const;

export type CeraPerilId = (typeof CERA_PERILS)[number]["id"];

interface PerilScore {
  peril: CeraPerilId;
  label: string;
  score: number; // 1..5 globally-relative
  band: string;
  keyThreshold: string;
  keyReturnPeriod: number; // years — return period AT the key threshold
  unit: string;
}

interface TriageLocationResult {
  index: number;
  label: string;
  lat: number;
  lon: number;
  country: string | null;
  scores: PerilScore[];
}

const inBox = (lat: number, lon: number, b: [number, number, number, number]) =>
  lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3];

// Coarse, deterministic regional exposure factors (0 none … 1 extreme).
// PoC-grade — replaced by live CERA the moment a key is set.
function exposureFactor(peril: CeraPerilId, lat: number, lon: number): number {
  const absLat = Math.abs(lat);
  switch (peril) {
    case "TropicalCyclone": {
      // tropical/subtropical coastal bands carry the most cyclone exposure
      if (absLat <= 8) return 0.15;
      if (absLat <= 35) return 0.85;
      if (absLat <= 45) return 0.35;
      return 0.05;
    }
    case "FloodLivePlus": {
      // monsoon/low-lat boost + broad baseline
      let e = 0.45;
      if (absLat <= 30) e += 0.2;
      return Math.min(e, 0.9);
    }
    case "Wildfire": {
      const boxes: [number, number, number, number][] = [
        [32, 42, -125, -114], // California / US West
        [-39, -28, 140, 154], // SE Australia
        [36, 44, -10, 30], // Mediterranean
        [-35, -30, 18, 26], // W Cape
      ];
      return boxes.some((b) => inBox(lat, lon, b)) ? 0.8 : 0.25;
    }
    case "Earthquake": {
      const boxes: [number, number, number, number][] = [
        [30, 46, 129, 146], // Japan
        [32, 42, -125, -115], // US West Coast
        [-56, -17, -76, -66], // Chile / Andes
        [36, 47, 6, 19], // Italy
        [-48, -34, 166, 179], // New Zealand
        [36, 42, 26, 45], // Turkey
        [-11, 6, 95, 141], // Indonesia
      ];
      return boxes.some((b) => inBox(lat, lon, b)) ? 0.85 : 0.18;
    }
    case "USTornado": {
      // tornado alley + broader US east; near-zero outside the US
      if (inBox(lat, lon, [30, 45, -104, -85])) return 0.8;
      if (inBox(lat, lon, [25, 49, -125, -67])) return 0.4;
      return 0.02;
    }
  }
}

const RP_RANGE: Record<CeraPerilId, [number, number]> = {
  TropicalCyclone: [8, 500],
  FloodLivePlus: [10, 500],
  Wildfire: [15, 500],
  Earthquake: [20, 2000],
  USTornado: [30, 5000],
};

function scoreFromRP(rp: number): { score: number; band: string } {
  if (rp <= 25) return { score: 5, band: "Very high" };
  if (rp <= 50) return { score: 4, band: "High" };
  if (rp <= 100) return { score: 3, band: "Elevated" };
  if (rp <= 250) return { score: 2, band: "Moderate" };
  return { score: 1, band: "Low" };
}

function stubScores(lat: number, lon: number): PerilScore[] {
  return CERA_PERILS.map((p) => {
    const e = exposureFactor(p.id, lat, lon);
    const [min, max] = RP_RANGE[p.id];
    const rp = Math.round(min + (max - min) * Math.pow(1 - e, 2));
    const { score, band } = scoreFromRP(rp);
    return {
      peril: p.id,
      label: p.label,
      score,
      band,
      keyThreshold: p.keyThreshold,
      keyReturnPeriod: rp,
      unit: p.unit,
    };
  });
}

export async function ceraTriage({ env, body }: ApiCtx) {
  const locations: any[] = Array.isArray(body?.locations) ? body.locations : [];
  if (!locations.length) return { status: 400, json: { error: "locations[] required" } };

  const apiKey = env.VITE_BEV_API_KEY || env.BEV_API_KEY || "";
  const baseUrl = env.VITE_BEV_API_BASE_URL || env.BEV_API_BASE_URL || "https://api.birdseyeview.ai";

  // --- Live CERA (best-effort; falls back to stub on any failure) ---
  if (apiKey) {
    try {
      const events = locations.map((l, i) => ({
        index: i,
        latitude: l.lat,
        longitude: l.lon,
        location: l.lat == null ? l.label : undefined,
      }));
      const res = await fetch(`${baseUrl}/v1/in-depth/lite`, {
        method: "POST",
        headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ perils: CERA_PERILS.map((p) => p.id), events }),
      });
      if (res.ok) {
        const data: any = await res.json();
        const results: TriageLocationResult[] = locations.map((l, i) => {
          const raw = (data.results || []).filter((r: any) => r.index === i);
          const scores: PerilScore[] = raw.map((r: any) => {
            const def = CERA_PERILS.find((p) => p.id === r.peril)!;
            const rp = r.keyReturnPeriod ?? r.return_period?.[0] ?? 999;
            const { score, band } = scoreFromRP(rp);
            return {
              peril: r.peril,
              label: def?.label ?? r.peril,
              score: r.score ?? score,
              band: r.band ?? band,
              keyThreshold: def?.keyThreshold ?? "",
              keyReturnPeriod: rp,
              unit: def?.unit ?? "",
            };
          });
          return { index: i, label: l.label, lat: l.lat, lon: l.lon, country: l.country ?? null, scores };
        });
        return { json: { mode: "live", results } };
      }
    } catch {
      // fall through to stub
    }
  }

  // --- Stub (no key, or live failed) ---
  const results: TriageLocationResult[] = locations.map((l, i) => ({
    index: i,
    label: l.label,
    lat: l.lat,
    lon: l.lon,
    country: l.country ?? null,
    scores: stubScores(l.lat, l.lon),
  }));
  return { json: { mode: "stub", results } };
}
