import { geosearchAll, json } from "./_geo.mjs";

// GET /api/meteostat/geocode?q=...  -> single best match
export const handler = async (event) => {
  const q = (event.queryStringParameters || {}).q;
  if (!q || !q.trim()) return json(400, { error: "q required" });
  const hits = await geosearchAll(q, 1);
  if (hits.length) {
    const r = hits[0];
    return json(200, { lat: r.lat, lon: r.lon, label: r.label, country_code: r.country_code, country: r.country, source: "photon" });
  }
  return json(404, { error: `could not geocode "${q}" — check the spelling or try the nearest town.` });
};
