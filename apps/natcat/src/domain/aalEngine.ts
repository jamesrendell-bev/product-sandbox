// src/domain/aalEngine.ts
//
// Orchestrates per-peril AAL, total AAL, the combined occurrence EP curve, and
// confidence for one risk. Wraps the /engine modules; applies MDR to damageable
// TIV (Buildings+Contents+Other) and keeps BI (split D) separate.

import {
  computeAALExt,
  totalAAL as sumAAL,
  type AALInputsExt,
  type AALResultExt,
  type ExtPerilId,
  type PerilLossPoint,
} from "../engine/aal-ext";
import { sampleCombinedEP } from "../engine/combined-ep";
import {
  dataCompleteness,
  overallConfidence,
  perilConfidence,
  type OverallConfidence,
  type PerilConfidence,
} from "../engine/confidence";
import type { HazardBundleExt } from "../engine/cera-client-ext";
import { section2AAL } from "./bi";
import type { MarketProfile } from "./marketProfiles";
import {
  constructionById,
  damageableTIV,
  dataFieldsOf,
  totalTIV,
  tierOf,
  type Submission,
  type Tier,
} from "./inputModel";

export interface PerilAssessment {
  peril: ExtPerilId;
  result: AALResultExt;
  confidence: PerilConfidence;
  s1: number; // Section 1 — Material Damage AAL
  s2: number; // Section 2 — Business Interruption AAL
}

export interface Assessment {
  perils: PerilAssessment[];
  damageableTIV: number;
  biTIV: number;
  totalTIV: number;
  section1AAL: number; // Material Damage (terms apply here)
  section2AAL: number; // Business Interruption (added at pricing)
  totalAAL: number; // = section1AAL + section2AAL
  aalRate: number; // total AAL / total TIV
  curves: PerilLossPoint[][]; // Section-1 loss curves — for combined EP / terms / pricing
  combinedEP: { rp: number; loss: number }[];
  confidence: OverallConfidence;
  completeness: number;
  tier: Tier;
  resolvedLat: number;
  resolvedLng: number;
  failed: HazardBundleExt["failed"];
}

function buildInputs(
  peril: ExtPerilId,
  s: Submission,
  profile: MarketProfile,
  dmgTIV: number,
  bundle: HazardBundleExt
): AALInputsExt | null {
  const raw = bundle.results.find((r) => r.peril === peril);
  if (!raw) return null;
  const con = constructionById(s.constructionId);
  const inp: AALInputsExt = {
    peril,
    tiv: dmgTIV,
    propertyType: s.occupancy,
    region: profile.defaultFloodRegion,
    cycloneBasin: profile.cycloneBasin,
    firstFloorElevationM: s.firstFloorElevationM, // §5a
    yearBuilt: s.yearBuilt, // §5b
    rawCurve: raw,
  };
  // Peril-specific construction mapping (EQ ≠ tornado ≠ wildfire class keys).
  if (con) {
    if (peril === "Earthquake") inp.constructionClass = con.eqClass;
    if (peril === "USTornado") inp.constructionClass = con.tornadoClass;
    if (peril === "Wildfire") inp.wildfireExposureClass = con.wildfireClass;
  }
  if (peril === "Hail" && s.roofClass) inp.roofClass = s.roofClass;
  return inp;
}

export function assessRisk(
  s: Submission,
  profile: MarketProfile,
  bundle: HazardBundleExt
): Assessment {
  const dmgTIV = damageableTIV(s.tiv);
  const biTIV = s.tiv.bi || 0;
  const ttiv = totalTIV(s.tiv);
  const completeness = dataCompleteness(dataFieldsOf(s));
  const biFactor = s.biFactor ?? 1;
  const indemnityMonths = s.indemnityMonths ?? 12;

  const perils: PerilAssessment[] = [];
  for (const peril of profile.perils) {
    const inp = buildInputs(peril, s, profile, dmgTIV, bundle);
    if (!inp) continue;
    const result = computeAALExt(inp);
    if (result.unsupported) continue; // hail while stubbed — skip from totals
    perils.push({
      peril,
      result,
      confidence: perilConfidence(peril, completeness),
      s1: result.aal, // Section 1 — Material Damage
      s2: section2AAL(result, dmgTIV, biTIV, biFactor, indemnityMonths), // Section 2 — BI
    });
  }

  const results = perils.map((p) => p.result);
  const s1Total = sumAAL(results);
  const s2Total = perils.reduce((acc, p) => acc + p.s2, 0);
  const total = s1Total + s2Total;
  const curves = results.map((r) => r.loss_curve).filter((c) => c.length > 0);
  const combinedEP = sampleCombinedEP(curves, dmgTIV);
  const confidence = overallConfidence(
    completeness,
    perils.map((p) => ({ peril: p.peril, aal: p.result.aal }))
  );

  return {
    perils,
    damageableTIV: dmgTIV,
    biTIV,
    totalTIV: ttiv,
    section1AAL: s1Total,
    section2AAL: s2Total,
    totalAAL: total,
    aalRate: ttiv > 0 ? total / ttiv : 0,
    curves,
    combinedEP,
    confidence,
    completeness,
    tier: tierOf(s),
    resolvedLat: bundle.resolvedLat,
    resolvedLng: bundle.resolvedLng,
    failed: bundle.failed,
  };
}
