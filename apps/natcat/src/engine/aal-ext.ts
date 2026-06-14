// src/engine/aal-ext.ts
//
// Extended AAL engine for the MGA build. Wraps the verified vuln functions and
// adds the new perils + the wildfire single-term refactor, total AAL, and the
// per-peril loss curves needed for the combined occurrence EP curve.
//
//   Curve perils:  AAL = Σ [ TIV × MDR(intensity_i) × ΔP_i ],  ΔP from probability[]
//                  (or 1/return_period[]); tail capped at 1-in-10,000.
//   Wildfire:      AAL = P(severe) × MDR_severe(construction) × TIV   (Bernoulli)

import {
  TC_CAT_TO_MS,
  mmiToPGA,
  EARTHQUAKE_DEFAULT_CLASS,
} from "./vuln-tables";
import { floodMDR, cycloneMDR, earthquakeMDR } from "./vuln-functions";
import { tornadoMDR, hailMDR, wildfireSevereMDR } from "./vuln-functions-ext";
import {
  EF_TO_MPH,
  MPH_TO_MS,
  TORNADO_DEFAULT_CLASS,
  HAIL_DEFAULT_CLASS,
  WILDFIRE_SEVERE_DEFAULT_CLASS,
  yearBuiltFactor,
} from "./vuln-tables-ext";

export const EXT_PERILS = [
  "Flood",
  "FloodLivePlus",
  "TropicalCyclone",
  "Earthquake",
  "USTornado",
  "Wildfire",
  "Hail",
] as const;
export type ExtPerilId = (typeof EXT_PERILS)[number];

export const TAIL_CAP_P = 0.0001; // 1-in-10,000

export interface RawHazardCurveExt {
  peril: ExtPerilId;
  threshold: (number | string)[];
  return_period?: number[]; // years
  probability?: number[]; // annual exceedance prob at each threshold (preferred)
  unit: string;
}

export interface AALInputsExt {
  peril: ExtPerilId;
  /** Damageable TIV — Buildings + Contents + Other (BI handled separately upstream). */
  tiv: number;
  propertyType: "residential" | "commercial" | "industrial";
  region?: string; // flood JRC region
  constructionClass?: string; // EQ / tornado construction override
  cycloneBasin?: string;
  wildfireExposureClass?: string;
  roofClass?: string; // hail
  firstFloorElevationM?: number; // §5a — reduces effective flood depth
  yearBuilt?: number; // §5b — age-of-construction MDR factor (wind/quake)
  rawCurve: RawHazardCurveExt;
}

export interface PerilLossPoint {
  p: number; // annual exceedance probability
  loss: number; // ground-up loss at that probability
}

export interface AALResultExt {
  peril: ExtPerilId;
  aal: number;
  aal_rate: number; // AAL / TIV
  loss_curve: PerilLossPoint[]; // sorted by p descending — feeds combined EP
  is_bernoulli: boolean;
  rp_curve: {
    rp: number;
    intensity_native: number | string;
    intensity_physical: number;
    mdr: number;
    loss: number;
    deltaP: number;
    contribution: number;
  }[];
  mdr_curve: { intensity: number; mdr: number }[];
  intensity_unit_native: string;
  intensity_unit_physical: string;
  poc_disclaimer?: string;
  unsupported?: boolean; // hail while hazard is stubbed
}

const PHYSICAL_UNIT: Record<ExtPerilId, string> = {
  Flood: "m",
  FloodLivePlus: "m",
  TropicalCyclone: "m/s",
  Earthquake: "g (PGA)",
  USTornado: "m/s (gust)",
  Wildfire: "P(severe)",
  Hail: "cm",
};

const POC_DISCLAIMER: Partial<Record<ExtPerilId, string>> = {
  TropicalCyclone:
    "Saffir-Simpson cat → m/s uses band midpoints; replace with native m/s when CERA® exposes it.",
  Earthquake:
    "MMI → PGA via Worden et al. 2012 GMICE. Replace with a direct PGA hazard layer for production.",
  USTornado:
    "EF band → mph → m/s uses operational gust midpoints; convective sigmoid is PoC-grade — flag for calibration.",
  Wildfire:
    "Single-term: P(severe) from CERA® × construction-indexed conditional MDR × footprint attribution. To calibrate.",
  Hail:
    "Hail hazard not yet on the CERA® API (roadmap ~year-end 2026). Roof-driven vulnerability stubbed, low confidence.",
};

// CERA threshold → physical intensity for the vulnerability function.
function toPhysical(peril: ExtPerilId, threshold: number | string): number {
  switch (peril) {
    case "Flood":
    case "FloodLivePlus":
      return Number(threshold);
    case "TropicalCyclone":
      return typeof threshold === "string" && threshold in TC_CAT_TO_MS
        ? TC_CAT_TO_MS[threshold]
        : Number(threshold);
    case "Earthquake":
      if (typeof threshold === "string" && threshold.startsWith("MMI"))
        return mmiToPGA(Number(threshold.slice(3)));
      return mmiToPGA(Number(threshold));
    case "USTornado": {
      const mph =
        typeof threshold === "string" && threshold in EF_TO_MPH
          ? EF_TO_MPH[threshold]
          : Number(threshold);
      return mph * MPH_TO_MS;
    }
    case "Hail":
      return Number(threshold); // cm
    case "Wildfire":
      return NaN; // not a continuous physical axis
  }
}

function mdrFor(
  peril: ExtPerilId,
  intensity: number,
  threshNative: number | string,
  inp: AALInputsExt
): number {
  const yf = yearBuiltFactor(inp.yearBuilt); // §5b age factor (wind/quake)
  switch (peril) {
    case "Flood":
    case "FloodLivePlus": {
      // §5a: first-floor elevation reduces the depth of water that reaches the property.
      const effectiveDepth = Math.max(0, intensity - (inp.firstFloorElevationM ?? 0));
      return floodMDR(effectiveDepth, inp.region ?? "Oceania", inp.propertyType);
    }
    case "TropicalCyclone":
      return Math.min(1, cycloneMDR(intensity, inp.cycloneBasin ?? "Australia") * yf);
    case "Earthquake":
      return Math.min(
        1,
        earthquakeMDR(intensity, inp.constructionClass ?? EARTHQUAKE_DEFAULT_CLASS[inp.propertyType]) * yf
      );
    case "USTornado":
      return Math.min(
        1,
        tornadoMDR(intensity, inp.constructionClass ?? TORNADO_DEFAULT_CLASS[inp.propertyType]) * yf
      );
    case "Hail":
      return hailMDR(intensity, inp.roofClass ?? HAIL_DEFAULT_CLASS[inp.propertyType]);
    case "Wildfire":
      return 0; // handled by the single-term path
  }
}

// Exceedance probability at threshold i — prefer probability[], else 1/RP.
function probAt(curve: RawHazardCurveExt, i: number): number {
  if (curve.probability && curve.probability[i] != null) return curve.probability[i];
  if (curve.return_period && curve.return_period[i] != null)
    return 1 / curve.return_period[i];
  return 0;
}
function rpAt(curve: RawHazardCurveExt, i: number): number {
  if (curve.return_period && curve.return_period[i] != null) return curve.return_period[i];
  const p = probAt(curve, i);
  return p > 0 ? 1 / p : Infinity;
}

export function computeAALExt(inp: AALInputsExt): AALResultExt {
  const { peril, tiv, rawCurve } = inp;

  // ── Wildfire single-term (Bernoulli large-loss) ──────────────────────────
  if (peril === "Wildfire") {
    const pSevere = probAt(rawCurve, 0);
    const exposureClass =
      inp.wildfireExposureClass ?? WILDFIRE_SEVERE_DEFAULT_CLASS[inp.propertyType];
    const mdr = wildfireSevereMDR(exposureClass);
    const loss = tiv * mdr;
    const aal = pSevere * loss;
    return {
      peril,
      aal,
      aal_rate: aal / tiv,
      loss_curve: [{ p: pSevere, loss }],
      is_bernoulli: true,
      rp_curve: [
        {
          rp: pSevere > 0 ? 1 / pSevere : Infinity,
          intensity_native: "Severe",
          intensity_physical: NaN,
          mdr,
          loss,
          deltaP: pSevere,
          contribution: aal,
        },
      ],
      mdr_curve: [],
      intensity_unit_native: rawCurve.unit,
      intensity_unit_physical: PHYSICAL_UNIT[peril],
      poc_disclaimer: POC_DISCLAIMER[peril],
    };
  }

  // ── Hail while hazard stubbed → unsupported (forward-ready slot) ──────────
  if (peril === "Hail" && (!rawCurve.threshold || rawCurve.threshold.length === 0)) {
    return {
      peril,
      aal: 0,
      aal_rate: 0,
      loss_curve: [],
      is_bernoulli: false,
      rp_curve: [],
      mdr_curve: [],
      intensity_unit_native: rawCurve.unit,
      intensity_unit_physical: PHYSICAL_UNIT[peril],
      poc_disclaimer: POC_DISCLAIMER[peril],
      unsupported: true,
    };
  }

  // ── Curve perils ─────────────────────────────────────────────────────────
  const n = rawCurve.threshold.length;
  const rows: AALResultExt["rp_curve"] = [];
  const lossCurve: PerilLossPoint[] = [];
  for (let i = 0; i < n; i++) {
    const threshNative = rawCurve.threshold[i];
    const intensity = toPhysical(peril, threshNative);
    const mdr = mdrFor(peril, intensity, threshNative, inp);
    const Pi = probAt(rawCurve, i);
    const Pnext = i + 1 < n ? probAt(rawCurve, i + 1) : TAIL_CAP_P;
    const deltaP = Math.max(0, Pi - Pnext);
    const loss = tiv * mdr;
    const contribution = loss * deltaP;
    rows.push({
      rp: rpAt(rawCurve, i),
      intensity_native: threshNative,
      intensity_physical: intensity,
      mdr,
      loss,
      deltaP,
      contribution,
    });
    lossCurve.push({ p: Pi, loss });
  }
  const aal = rows.reduce((s, r) => s + r.contribution, 0);
  lossCurve.sort((a, b) => b.p - a.p);

  return {
    peril,
    aal,
    aal_rate: aal / tiv,
    loss_curve: lossCurve,
    is_bernoulli: false,
    rp_curve: rows,
    mdr_curve: sampleMdrCurve(peril, inp),
    intensity_unit_native: rawCurve.unit,
    intensity_unit_physical: PHYSICAL_UNIT[peril],
    poc_disclaimer: POC_DISCLAIMER[peril],
  };
}

// Smooth MDR(intensity) curve for the UI, over a sensible physical range.
function sampleMdrCurve(
  peril: ExtPerilId,
  inp: AALInputsExt
): { intensity: number; mdr: number }[] {
  const ranges: Partial<Record<ExtPerilId, [number, number, number]>> = {
    Flood: [0, 6, 0.25],
    FloodLivePlus: [0, 6, 0.25],
    TropicalCyclone: [25.7, 80, 2.5],
    Earthquake: [0.01, 1.0, 0.05],
    USTornado: [20, 95, 2.5],
    Hail: [1, 8, 0.25],
  };
  const r = ranges[peril];
  if (!r) return [];
  const [lo, hi, step] = r;
  const out: { intensity: number; mdr: number }[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) {
    out.push({ intensity: Number(v.toFixed(4)), mdr: mdrFor(peril, v, v, inp) });
  }
  return out;
}

/** Total NatCat AAL = exact sum of per-peril AALs. */
export function totalAAL(results: AALResultExt[]): number {
  return results.reduce((s, r) => s + r.aal, 0);
}
