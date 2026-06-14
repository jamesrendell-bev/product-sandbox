// src/engine/confidence.ts
//
// Confidence = data-completeness × per-peril CERA® reliability.
// Per peril and overall. Low confidence drives the "refer" nudge and suppresses
// the capital number (Build Spec §5, §8). This is the explicit mechanism for
// "confident scores at varying levels of information".

import type { ExtPerilId } from "./aal-ext";

// CERA® per-peril reliability (0..1). Wildfire lower (single threshold +
// footprint assumption); Hail lowest (hazard stubbed, roof science thin).
export const PERIL_RELIABILITY: Record<ExtPerilId, number> = {
  FloodLivePlus: 0.95,
  Flood: 0.9,
  TropicalCyclone: 0.92,
  Earthquake: 0.9,
  USTornado: 0.82,
  Wildfire: 0.6,
  Hail: 0.3,
};

export interface DataFields {
  hasLocation: boolean; // geocode / address
  hasTIV: boolean;
  hasOccupancy: boolean;
  hasConstruction?: boolean;
  hasYearBuilt?: boolean;
  hasRoof?: boolean;
  hasElevation?: boolean;
  hasSecondaryModifiers?: boolean;
}

// Field weights → data completeness in [0, 1].
const WEIGHTS = {
  base: 0.5, // location + TIV + broad occupancy (tier 0)
  construction: 0.15,
  yearBuilt: 0.1,
  roof: 0.1,
  elevation: 0.08,
  secondaryModifiers: 0.07,
};

export function dataCompleteness(f: DataFields): number {
  if (!f.hasLocation || !f.hasTIV) return Math.max(0, (f.hasLocation ? 0.15 : 0) + (f.hasTIV ? 0.15 : 0));
  let c = f.hasOccupancy ? WEIGHTS.base : WEIGHTS.base - 0.1;
  if (f.hasConstruction) c += WEIGHTS.construction;
  if (f.hasYearBuilt) c += WEIGHTS.yearBuilt;
  if (f.hasRoof) c += WEIGHTS.roof;
  if (f.hasElevation) c += WEIGHTS.elevation;
  if (f.hasSecondaryModifiers) c += WEIGHTS.secondaryModifiers;
  return Math.max(0, Math.min(1, c));
}

export type ConfidenceBand = "High" | "Medium" | "Low";
export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 0.65) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export interface PerilConfidence {
  peril: ExtPerilId;
  score: number;
  band: ConfidenceBand;
  reliability: number;
}

export function perilConfidence(peril: ExtPerilId, completeness: number): PerilConfidence {
  const reliability = PERIL_RELIABILITY[peril] ?? 0.5;
  const score = completeness * reliability;
  return { peril, score, band: confidenceBand(score), reliability };
}

export interface OverallConfidence {
  score: number;
  band: ConfidenceBand;
  completeness: number;
}

/**
 * Overall confidence = completeness × AAL-weighted mean peril reliability.
 * Weighting by AAL share focuses confidence on the perils that actually drive
 * the loss; falls back to equal weights when AAL is zero.
 */
export function overallConfidence(
  completeness: number,
  perilAAL: { peril: ExtPerilId; aal: number }[]
): OverallConfidence {
  const total = perilAAL.reduce((s, p) => s + p.aal, 0);
  let meanRel: number;
  if (total > 0) {
    meanRel = perilAAL.reduce(
      (s, p) => s + (PERIL_RELIABILITY[p.peril] ?? 0.5) * (p.aal / total),
      0
    );
  } else if (perilAAL.length) {
    meanRel =
      perilAAL.reduce((s, p) => s + (PERIL_RELIABILITY[p.peril] ?? 0.5), 0) /
      perilAAL.length;
  } else {
    meanRel = 0.5;
  }
  const score = completeness * meanRel;
  return { score, band: confidenceBand(score), completeness };
}
