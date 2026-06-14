// src/engine/aal.ts
//
// AAL = Σ [ TIV × MDR(intensity_i) × ΔP_i ]
// where ΔP_i = (1/RP_i) − (1/RP_{i+1}); tail capped at 1-in-10,000 yr.
// (See METHODOLOGY sheet & §2.2 of BEV_AAL_Engine_Paper_v2.docx.)

import {
  floodMDR, wildfireMDR, cycloneMDR, earthquakeMDR,
} from "./vuln-functions";
import {
  TC_CAT_TO_MS, mmiToPGA, WILDFIRE_SEVERITY_TO_KWM,
  WILDFIRE_DEFAULT_CLASS, EARTHQUAKE_DEFAULT_CLASS,
} from "./vuln-tables";

export const PERILS = ["Flood", "TropicalCyclone", "Wildfire", "Earthquake"] as const;
export type PerilId = (typeof PERILS)[number];

export interface RawHazardCurve {
  peril: PerilId;
  threshold: (number | string)[];   // intensity values (or category strings)
  return_period: number[];          // years
  unit: string;                     // "m", "CAT", "MMI", "Severity"
}

export interface AALInputs {
  peril: PerilId;
  tiv: number;
  propertyType: "residential" | "commercial" | "industrial";
  region?: string;             // flood JRC region
  constructionClass?: string;  // earthquake construction class override
  cycloneBasin?: string;       // TC basin override
  wildfireClass?: string;      // wildfire occupancy/construction override
  rawCurve: RawHazardCurve;
}

export interface AALResult {
  peril: PerilId;
  aal: number;
  aal_rate: number;
  // diagnostic curves so the UI can show *why*:
  rp_curve: { rp: number; intensity_native: number | string; intensity_physical: number; mdr: number; loss: number; deltaP: number; contribution: number; }[];
  mdr_curve: { intensity: number; mdr: number }[];
  intensity_unit_native: string;
  intensity_unit_physical: string;
  poc_disclaimer?: string;
}

// Convert a CERA threshold value into the physical units expected by the
// vulnerability function. Returns NaN if the conversion is unknown.
function toPhysicalIntensity(peril: PerilId, threshold: number | string): number {
  if (peril === "Flood") return Number(threshold);
  if (peril === "TropicalCyclone") {
    if (typeof threshold === "string" && threshold in TC_CAT_TO_MS) return TC_CAT_TO_MS[threshold];
    return Number(threshold); // numeric m/s if API returns it directly
  }
  if (peril === "Earthquake") {
    if (typeof threshold === "string" && threshold.startsWith("MMI")) {
      return mmiToPGA(Number(threshold.slice(3)));
    }
    return mmiToPGA(Number(threshold));
  }
  if (peril === "Wildfire") {
    if (typeof threshold === "string" && threshold in WILDFIRE_SEVERITY_TO_KWM) {
      return WILDFIRE_SEVERITY_TO_KWM[threshold];
    }
    return Number(threshold);
  }
  return NaN;
}

function mdrFor(peril: PerilId, intensity: number, opts: AALInputs): number {
  switch (peril) {
    case "Flood":
      return floodMDR(intensity, opts.region ?? "Oceania", opts.propertyType);
    case "TropicalCyclone":
      return cycloneMDR(intensity, opts.cycloneBasin ?? "Australia");
    case "Earthquake":
      return earthquakeMDR(intensity, opts.constructionClass ?? EARTHQUAKE_DEFAULT_CLASS[opts.propertyType]);
    case "Wildfire":
      return wildfireMDR(intensity, opts.wildfireClass ?? WILDFIRE_DEFAULT_CLASS[opts.propertyType]);
  }
}

const PHYSICAL_UNIT: Record<PerilId, string> = {
  Flood: "m",
  TropicalCyclone: "m/s",
  Earthquake: "g (PGA)",
  Wildfire: "kW/m (FLI)",
};

const POC_DISCLAIMER: Partial<Record<PerilId, string>> = {
  TropicalCyclone: "Saffir-Simpson cat → m/s mapping uses band midpoints; replace with native m/s when CERA exposes it.",
  Earthquake:      "MMI → PGA via Worden et al. 2012 GMICE. Replace with direct PGA hazard layer for production.",
  Wildfire:        "Severity band → kW/m fire-line intensity is a pragmatic PoC mapping. Methodology paper §4.1 flags this for calibration.",
};

export function computeAAL(inputs: AALInputs): AALResult {
  const { peril, tiv, rawCurve } = inputs;
  const n = rawCurve.threshold.length;

  // Build the per-RP loss table
  const rows = [];
  for (let i = 0; i < n; i++) {
    const threshNative = rawCurve.threshold[i];
    const intensity = toPhysicalIntensity(peril, threshNative);
    const mdr = mdrFor(peril, intensity, inputs);
    const rp = rawCurve.return_period[i];
    const Pi = 1 / rp;
    const Pnext = i + 1 < n ? 1 / rawCurve.return_period[i + 1] : 0.0001; // tail cap at 1-in-10,000
    const deltaP = Math.max(0, Pi - Pnext);
    const loss = tiv * mdr;
    const contribution = loss * deltaP;
    rows.push({
      rp, intensity_native: threshNative, intensity_physical: intensity,
      mdr, loss, deltaP, contribution,
    });
  }
  const aal = rows.reduce((s, r) => s + r.contribution, 0);

  // MDR curve sample (independent of CERA — for visualisation)
  const mdrCurve = sampleMdrCurve(peril, inputs);

  return {
    peril,
    aal,
    aal_rate: aal / tiv,
    rp_curve: rows,
    mdr_curve: mdrCurve,
    intensity_unit_native: rawCurve.unit,
    intensity_unit_physical: PHYSICAL_UNIT[peril],
    poc_disclaimer: POC_DISCLAIMER[peril],
  };
}

// Render a smooth MDR(intensity) curve over a sensible range so the UI can plot it.
function sampleMdrCurve(peril: PerilId, opts: AALInputs): { intensity: number; mdr: number }[] {
  const ranges: Record<PerilId, [number, number, number]> = {
    Flood:           [0,    6,     0.25],
    TropicalCyclone: [25.7, 80,    2.5],
    Earthquake:      [0.01, 1.0,   0.05],
    Wildfire:        [200,  10000, 250],
  };
  const [lo, hi, step] = ranges[peril];
  const out = [];
  for (let v = lo; v <= hi + 1e-9; v += step) {
    out.push({ intensity: Number(v.toFixed(4)), mdr: mdrFor(peril, v, opts) });
  }
  return out;
}
