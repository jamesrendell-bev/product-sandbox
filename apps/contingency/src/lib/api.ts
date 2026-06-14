// Thin fetch wrappers for the /api routes.
//
// API_BASE lets the data backend live anywhere. Empty (default) = same origin,
// which is how the local dev server works (Vite mounts /api in-process). For a
// GitLab Pages deploy, point this at the server the team stands up to host the
// Meteostat + CERA routes (server/routes/ here is the reference implementation):
//   set VITE_API_BASE=https://your-server.example.com  at build time.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(API_BASE + url);
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || `${res.status} ${url}`);
  return j as T;
}
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || `${res.status} ${url}`);
  return j as T;
}

export interface GeocodeResult {
  lat: number; lon: number; label: string;
  country_code: string | null; country: string | null; source: string;
}
export const geocode = (q: string) =>
  getJson<GeocodeResult>(`/api/meteostat/geocode?q=${encodeURIComponent(q)}`);

export interface GeoCandidate { label: string; lat: number; lon: number; country: string | null; country_code: string | null; type: string | null }
export const geosearch = (q: string) =>
  getJson<{ results: GeoCandidate[] }>(`/api/meteostat/geosearch?q=${encodeURIComponent(q)}`).then((r) => r.results);

export interface Station {
  id: string; name: string; country: string;
  latitude: number; longitude: number; elevation: number | null; distance_km: number;
}
export const fetchStations = (lat: number, lon: number, limit = 5) =>
  getJson<{ stations: Station[] }>(`/api/meteostat/stations?lat=${lat}&lon=${lon}&limit=${limit}`).then((r) => r.stations);

export interface DailyRow { date: string; [k: string]: number | string | null }
export const fetchDaily = (station: string, start: string, end: string) =>
  getJson<{ rows: DailyRow[] }>(`/api/meteostat/daily?station=${encodeURIComponent(station)}&start=${start}&end=${end}`).then((r) => r.rows ?? []);

// ---- CERA triage ----
export interface PerilScore {
  peril: string; label: string; score: number; band: string;
  keyThreshold: string; keyReturnPeriod: number; unit: string;
}
export interface TriageLocation {
  index: number; label: string; lat: number; lon: number;
  country: string | null; scores: PerilScore[];
}
export interface TriageResponse { mode: "live" | "stub"; results: TriageLocation[] }
export const ceraTriage = (locations: { label: string; lat: number; lon: number; country?: string | null }[]) =>
  postJson<TriageResponse>("/api/cera/triage", { locations });
