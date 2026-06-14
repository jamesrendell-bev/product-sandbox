// Tolerant parsers for the messy free-text fields in broker submissions.

export function parseStories(val) {
  if (val == null || val === "") return null;
  if (typeof val === "number") return Math.trunc(val);
  const s = String(val);
  let m = s.toLowerCase().match(/(\d+)\s*(?:stor|st\b)/);
  if (m) return Number(m[1]);
  m = s.match(/^\s*(\d+)\s*$/);
  if (m) return Number(m[1]);
  return null;
}

export function parseYear(val) {
  if (val == null || val === "") return null;
  if (typeof val === "number" && val >= 1700 && val <= 2100) return Math.trunc(val);
  const s = String(val);
  const years = [...s.matchAll(/\b(1[789]\d{2}|20\d{2}|21\d{2})\b/g)].map((m) => Number(m[1]));
  if (years.length) return Math.min(...years);
  return null;
}

export function parseSprinklerPct(val) {
  if (val == null || val === "") return null;
  const s = String(val);
  const m = s.match(/(\d+(?:\.\d+)?)\s*%/);
  if (m) return Number(m[1]);
  if (s.toLowerCase().includes("sprinkler") && s.includes("100")) return 100;
  return null;
}

// $0 is treated as not-supplied — usually a SUM-over-empty-rows formula.
export function parseMoney(val) {
  if (val == null || val === "" || val === "-") return null;
  if (typeof val === "number") {
    const n = Math.trunc(val);
    return n === 0 ? null : n;
  }
  let s = String(val).replace(/[,\$]/g, "").trim();
  if (s === "" || s === "-" || s === "0") return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return null;
  const t = Math.trunc(n);
  return t === 0 ? null : t;
}

export function parseZip(val) {
  if (val == null || val === "") return null;
  if (typeof val === "number") return String(val).padStart(5, "0").slice(-5);
  const s = String(val).trim();
  const m = s.match(/(\d{5})/);
  return m ? m[1] : s;
}

// Split a "Site, Street, City, ST 12345"-style string into components.
export function parseAddress(locString) {
  if (!locString) return { loc_name: null, street: null, city: null, state: null, postcode: null };
  const parts = String(locString).split(",").map((p) => p.trim());
  let postcode = null, state = null, city = null, residual = parts;
  const last = parts[parts.length - 1] || "";
  if (/^\d{5}$/.test(last)) {
    postcode = last;
    state = parts[parts.length - 2] || null;
    city = parts[parts.length - 3] || null;
    residual = parts.slice(0, -3);
  } else if (/^[A-Za-z]{2}$/.test(last)) {
    state = last;
    city = parts[parts.length - 2] || null;
    residual = parts.slice(0, -2);
  }
  if (residual.length === 0) return { loc_name: null, street: null, city, state, postcode };
  if (residual.length === 1) return { loc_name: residual[0], street: null, city, state, postcode };
  const street = residual[residual.length - 1];
  const loc_name = residual.slice(0, -1).join(", ").trim();
  return { loc_name, street, city, state, postcode };
}
