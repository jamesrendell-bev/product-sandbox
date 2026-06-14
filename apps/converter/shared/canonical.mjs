// Canonical, format-independent exposure model.
// Ports cera_exposure_core.py + the rule tables from build_rms_from_real_input.py
// so both the RMS EDM emitter and the Verisk CEDE emitter consume identical
// canonical objects and only the serialisation differs.

export const OCC_KEYS = [
  "office", "warehouse", "light_mfg", "heavy_mfg",
  "food_proc", "utility", "civic", "vacant",
];

export const CONSTR_KEYS = [
  "wood", "light_metal", "steel", "rc", "urm", "mixed", "unknown",
];

// TIV split ratios — Building / Contents / BI / Other.
export const RATIOS = {
  office:    [0.60, 0.25, 0.15, 0.00],
  warehouse: [0.60, 0.30, 0.10, 0.00],
  light_mfg: [0.45, 0.30, 0.25, 0.00],
  heavy_mfg: [0.40, 0.30, 0.30, 0.00],
  food_proc: [0.40, 0.30, 0.30, 0.00],
  utility:   [0.40, 0.30, 0.30, 0.00],
  civic:     [0.70, 0.20, 0.10, 0.00],
  vacant:    [0.60, 0.30, 0.10, 0.00],
};

// Class-based notional totals when nothing was supplied.
export const NOTIONAL_TIV = {
  food_proc: 12_000_000,
  utility:    8_000_000,
  warehouse:  6_000_000,
  light_mfg: 10_000_000,
  heavy_mfg: 15_000_000,
  office:     5_000_000,
  civic:      2_000_000,
  vacant:       500_000,
};

// Default stories per class (used only when broker didn't supply).
export const DEFAULT_STORIES = {
  office: 3, warehouse: 1, light_mfg: 1, heavy_mfg: 2,
  food_proc: 3, utility: 2, civic: 2, vacant: 1,
};

// Default year-built per class.
export const DEFAULT_YEAR_BUILT = {
  office: 1985, warehouse: 1965, light_mfg: 1985, heavy_mfg: 1965,
  food_proc: 1965, utility: 1975, civic: 1950, vacant: null,
};

export function applyTivSplit(baseTiv, occKey) {
  const [b, c, bi, o] = RATIOS[occKey] || RATIOS.vacant;
  return {
    building: Math.round(baseTiv * b),
    contents: Math.round(baseTiv * c),
    bi:       Math.round(baseTiv * bi),
    other:    Math.round(baseTiv * o),
  };
}

// Canonical geocode quality from lat/long precision.
export function geomatchCanonical(lat, lng) {
  if (lat == null || lng == null) return "country";
  const decimals = Math.max(
    String(lat).includes(".") ? String(lat).split(".")[1].length : 0,
    String(lng).includes(".") ? String(lng).split(".")[1].length : 0,
  );
  if (decimals >= 4) return "rooftop";
  if (decimals >= 3) return "postcode";
  if (decimals >= 2) return "city";
  return "admin";
}

// Peril coverage by US state (proxy until policy wording supplies it).
export function perilsForLocation(state, city) {
  const s = String(state || "").toUpperCase().trim();
  const c = String(city || "").trim().toLowerCase();
  if (s === "NY") {
    if (c === "buffalo") return ["ST", "WS", "FL", "FR"];
    return ["HU", "ST", "FL", "WS", "FR"];
  }
  if (s === "LA" || s === "FL") return ["HU", "ST", "FL", "WF", "FR"];
  if (s === "NC" || s === "MD") return ["HU", "ST", "FL", "FR"];
  if (s === "CA") return ["EQ", "WF", "FR"];
  if (s === "IL") return ["EQ", "ST", "WS", "FL", "FR"];
  if (s === "OH") return ["ST", "WS", "FL", "FR"];
  if (s === "TN") return ["EQ", "ST", "FR"];
  if (s === "TX") return ["HU", "ST", "FL", "WF", "FR"];
  return ["ST", "FR"];
}

// Class-based secondary modifier defaults (sprinklered, roof, soft-storey, …).
export function defaultModifiers(occKey, constrKey, yearBuilt) {
  if (occKey === "vacant") {
    return { sprinklered: "U", roof_type: "Unknown", roof_age: null,
             soft_storey: "U", basement: "U", ext_wall: "Unknown" };
  }
  if (constrKey === "urm") {
    return { sprinklered: "N", roof_type: "Tile", roof_age: 50,
             soft_storey: (occKey === "civic" || occKey === "office") ? "Y" : "N",
             basement:    (occKey === "civic" || occKey === "office") ? "Y" : "N",
             ext_wall: "Brick" };
  }
  if (occKey === "office") {
    return { sprinklered: "Y", roof_type: "Membrane", roof_age: 12,
             soft_storey: "N", basement: "Y", ext_wall: "Glass" };
  }
  if (occKey === "food_proc") {
    return { sprinklered: "Y", roof_type: "BUR", roof_age: 15,
             soft_storey: "N", basement: "N", ext_wall: "Concrete" };
  }
  if (occKey === "utility") {
    return { sprinklered: "Y", roof_type: "Metal", roof_age: 15,
             soft_storey: "N", basement: "N", ext_wall: "Metal" };
  }
  if (occKey === "light_mfg") {
    return { sprinklered: "Y", roof_type: "Metal", roof_age: 18,
             soft_storey: "N", basement: "N", ext_wall: "Metal" };
  }
  if (occKey === "heavy_mfg") {
    return { sprinklered: "Y", roof_type: "BUR", roof_age: 15,
             soft_storey: "N", basement: "N", ext_wall: "Concrete" };
  }
  if (occKey === "civic") {
    return { sprinklered: "Y", roof_type: "Membrane", roof_age: 20,
             soft_storey: "N", basement: "Y", ext_wall: "Brick" };
  }
  // warehouse and fallthrough
  return { sprinklered: "N", roof_type: "Metal", roof_age: 20,
           soft_storey: "N", basement: "N", ext_wall: "Metal" };
}

// Canonical perils → vendor letter codes.
export const RMS_PERILS  = { HU:"HU", EQ:"EQ", FL:"FL", ST:"ST", WS:"WS", WF:"WF", FR:"FR" };
export const AIR_PERILS  = { HU:"HU", EQ:"EQ", FL:"IF", ST:"SS", WS:"WT", WF:"WF", FR:"FR" };

export function mapPerils(canonical, vendor) {
  const table = vendor === "cede" ? AIR_PERILS : RMS_PERILS;
  return canonical.map((p) => table[p] || p);
}
