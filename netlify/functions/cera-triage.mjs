import { json } from "./_geo.mjs";

// POST /api/cera/triage  -> per-peril CERA scores for each location.
// Region-aware deterministic stub; uses the live CERA API when a key is set
// (VITE_BEV_API_KEY / BEV_API_KEY in the Netlify env).

const CERA_PERILS = [
  { id: "TropicalCyclone", label: "Tropical cyclone", keyThreshold: "CAT3", unit: "Saffir-Simpson" },
  { id: "FloodLivePlus", label: "Flood", keyThreshold: "1m depth", unit: "m" },
  { id: "Wildfire", label: "Wildfire", keyThreshold: "Severe", unit: "band" },
  { id: "Earthquake", label: "Earthquake", keyThreshold: "MMI6", unit: "MMI" },
  { id: "USTornado", label: "US tornado", keyThreshold: "EF2", unit: "EF" },
];

const inBox = (lat, lon, b) => lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3];

function exposureFactor(peril, lat, lon) {
  const absLat = Math.abs(lat);
  switch (peril) {
    case "TropicalCyclone":
      if (absLat <= 8) return 0.15;
      if (absLat <= 35) return 0.85;
      if (absLat <= 45) return 0.35;
      return 0.05;
    case "FloodLivePlus": {
      let e = 0.45;
      if (absLat <= 30) e += 0.2;
      return Math.min(e, 0.9);
    }
    case "Wildfire": {
      const boxes = [[32, 42, -125, -114], [-39, -28, 140, 154], [36, 44, -10, 30], [-35, -30, 18, 26]];
      return boxes.some((b) => inBox(lat, lon, b)) ? 0.8 : 0.25;
    }
    case "Earthquake": {
      const boxes = [[30, 46, 129, 146], [32, 42, -125, -115], [-56, -17, -76, -66], [36, 47, 6, 19], [-48, -34, 166, 179], [36, 42, 26, 45], [-11, 6, 95, 141]];
      return boxes.some((b) => inBox(lat, lon, b)) ? 0.85 : 0.18;
    }
    case "USTornado":
      if (inBox(lat, lon, [30, 45, -104, -85])) return 0.8;
      if (inBox(lat, lon, [25, 49, -125, -67])) return 0.4;
      return 0.02;
    default:
      return 0.1;
  }
}

const RP_RANGE = {
  TropicalCyclone: [8, 500],
  FloodLivePlus: [10, 500],
  Wildfire: [15, 500],
  Earthquake: [20, 2000],
  USTornado: [30, 5000],
};

function scoreFromRP(rp) {
  if (rp <= 25) return { score: 5, band: "Very high" };
  if (rp <= 50) return { score: 4, band: "High" };
  if (rp <= 100) return { score: 3, band: "Elevated" };
  if (rp <= 250) return { score: 2, band: "Moderate" };
  return { score: 1, band: "Low" };
}

function stubScores(lat, lon) {
  return CERA_PERILS.map((p) => {
    const e = exposureFactor(p.id, lat, lon);
    const [min, max] = RP_RANGE[p.id];
    const rp = Math.round(min + (max - min) * Math.pow(1 - e, 2));
    const { score, band } = scoreFromRP(rp);
    return { peril: p.id, label: p.label, score, band, keyThreshold: p.keyThreshold, keyReturnPeriod: rp, unit: p.unit };
  });
}

export const handler = async (event) => {
  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid JSON body" });
  }
  const locations = Array.isArray(body?.locations) ? body.locations : [];
  if (!locations.length) return json(400, { error: "locations[] required" });

  const apiKey = process.env.VITE_BEV_API_KEY || process.env.BEV_API_KEY || "";
  const baseUrl = process.env.VITE_BEV_API_BASE_URL || process.env.BEV_API_BASE_URL || "https://api.birdseyeview.ai";

  if (apiKey) {
    try {
      const events = locations.map((l, i) => ({ index: i, latitude: l.lat, longitude: l.lon, location: l.lat == null ? l.label : undefined }));
      const res = await fetch(`${baseUrl}/v1/in-depth/lite`, {
        method: "POST",
        headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ perils: CERA_PERILS.map((p) => p.id), events }),
      });
      if (res.ok) {
        const data = await res.json();
        const results = locations.map((l, i) => {
          const raw = (data.results || []).filter((r) => r.index === i);
          const scores = raw.map((r) => {
            const def = CERA_PERILS.find((p) => p.id === r.peril);
            const rp = r.keyReturnPeriod ?? r.return_period?.[0] ?? 999;
            const { score, band } = scoreFromRP(rp);
            return { peril: r.peril, label: def?.label ?? r.peril, score: r.score ?? score, band: r.band ?? band, keyThreshold: def?.keyThreshold ?? "", keyReturnPeriod: rp, unit: def?.unit ?? "" };
          });
          return { index: i, label: l.label, lat: l.lat, lon: l.lon, country: l.country ?? null, scores };
        });
        return json(200, { mode: "live", results });
      }
    } catch {
      /* fall through to stub */
    }
  }

  const results = locations.map((l, i) => ({ index: i, label: l.label, lat: l.lat, lon: l.lon, country: l.country ?? null, scores: stubScores(l.lat, l.lon) }));
  return json(200, { mode: "stub", results });
};
