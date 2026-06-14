import zlib from "node:zlib";
import { json } from "./_geo.mjs";

// GET /api/meteostat/stations?lat=&lon=&limit=  -> nearest ground stations.
// Fetches the Meteostat bulk station list server-side (no browser CORS limit).

const STATIONS_URL = "https://bulk.meteostat.net/v2/stations/lite.json.gz";
let stationsCache = null;
let cachedAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function loadStations() {
  if (stationsCache && Date.now() - cachedAt < CACHE_TTL_MS) return stationsCache;
  const res = await fetch(STATIONS_URL);
  if (!res.ok) throw new Error(`stations fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  stationsCache = JSON.parse(zlib.gunzipSync(buf).toString("utf-8"));
  cachedAt = Date.now();
  return stationsCache;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const handler = async (event) => {
  const qp = event.queryStringParameters || {};
  const lat = parseFloat(qp.lat || "");
  const lon = parseFloat(qp.lon || "");
  const limit = Math.min(parseInt(qp.limit || "5", 10), 25);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return json(400, { error: "lat and lon required" });

  try {
    const stations = await loadStations();
    const enriched = [];
    for (const s of stations) {
      const slat = s?.location?.latitude;
      const slon = s?.location?.longitude;
      if (typeof slat !== "number" || typeof slon !== "number") continue;
      enriched.push({
        id: s.id,
        name: s.name?.en ?? s.name ?? s.id,
        country: s.country,
        latitude: slat,
        longitude: slon,
        elevation: s?.location?.elevation ?? null,
        distance_km: haversineKm(lat, lon, slat, slon),
      });
    }
    enriched.sort((a, b) => a.distance_km - b.distance_km);
    return json(200, { stations: enriched.slice(0, limit) });
  } catch (err) {
    return json(502, { error: `stations error: ${err.message}` });
  }
};
