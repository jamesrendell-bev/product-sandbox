// src/engine/vuln-tables-ext.ts
//
// EXTENSION tables — additive to the verified vuln-tables.ts (which is left
// untouched). New perils for the MGA build: US Tornado, the wildfire single-term
// refactor, and a forward-ready Hail slot.
//
// All conversions here are PoC-grade and centralised so the science team can
// recalibrate in one place (see Build Instructions §10).

// ─── US TORNADO ──────────────────────────────────────────────────────────────
// CERA returns Enhanced-Fujita bands EF0–EF4. We map each band to a
// representative 3-second-gust wind speed (mph → m/s), then feed a convective
// -wind sigmoid (same shape as the TC Emanuel/Eberenz curve, own threshold/half).
//
// EF→mph uses band midpoints of the operational EF gust ranges. FLAGGED PoC-grade.
export const EF_TO_MPH: Record<string, number> = {
  EF0: 74, // 65–85
  EF1: 96, // 86–110
  EF2: 124, // 111–135
  EF3: 153, // 136–165
  EF4: 184, // 166–200
  EF5: 220, // >200
};
export const MPH_TO_MS = 0.44704;

// Convective-wind sigmoid params by construction class.
// MDR = (V - v_thresh)^3 / (v_half^3 + (V - v_thresh)^3), V in m/s.
// Tornado damage onsets earlier and rises faster than synoptic TC wind for a
// given speed (debris + pressure), so thresholds are lower than the TC curve.
export interface TornadoParams {
  v_half: number;
  v_thresh: number;
}
export const TORNADO_PARAMS: Record<string, TornadoParams> = {
  Timber: { v_thresh: 22, v_half: 34 },
  Masonry: { v_thresh: 26, v_half: 42 },
  Concrete: { v_thresh: 30, v_half: 52 },
  Steel: { v_thresh: 30, v_half: 50 },
  "Default Residential": { v_thresh: 22, v_half: 36 },
  "Default Commercial": { v_thresh: 27, v_half: 46 },
  "Default Industrial": { v_thresh: 29, v_half: 50 },
};
export const TORNADO_DEFAULT_CLASS: Record<string, string> = {
  residential: "Default Residential",
  commercial: "Default Commercial",
  industrial: "Default Industrial",
};

// ─── WILDFIRE — single-term refactor ─────────────────────────────────────────
// CERA wildfire is a single "Severe" occurrence probability, NOT a curve.
//   AAL = P(severe/yr) × MDR_severe(construction) × TIV
// MDR_severe = P(property in burn footprint | severe fire) × damage-if-burned.
// We express it as: footprint-attribution factor × construction damage-if-burned.
export const WILDFIRE_FOOTPRINT_ATTRIBUTION = 0.55; // P(in footprint | severe) — PoC

// Damage-if-burned by construction/exposure class (conditional on being in footprint).
export const WILDFIRE_DAMAGE_IF_BURNED: Record<string, number> = {
  "Timber / WUI": 0.95,
  "Timber — standard": 0.85,
  Masonry: 0.55,
  "Non-combustible": 0.4,
  "Ember-resistant / defended": 0.3,
};
// Map the generic occupancy/construction to a wildfire exposure class.
export const WILDFIRE_SEVERE_DEFAULT_CLASS: Record<string, string> = {
  residential: "Timber — standard",
  commercial: "Masonry",
  industrial: "Non-combustible",
};

// ─── HAIL (forward-ready stub) ───────────────────────────────────────────────
// Severity = hailstone diameter (cm). Roof-driven vulnerability is the least
// served by public science → low default confidence + to-calibrate flag.
// Hazard is stubbed until the model ships (~year-end 2026).
export interface HailParams {
  d_thresh: number; // cm — no damage below
  d_half: number; // cm above threshold at which MDR = 0.5
  cap: number; // max MDR (roofs rarely total-loss from hail alone)
}
export const HAIL_PARAMS: Record<string, HailParams> = {
  "Asphalt shingle": { d_thresh: 2.0, d_half: 3.5, cap: 0.45 },
  "Tile / slate": { d_thresh: 2.5, d_half: 4.0, cap: 0.35 },
  "Metal standing-seam": { d_thresh: 3.0, d_half: 5.0, cap: 0.25 },
  "Membrane / flat": { d_thresh: 2.5, d_half: 4.5, cap: 0.4 },
  "Default roof": { d_thresh: 2.5, d_half: 4.0, cap: 0.4 },
};
export const HAIL_DEFAULT_CLASS: Record<string, string> = {
  residential: "Asphalt shingle",
  commercial: "Membrane / flat",
  industrial: "Metal standing-seam",
};

// ─── YEAR-BUILT FACTOR (§5b) ─────────────────────────────────────────────────
// Age-of-construction multiplier on MDR for wind/quake perils (older stock is
// more vulnerable; modern codes less so). MDR is capped at 1 by the caller.
// PoC-grade — recalibrate with the science team.
//   pre-1980 ×1.25 · 1980–1999 ×1.10 · 2000–2010 ×1.00 · post-2010 ×0.90
export function yearBuiltFactor(year?: number): number {
  if (year == null || !isFinite(year)) return 1.0;
  if (year < 1980) return 1.25;
  if (year < 2000) return 1.1;
  if (year <= 2010) return 1.0;
  return 0.9;
}
