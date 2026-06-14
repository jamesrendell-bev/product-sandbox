// Shared geocoding helpers for the Contingency functions.
// Photon (OSM, built for autocomplete) primary, Open-Meteo fallback. Run
// server-side in a Netlify Function, so no browser CORS limits apply.

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function photonMap(f) {
  const c = f?.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const p = f.properties ?? {};
  const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(", ");
  return {
    lat: c[1],
    lon: c[0],
    label: label || p.name || "unknown",
    country: p.country ?? null,
    country_code: (p.countrycode ?? "").toUpperCase() || null,
    type: p.osm_value ?? p.osm_key ?? null,
  };
}

async function photonSearch(q, limit) {
  const res = await fetchWithTimeout(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.features ?? []).map(photonMap).filter(Boolean);
}

async function openMeteoSearch(q, limit) {
  const res = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${limit}&language=en&format=json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.results ?? []).map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    country: r.country ?? null,
    country_code: r.country_code ?? null,
    type: r.feature_code ?? null,
  }));
}

// Photon primary, Open-Meteo fallback. Dedupes by label. Never throws.
// Retries with the first comma-segment if the full string returns nothing.
export async function geosearchAll(q, limit) {
  const terms = [q.trim()];
  if (q.includes(",")) terms.push(q.split(",")[0].trim());
  for (const term of terms) {
    if (!term) continue;
    let hits = [];
    try {
      hits = await photonSearch(term, limit + 4);
    } catch {
      /* timeout -> fallback */
    }
    if (!hits.length) {
      try {
        hits = await openMeteoSearch(term, limit);
      } catch {
        /* give up */
      }
    }
    if (hits.length) {
      const seen = new Set();
      return hits
        .filter((h) => {
          const k = h.label.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .slice(0, limit);
    }
  }
  return [];
}

export function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
