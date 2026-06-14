import zlib from "node:zlib";
import { json } from "./_geo.mjs";

// GET /api/meteostat/daily?station=&start=&end=  -> daily weather history.
// Fetches the Meteostat bulk daily CSV server-side (no browser CORS limit).

const COLUMNS = ["date", "tavg", "tmin", "tmax", "prcp", "snow", "wdir", "wspd", "wpgt", "pres", "tsun"];

export const handler = async (event) => {
  const qp = event.queryStringParameters || {};
  const station = qp.station;
  const start = qp.start;
  const end = qp.end;
  if (!station || !/^[A-Z0-9]{1,8}$/i.test(station)) return json(400, { error: "valid station id required" });

  try {
    const res = await fetch(`https://bulk.meteostat.net/v2/daily/${encodeURIComponent(station)}.csv.gz`);
    if (res.status === 404) return json(200, { rows: [], note: "no daily data for this station" });
    if (!res.ok) return json(502, { error: `meteostat fetch failed: ${res.status}` });

    const buf = Buffer.from(await res.arrayBuffer());
    const text = zlib.gunzipSync(buf).toString("utf-8");
    const rows = [];
    for (const line of text.split("\n")) {
      if (!line) continue;
      const parts = line.split(",");
      const row = {};
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
    return json(200, { rows, station });
  } catch (err) {
    return json(502, { error: `daily error: ${err.message}` });
  }
};
