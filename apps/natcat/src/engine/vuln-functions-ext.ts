// src/engine/vuln-functions-ext.ts
//
// MDR(intensity) functions for the EXTENSION perils. Additive to the verified
// vuln-functions.ts. Each returns a value in [0, 1].

import {
  TORNADO_PARAMS,
  HAIL_PARAMS,
  WILDFIRE_FOOTPRINT_ATTRIBUTION,
  WILDFIRE_DAMAGE_IF_BURNED,
} from "./vuln-tables-ext";

// US TORNADO — convective-wind sigmoid on 3-sec gust (m/s).
export function tornadoMDR(wind_ms: number, constructionClass: string): number {
  const p = TORNADO_PARAMS[constructionClass] ?? TORNADO_PARAMS["Default Residential"];
  if (wind_ms <= p.v_thresh) return 0;
  const dv = wind_ms - p.v_thresh;
  const dv3 = dv * dv * dv;
  const vh3 = p.v_half ** 3;
  return Math.max(0, Math.min(1, dv3 / (vh3 + dv3)));
}

// WILDFIRE (single-term) — conditional mean damage GIVEN a severe fire.
// MDR_severe = footprint-attribution × damage-if-burned(construction).
// Construction matters at the vulnerability step, not the hazard step.
export function wildfireSevereMDR(exposureClass: string): number {
  const dib =
    WILDFIRE_DAMAGE_IF_BURNED[exposureClass] ??
    WILDFIRE_DAMAGE_IF_BURNED["Timber — standard"];
  return Math.max(0, Math.min(1, WILDFIRE_FOOTPRINT_ATTRIBUTION * dib));
}

// HAIL (forward-ready stub) — roof-driven sigmoid on hailstone diameter (cm).
// Low confidence; hazard stubbed until the model ships.
export function hailMDR(diameter_cm: number, roofClass: string): number {
  const p = HAIL_PARAMS[roofClass] ?? HAIL_PARAMS["Default roof"];
  if (diameter_cm <= p.d_thresh) return 0;
  const d = diameter_cm - p.d_thresh;
  const d2 = d * d;
  const h2 = p.d_half ** 2;
  const s = d2 / (h2 + d2); // 0..1 sigmoid
  return Math.max(0, Math.min(1, p.cap * s));
}

