// Browser-side schedule parser. Reads an .xlsx ArrayBuffer with the ExcelJS
// browser build (loaded as window.ExcelJS), auto-detects the schedule sheet,
// fuzzy-maps headers to canonical raw fields, and returns the row list the
// workbench renders. Ported from netlify/functions/parse-input.mjs so the app
// runs with no backend (deployable on GitLab Pages).

import {
  parseStories, parseYear, parseSprinklerPct, parseMoney, parseZip,
} from "../shared/parse-helpers.mjs";

const RAW_FIELDS = [
  "date", "division", "location", "address", "city", "state", "zip",
  "occupancy_narrative", "construction_narrative",
  "stories_raw", "num_buildings", "year_built_raw", "sqft_raw", "sprinkler_raw",
  "buildings_value_raw", "me_value_raw", "misc_value_raw",
  "total_pd_raw", "bi_value_raw", "total_pd_bi_raw",
  "lat", "lng", "insured",
];

// Header keyword → canonical raw field. First match wins; order matters.
const HEADER_MAP = [
  [/(year.*built|date.*built|built|year\b)/i, "year_built_raw"],
  [/(num.*build|#.*build|number\s*of\s*build|#\s*of\s*buildings?)/i, "num_buildings"],
  [/\bdate\b/i,                           "date"],
  [/(division|insured|company|account|named\s*insured)/i, "division"],
  [/\blocation\b(?!.*number)/i,           "location"],
  [/(street|address|premise|site)/i,      "address"],
  [/\bcity\b/i,                           "city"],
  [/(\bstate\b|province|^st\b|^st\s*\/|state\s*\/\s*country)/i, "state"],
  [/(zip|postcode|postal)/i,              "zip"],
  [/occupancy/i,                          "occupancy_narrative"],
  [/(construction|predominant)/i,         "construction_narrative"],
  [/(stories|storeys|floors)/i,           "stories_raw"],
  [/(sq\s*ft|square|floor\s*area|gross.*area)/i, "sqft_raw"],
  [/(sprinkler|protection)/i,             "sprinkler_raw"],
  [/^\s*(building|bldg)s?\b/i,            "buildings_value_raw"],
  [/(building|bldg)\s*(value|tiv|amount)/i, "buildings_value_raw"],
  [/(m\s*&?\s*e|machinery|equipment|f\s*&?\s*f|contents)/i, "me_value_raw"],
  [/(misc|other|additional)/i,            "misc_value_raw"],
  [/(total\s*pd\s*\&?\s*\/?\s*bi|total\s*pd.?bi)/i, "total_pd_bi_raw"],
  [/(total\s*pd|total\s*property)/i,      "total_pd_raw"],
  [/(b\s*\.?\s*i\.?|business\s*interruption|time\s*element)/i, "bi_value_raw"],
  [/(lat|latitude)/i,                     "lat"],
  [/(lng|long|longitude)/i,               "lng"],
];

function classifyHeader(text) {
  const t = String(text || "").trim();
  if (!t) return null;
  for (const [re, key] of HEADER_MAP) if (re.test(t)) return key;
  return null;
}

function scoreHeaderRow(values) {
  let score = 0;
  for (const v of values) if (classifyHeader(v)) score += 1;
  return score;
}

function cell(v) {
  if (v == null) return null;
  if (typeof v === "object" && "text" in v) return v.text; // rich text
  if (typeof v === "object" && "result" in v) return v.result; // formula
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v;
}

export async function parseWorkbook(arrayBuffer) {
  const ExcelJS = window.ExcelJS;
  if (!ExcelJS) throw new Error("ExcelJS not loaded");

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);

  // Find the sheet whose best header row scores highest.
  let best = { sheetName: null, headerRow: 1, columns: [], score: -1 };
  for (const ws of wb.worksheets) {
    for (let r = 1; r <= Math.min(15, ws.actualRowCount || 15); r++) {
      const row = ws.getRow(r);
      const values = [];
      row.eachCell({ includeEmpty: true }, (c, col) => { values[col - 1] = cell(c.value); });
      const score = scoreHeaderRow(values);
      if (score > best.score) {
        best = { sheetName: ws.name, headerRow: r, columns: values, score };
      }
    }
  }
  if (best.score < 3) {
    const err = new Error(
      "Could not auto-detect a schedule sheet. The header row needs at least 3 recognisable columns (Location, Address, Occupancy, etc.)."
    );
    err.sheets = wb.worksheets.map((w) => w.name);
    throw err;
  }

  const mapping = {};
  best.columns.forEach((h, i) => {
    const key = classifyHeader(h);
    if (key && !(key in mapping)) mapping[key] = i;
  });

  const ws = wb.getWorksheet(best.sheetName);
  const rows = [];
  const seen = new Set();
  for (let r = best.headerRow + 1; r <= ws.actualRowCount; r++) {
    const row = ws.getRow(r);
    const values = [];
    row.eachCell({ includeEmpty: true }, (c, col) => { values[col - 1] = cell(c.value); });
    const loc = values[mapping.location];
    const addr = values[mapping.address];
    if (!loc && !addr) continue;
    const dedupKey = `${values[mapping.division] || ""}::${loc || ""}::${addr || ""}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const out = {};
    for (const f of RAW_FIELDS) {
      const col = mapping[f] ?? mapping[f.replace(/_raw$/, "")];
      out[f] = col != null ? values[col] : null;
    }
    rows.push({
      insured: out.division ? String(out.division).trim() : null,
      division: out.division ? String(out.division).trim() : null,
      location: out.location ? String(out.location).trim() : null,
      address: out.address ? String(out.address).trim() : null,
      city: out.city ? String(out.city).trim() : null,
      state: out.state ? String(out.state).trim().toUpperCase() : null,
      zip: parseZip(out.zip),
      lat: out.lat != null && out.lat !== "" ? Number(out.lat) : null,
      lng: out.lng != null && out.lng !== "" ? Number(out.lng) : null,
      occupancy_narrative: out.occupancy_narrative ? String(out.occupancy_narrative).trim() : null,
      construction_narrative: out.construction_narrative ? String(out.construction_narrative).trim() : null,
      stories: parseStories(out.stories_raw),
      num_buildings: out.num_buildings != null && out.num_buildings !== "" ? Number(out.num_buildings) : null,
      year_built: parseYear(out.year_built_raw),
      sqft: out.sqft_raw != null && out.sqft_raw !== "" ? Number(String(out.sqft_raw).replace(/,/g, "")) || null : null,
      sprinkler_pct: parseSprinklerPct(out.sprinkler_raw),
      buildings_value: parseMoney(out.buildings_value_raw),
      me_value: parseMoney(out.me_value_raw),
      misc_value: parseMoney(out.misc_value_raw),
      bi_value: parseMoney(out.bi_value_raw),
      total_pd: parseMoney(out.total_pd_raw),
      total_pd_bi: parseMoney(out.total_pd_bi_raw),
      _raw: out,
    });
  }

  return {
    sheets: wb.worksheets.map((w) => w.name),
    picked_sheet: best.sheetName,
    header_row: best.headerRow,
    headers: best.columns,
    mapping,
    rows,
  };
}
