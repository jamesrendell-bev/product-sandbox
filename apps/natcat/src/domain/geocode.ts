// src/domain/geocode.ts
//
// Single free-text address → lat/long. STUB mode uses Nominatim (OpenStreetMap),
// free but rate-limited (~1 req/s, attribution required) — single lookups only,
// NOT bulk. Bulk plotting uses the BDX AI_Output coordinates; live uses CERA®'s
// resolved lat/long.

export interface GeoResult {
  lat: number;
  lng: number;
  display: string;
}

const cache = new Map<string, GeoResult | null>();

export async function geocode(address: string): Promise<GeoResult | null> {
  const q = address.trim();
  if (!q) return null;
  if (cache.has(q)) return cache.get(q)!;
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!data.length) {
      cache.set(q, null);
      return null;
    }
    const r: GeoResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name,
    };
    cache.set(q, r);
    return r;
  } catch {
    cache.set(q, null);
    return null;
  }
}
