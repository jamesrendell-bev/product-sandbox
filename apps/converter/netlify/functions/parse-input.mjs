// POST /api/parse-input
// Body: multipart/form-data with `file` = .xlsx
// Returns JSON: { sheets, picked_sheet, headers, mapping, rows }
//
// Auto-detects the schedule sheet, fuzzy-maps headers to canonical raw fields,
// and emits a row list the workbench can render. The frontend can re-map
// columns by POSTing the same file with an explicit `mapping` override.

import ExcelJS from "exceljs";
import {
  parseStories, parseYear, parseSprinklerPct, parseMoney, parseZip,
} from "../../shared/parse-helpers.mjs";

const RAW_FIELDS = [
  "date", "division", "location", "address", "city", "state", "zip",
  "occupancy_narrative", "construction_narrative",
  "stories_raw", "num_buildings", "year_built_raw", "sqft_raw", "sprinkler_raw",
  "buildings_value_raw", "me_value_raw", "misc_value_raw",
  "total_pd_raw", "bi_value_raw", "total_pd_bi_raw",
  "lat", "lng", "insured",
];

// Header keyword → canonical raw field. First match wins; check ordered.
// Order matters: more-specific rules must precede broader ones (e.g.
// "DATE BUILT" -> year_built_raw, before the generic "Date" rule).
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

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return { statusCode: 400, body: "Expected multipart/form-data" };
    }
    const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
    if (!boundary) return { statusCode: 400, body: "Missing multipart boundary" };

    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "binary");

    const filePart = extractFilePart(raw, boundary);
    if (!filePart) return { statusCode: 400, body: "No file field found" };

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(filePart.buffer);

    // Find the sheet whose best header row has the highest score.
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
      return { statusCode: 422, body: JSON.stringify({
        error: "Could not auto-detect a schedule sheet. Header row needs >=3 recognisable columns (Location, Address, Occupancy, etc.).",
        sheets: wb.worksheets.map((w) => w.name),
      }) };
    }

    // Build column → canonical mapping.
    const mapping = {};
    best.columns.forEach((h, i) => {
      const key = classifyHeader(h);
      if (key && !(key in mapping)) mapping[key] = i; // first match wins
    });

    const ws = wb.getWorksheet(best.sheetName);
    const rows = [];
    const seen = new Set();
    for (let r = best.headerRow + 1; r <= ws.actualRowCount; r++) {
      const row = ws.getRow(r);
      const values = [];
      row.eachCell({ includeEmpty: true }, (c, col) => { values[col - 1] = cell(c.value); });
      // Skip rows with no location AND no address — almost certainly a section break or footer.
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
      // Clean + type the raw values into something canonical-builder can consume.
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
        _raw: out, // keep originals for the audit columns
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheets: wb.worksheets.map((w) => w.name),
        picked_sheet: best.sheetName,
        header_row: best.headerRow,
        headers: best.columns,
        mapping,
        rows,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: `parse-input error: ${err.message}` };
  }
};

// Minimal multipart extractor — pulls the first file part. Good enough for a
// single-upload form; doesn't handle nested or oddly-encoded payloads.
function extractFilePart(buf, boundary) {
  const delim = Buffer.from(`--${boundary}`);
  let i = buf.indexOf(delim);
  while (i !== -1) {
    const start = i + delim.length;
    const headerEnd = buf.indexOf("\r\n\r\n", start);
    if (headerEnd === -1) break;
    const header = buf.slice(start, headerEnd).toString();
    const nextDelim = buf.indexOf(delim, headerEnd + 4);
    if (nextDelim === -1) break;
    const bodyEnd = nextDelim - 2; // strip preceding \r\n
    if (/filename="[^"]*\.xlsx?"/i.test(header)) {
      return {
        filename: header.match(/filename="([^"]+)"/i)?.[1],
        buffer: buf.slice(headerEnd + 4, bodyEnd),
      };
    }
    i = nextDelim;
  }
  return null;
}
