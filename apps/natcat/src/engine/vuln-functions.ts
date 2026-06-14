// src/engine/vuln-functions.ts
//
// The four MDR(intensity) functions, ported from the FLOOD / WILDFIRE /
// TROPICAL CYCLONE / EARTHQUAKE sheets of BEV_AAL_Calculator_v2.xlsx.
// Each returns a value in [0, 1].

import {
  FLOOD_DEPTHS_M, FLOOD_MDR,
  WILDFIRE_PARAMS, CYCLONE_PARAMS, EARTHQUAKE_PARAMS,
} from "./vuln-tables";

// Lognormal CDF — needed for the GEM earthquake fragility curve (Excel: NORMSDIST).
// Uses Abramowitz & Stegun 7.1.26 erf approximation; max error ~1.5e-7.
function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

// FLOOD — piecewise-linear interpolation on JRC depth-damage table.
// Excel: FORECAST() across the two bracketing nodes.
export function floodMDR(depth_m: number, region: string, occupancy: string): number {
  if (depth_m <= 0) return 0;
  const key = `${region}_${occupancy.charAt(0).toUpperCase() + occupancy.slice(1)}`;
  const curve = FLOOD_MDR[key] ?? FLOOD_MDR[`Global Default_${occupancy.charAt(0).toUpperCase() + occupancy.slice(1)}`];
  if (!curve) return 0;
  const xs = FLOOD_DEPTHS_M;
  if (depth_m >= xs[xs.length - 1]) return 1; // tail capped at 100% above max node
  for (let i = 0; i < xs.length - 1; i++) {
    if (depth_m >= xs[i] && depth_m <= xs[i + 1]) {
      const t = (depth_m - xs[i]) / (xs[i + 1] - xs[i]);
      const mdr = curve[i] + t * (curve[i + 1] - curve[i]);
      return Math.max(0, Math.min(1, mdr));
    }
  }
  return 0;
}

// WILDFIRE — Emanuel sigmoid on Fire Line Intensity (kW/m).
export function wildfireMDR(fli_kwm: number, wildfireClass: string): number {
  const p = WILDFIRE_PARAMS[wildfireClass];
  if (!p || fli_kwm <= p.i_thresh) return 0;
  const x = (fli_kwm - p.i_thresh) / p.i_half;
  const x3 = x * x * x;
  return Math.max(0, Math.min(1, x3 / (1 + x3)));
}

// TROPICAL CYCLONE — Emanuel/Eberenz sigmoid on max sustained wind (m/s).
export function cycloneMDR(wind_ms: number, basin: string): number {
  const p = CYCLONE_PARAMS[basin] ?? CYCLONE_PARAMS["Global Default"];
  if (wind_ms <= p.v_thresh) return 0;
  const dv = wind_ms - p.v_thresh;
  const dv3 = dv * dv * dv;
  const vh3 = p.v_half ** 3;
  return Math.max(0, Math.min(1, dv3 / (vh3 + dv3)));
}

// EARTHQUAKE — GEM lognormal CDF on PGA (g).
export function earthquakeMDR(pga_g: number, constructionClass: string): number {
  const p = EARTHQUAKE_PARAMS[constructionClass];
  if (!p || pga_g <= 0) return 0;
  const z = Math.log(pga_g / p.theta) / p.beta;
  return Math.max(0, Math.min(1, p.peak * normalCDF(z)));
}
