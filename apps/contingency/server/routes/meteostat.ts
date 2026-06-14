import zlib from "node:zlib";
import { promisify } from "node:util";
import type { ApiCtx } from "../index";

const gunzip = promisify(zlib.gunzip);

// ---- geocoding helpers ----
// Photon (komoot) is OSM-based and built FOR autocomplete (venues + cities).
// Nominatim is deliberately NOT used here — its usage policy forbids autocomplete
// and it rate-limits/blocks, which caused request hangs/timeouts. Open-Meteo is the
// fallback. All upstream calls have a hard timeout so they never hang.
interface GeoHit { lat: number; lon: number; label: string; country: string | null; country_code: string | null; type: string | null }

async function fetchWithTimeout(url: string, ms = 7000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

function photonMap(f: any): GeoHit | null {
  const c = f?.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const p = f.properties ?? {};
  const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(", ");
  return {
    lat: c[1], lon: c[0], label: label || p.name || "unknown",
    country: p.country ?? null,
    country_code: (p.countrycode ?? "").toUpperCase() || null,
    type: p.osm_value ?? p.osm_key ?? null,
  };
}

async function photonSearch(q: string, limit: number): Promise<GeoHit[]> {
  const res = await fetchWithTimeout(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return ((data?.features ?? []).map(photonMap).filter(Boolean)) as GeoHit[];
}

async function openMeteoSearch(q: string, limit: number): Promise<GeoHit[]> {
  const res = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${limit}&language=en&format=json`);
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return (data?.results ?? []).map((r: any): GeoHit => ({
    lat: r.latitude, lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    country: r.country ?? null, country_code: r.country_code ?? null, type: r.feature_code ?? null,
  }));
}

// Photon primary → Open-Meteo fallback. Dedupes by label. Never throws.
// Retries with the first segment if the full string (e.g. "Glastonbury, UK")
// returns nothing — Photon dislikes some country suffixes.
async function geosearchAll(q: string, limit: number): Promise<GeoHit[]> {
  const terms = [q.trim()];
  if (q.includes(",")) terms.push(q.split(",")[0].trim());
  for (const term of terms) {
    if (!term) continue;
    let hits: GeoHit[] = [];
    try { hits = await photonSearch(term, limit + 4); } catch { /* timeout → fallback */ }
    if (!hits.length) { try { hits = await openMeteoSearch(term, limit); } catch { /* give up */ } }
    if (hits.length) {
      const seen = new Set<string>();
      return hits.filter((h) => { const k = h.label.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit);
    }
  }
  return [];
}

// ---- geocode (single best match, used on Run) ----
export async function meteostatGeocode({ query }: ApiCtx) {
  const q = query.get("q");
  if (!q || !q.trim()) return { status: 400, json: { error: "q required" } };
  const hits = await geosearchAll(q, 1);
  if (hits.length) {
    const r = hits[0];
    return { json: { lat: r.lat, lon: r.lon, label: r.label, country_code: r.country_code, country: r.country, source: "photon" } };
  }
  return { status: 404, json: { error: `could not geocode "${q}" — check the spelling or try the nearest town.` } };
}

// ---- geocode search (type-ahead, multiple candidates, global) ----
export async function meteostatGeosearch({ query }: ApiCtx) {
  const q = query.get("q");
  if (!q || q.trim().length < 2) return { json: { results: [] } };
  const results = await geosearchAll(q, 6);
  return { json: { results } };
}

// ---- nearest stations ----
const STATIONS_URL = "https://bulk.meteostat.net/v2/stations/lite.json.gz";
let stationsCache: any[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function loadStations(): Promise<any[]> {
  if (stationsCache && Date.now() - cachedAt < CACHE_TTL_MS) return stationsCache;
  const res = await fetch(STATIONS_URL);
  if (!res.ok) throw new Error(`stations fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  stationsCache = JSON.parse((await gunzip(buf)).toString("utf-8"));
  cachedAt = Date.now();
  return stationsCache!;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function meteostatStations({ query }: ApiCtx) {
  const lat = parseFloat(query.get("lat") || "");
  const lon = parseFloat(query.get("lon") || "");
  const limit = Math.min(parseInt(query.get("limit") || "5", 10), 25);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return { status: 400, json: { error: "lat and lon required" } };
  }
  const stations = await loadStations();
  const enriched: any[] = [];
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
  return { json: { stations: enriched.slice(0, limit) } };
}

// ---- daily history ----
const COLUMNS = [
  "date", "tavg", "tmin", "tmax", "prcp", "snow",
  "wdir", "wspd", "wpgt", "pres", "tsun",
];

export async function meteostatDaily({ query }: ApiCtx) {
  const station = query.get("station");
  const start = query.get("start");
  const end = query.get("end");
  if (!station || !/^[A-Z0-9]{1,8}$/i.test(station)) {
    return { status: 400, json: { error: "valid station id required" } };
  }
  const dataUrl = `https://bulk.meteostat.net/v2/daily/${encodeURIComponent(station)}.csv.gz`;
  const res = await fetch(dataUrl);
  if (res.status === 404) return { json: { rows: [], note: "no daily data for this station" } };
  if (!res.ok) return { status: 502, json: { error: `meteostat fetch failed: ${res.status}` } };

  const buf = Buffer.from(await res.arrayBuffer());
  const text = (await gunzip(buf)).toString("utf-8");
  const rows: any[] = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    const parts = line.split(",");
    const row: any = {};
    for (let i = 0; i < COLUMNS.length; i++) {
      const v = parts[i];
      if (v === undefined || v === "") row[COLUMNS[i]] = null;
      else if (i === 0) row[COLUMNS[i]] = v;
      else {
        const n = Number(v);
        row[COLUMNS[i]] = Number.isFinite(n) ? n : null;
      }
    }
    if (start && row.date < start) continue;
    if (end && row.date > end) continue;
    rows.push(row);
  }
  return { json: { rows, station } };
}
