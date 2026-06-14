import { geosearchAll, json } from "./_geo.mjs";

// GET /api/meteostat/geosearch?q=...  -> up to 6 candidates (type-ahead)
export const handler = async (event) => {
  const q = (event.queryStringParameters || {}).q;
  if (!q || q.trim().length < 2) return json(200, { results: [] });
  const results = await geosearchAll(q, 6);
  return json(200, { results });
};
