// src/engine/vuln-tables.ts
//
// Direct port of the VULN_TABLES sheet from BEV_AAL_Calculator_v2.xlsx.
// Sources cited in BEV_AAL_Engine_Paper_v2.docx (April 2026, v1.0):
//   • JRC Huizinga et al. (2017)   — flood depth-damage curves
//   • Emanuel (2011)                — wildfire and tropical cyclone sigmoids
//   • Eberenz et al. (2021)         — TC regional V_half calibration
//   • GEM Global Vulnerability Model (2023) / Martins & Silva (2020)  — earthquake fragility

// ─── FLOOD ────────────────────────────────────────────────────────────────────
// JRC depth-damage curves: depth (m) → MDR by region × occupancy.
// Depth nodes are shared across all curves.
export const FLOOD_DEPTHS_M = [0, 0.5, 1, 1.5, 2, 3, 4, 6] as const;

// MDR rows aligned to FLOOD_DEPTHS_M; columns indexed by `${region}_${occupancy}`.
// Values copied verbatim from VULN_TABLES rows 5-12.
export const FLOOD_MDR: Record<string, number[]> = {
  Europe_Residential:        [0,    0.25, 0.40, 0.55, 0.65, 0.80, 0.90, 1.0],
  Europe_Commercial:         [0,    0.15, 0.27, 0.40, 0.52, 0.68, 0.82, 1.0],
  Europe_Industrial:         [0,    0.15, 0.27, 0.40, 0.52, 0.68, 0.82, 1.0],
  "North America_Residential":[0.06,0.20, 0.38, 0.52, 0.62, 0.78, 0.88, 1.0],
  "North America_Commercial": [0.02,0.12, 0.25, 0.38, 0.50, 0.65, 0.80, 1.0],
  "North America_Industrial": [0.02,0.12, 0.25, 0.38, 0.50, 0.65, 0.80, 1.0],
  Asia_Residential:          [0,    0.20, 0.38, 0.54, 0.65, 0.80, 0.90, 1.0],
  Asia_Commercial:           [0,    0.12, 0.25, 0.38, 0.50, 0.65, 0.80, 1.0],
  Asia_Industrial:           [0,    0.12, 0.25, 0.38, 0.50, 0.65, 0.80, 1.0],
  "South America_Residential":[0,   0.22, 0.40, 0.55, 0.66, 0.80, 0.90, 1.0],
  "South America_Commercial": [0,   0.14, 0.28, 0.41, 0.52, 0.68, 0.82, 1.0],
  "South America_Industrial": [0,   0.14, 0.28, 0.41, 0.52, 0.68, 0.82, 1.0],
  Africa_Residential:        [0,    0.18, 0.35, 0.50, 0.62, 0.78, 0.89, 1.0],
  Africa_Commercial:         [0,    0.10, 0.22, 0.35, 0.47, 0.62, 0.78, 1.0],
  Africa_Industrial:         [0,    0.10, 0.22, 0.35, 0.47, 0.62, 0.78, 1.0],
  Oceania_Residential:       [0,    0.22, 0.40, 0.56, 0.67, 0.81, 0.91, 1.0],
  Oceania_Commercial:        [0,    0.14, 0.28, 0.42, 0.53, 0.69, 0.83, 1.0],
  Oceania_Industrial:        [0,    0.14, 0.28, 0.42, 0.53, 0.69, 0.83, 1.0],
  "Global Default_Residential":[0,  0.22, 0.40, 0.55, 0.65, 0.80, 0.90, 1.0],
  "Global Default_Commercial": [0,  0.13, 0.26, 0.39, 0.51, 0.66, 0.81, 1.0],
  "Global Default_Industrial": [0,  0.13, 0.26, 0.39, 0.51, 0.66, 0.81, 1.0],
};

export const FLOOD_REGIONS = [
  "Europe", "North America", "Asia", "South America", "Africa", "Oceania", "Global Default",
] as const;

// ─── WILDFIRE — Emanuel (2011) sigmoid parameters ────────────────────────────
// MDR(I) = ((I-I_thresh)/I_half)^3 / (1 + ((I-I_thresh)/I_half)^3)
export interface WildfireParams { i_thresh: number; i_half: number; }
export const WILDFIRE_PARAMS: Record<string, WildfireParams> = {
  "Residential — Default": { i_thresh: 200, i_half: 2000 },
  "Residential — Timber":  { i_thresh: 200, i_half: 1500 },
  "Residential — Masonry": { i_thresh: 200, i_half: 2500 },
  "Commercial — Default":  { i_thresh: 300, i_half: 4000 },
  "Industrial — Default":  { i_thresh: 300, i_half: 5000 },
};

// Mapping from {residential,commercial,industrial} → default wildfire class
export const WILDFIRE_DEFAULT_CLASS: Record<string, string> = {
  residential: "Residential — Default",
  commercial:  "Commercial — Default",
  industrial:  "Industrial — Default",
};

// ─── TROPICAL CYCLONE — Eberenz et al. (2021) regional calibration ───────────
// MDR = (V - V_thresh)^3 / (V_half^3 + (V - V_thresh)^3)   for V > V_thresh
export interface CycloneParams { v_half: number; v_thresh: number; }
export const CYCLONE_PARAMS: Record<string, CycloneParams> = {
  "North Atlantic":  { v_half: 74.7, v_thresh: 25.7 },
  "Eastern Pacific": { v_half: 74.7, v_thresh: 25.7 },
  "Western Pacific": { v_half: 54.8, v_thresh: 25.7 },
  "North Indian":    { v_half: 49.0, v_thresh: 25.7 },
  "South Indian":    { v_half: 58.0, v_thresh: 25.7 },
  "South Pacific":   { v_half: 74.7, v_thresh: 25.7 },
  "Australia":       { v_half: 74.7, v_thresh: 25.7 },
  "Global Default":  { v_half: 65.0, v_thresh: 25.7 },
};
export const CYCLONE_BASINS = Object.keys(CYCLONE_PARAMS);

// ─── EARTHQUAKE — GEM (2023) lognormal fragility parameters ──────────────────
// MDR(PGA) = peak * Φ[ ln(PGA / θ) / β ]
export interface EarthquakeParams { theta: number; beta: number; peak: number; }
export const EARTHQUAKE_PARAMS: Record<string, EarthquakeParams> = {
  "Default Residential":  { theta: 0.20, beta: 0.65, peak: 0.90 },
  "Default Commercial":   { theta: 0.35, beta: 0.65, peak: 0.85 },
  "Default Industrial":   { theta: 0.40, beta: 0.65, peak: 0.80 },
  "Masonry Unreinforced": { theta: 0.15, beta: 0.60, peak: 0.95 },
  "Masonry Confined":     { theta: 0.25, beta: 0.60, peak: 0.90 },
  "Concrete Non-Ductile": { theta: 0.20, beta: 0.65, peak: 0.90 },
  "Concrete Ductile":     { theta: 0.45, beta: 0.65, peak: 0.80 },
  "Steel":                { theta: 0.60, beta: 0.65, peak: 0.75 },
  "Timber":               { theta: 0.35, beta: 0.70, peak: 0.85 },
  "Adobe":                { theta: 0.08, beta: 0.55, peak: 1.00 },
};
export const EARTHQUAKE_DEFAULT_CLASS: Record<string, string> = {
  residential: "Default Residential",
  commercial:  "Default Commercial",
  industrial:  "Default Industrial",
};

// ─── HAZARD-API → VULN-MODEL UNIT CONVERSIONS ────────────────────────────────
// CERA returns operational/categorical intensities; the vulnerability functions
// expect physical units. Mappings below are PoC-grade and to be calibrated.

// Saffir-Simpson Category → max sustained wind in m/s (band midpoints)
export const TC_CAT_TO_MS: Record<string, number> = {
  CAT0: 18, CAT1: 33, CAT2: 43, CAT3: 50, CAT4: 58, CAT5: 70,
};

// Modified Mercalli Intensity → PGA in g.
// USGS ShakeMap instrumental-intensity bands (Wald et al.): PGA midpoint per
// integer MMI, log-interpolated between levels. The earlier single-branch GMICE
// under-predicted PGA at high MMI (MMI 9 came out ~0.10g), which collapsed the
// earthquake fragility curve to near zero. PoC-grade, calibrate for production.
const MMI_PGA_G: Record<number, number> = {
  3: 0.005, 4: 0.025, 5: 0.06, 6: 0.13, 7: 0.25, 8: 0.47, 9: 0.9, 10: 1.4,
};
export function mmiToPGA(mmi: number): number {
  if (mmi <= 3) return MMI_PGA_G[3];
  if (mmi >= 10) return MMI_PGA_G[10];
  const lo = Math.floor(mmi);
  const hi = Math.ceil(mmi);
  if (lo === hi) return MMI_PGA_G[lo];
  // Log-linear interpolation between the bracketing integer MMI levels.
  const a = Math.log(MMI_PGA_G[lo]);
  const b = Math.log(MMI_PGA_G[hi]);
  return Math.exp(a + (b - a) * (mmi - lo));
}
export const MMI_LEVELS = [3, 4, 5, 6, 7, 8, 9] as const;

// Wildfire severity band → fire-line intensity (kW/m). PoC-grade pragmatic mapping.
export const WILDFIRE_SEVERITY_TO_KWM: Record<string, number> = {
  Low:      200,
  Moderate: 1500,
  Severe:   4000,
  Extreme:  10000,
};
