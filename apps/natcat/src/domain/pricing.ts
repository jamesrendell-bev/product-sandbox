// src/domain/pricing.ts
//
// Capital-aware technical premium:
//   Technical premium = net AAL + expenses + capital load + profit
//   capital load = cost-of-capital % × capital consumed
//   capital consumed = tail measure (default 1-in-200 TVaR) − net AAL
// Confidence-gated: low-confidence risks show a range + refer, not a point.
// rateAdequacy() compares the charged rate (from BDX) vs the technical rate.

import type { PerilLossPoint } from "../engine/aal-ext";
import { tvarAtP, lossAtP } from "../engine/combined-ep";
import type { ConfidenceBand } from "../engine/confidence";

export interface PricingParams {
  expenseRatio: number; // share of premium
  costOfCapital: number; // annual % on capital consumed
  profitRatio: number; // share of premium
  capitalBasis: "TVaR" | "VaR";
  returnPeriod: number; // e.g. 200
}
export const DEFAULT_PRICING: PricingParams = {
  expenseRatio: 0.3,
  costOfCapital: 0.12,
  profitRatio: 0.05,
  capitalBasis: "TVaR",
  returnPeriod: 200,
};

export interface PriceBuildUp {
  section1AAL: number; // Material Damage net AAL (after terms)
  section2AAL: number; // Business Interruption AAL (no property terms)
  netAAL: number; // loss cost = Section 1 + Section 2
  tailMeasure: number; // VaR or TVaR at returnPeriod (Section-1 net curves)
  capitalConsumed: number;
  capitalLoad: number;
  expenses: number;
  profit: number;
  technicalPremium: number;
  technicalRate: number; // premium / TIV
  // confidence gating
  gated: boolean;
  low?: number;
  high?: number;
  lowRate?: number;
  highRate?: number;
}

/**
 * netCurves / section1NetAAL = Section 1 (Material Damage) AFTER property terms.
 * section2AAL = Business Interruption, added here as its own line (no property
 * terms). Capital is consumed against the Section-1 tail.
 */
export function priceRisk(
  netCurves: PerilLossPoint[][],
  section1NetAAL: number,
  section2AAL: number,
  tiv: number,
  confidence: ConfidenceBand,
  params: PricingParams = DEFAULT_PRICING
): PriceBuildUp {
  const lossCost = section1NetAAL + section2AAL;
  const p = 1 / params.returnPeriod;
  const tail =
    params.capitalBasis === "TVaR"
      ? tvarAtP(netCurves, p, tiv)
      : lossAtP(netCurves, p, tiv);
  const capitalConsumed = Math.max(0, tail - section1NetAAL);
  const capitalLoad = params.costOfCapital * capitalConsumed;

  const before = lossCost + capitalLoad;
  const denom = 1 - params.expenseRatio - params.profitRatio;
  const technicalPremium = before / denom;
  const expenses = technicalPremium * params.expenseRatio;
  const profit = technicalPremium * params.profitRatio;
  const technicalRate = tiv > 0 ? technicalPremium / tiv : 0;

  const gated = confidence === "Low";
  return {
    section1AAL: section1NetAAL,
    section2AAL,
    netAAL: lossCost,
    tailMeasure: tail,
    capitalConsumed,
    capitalLoad,
    expenses,
    profit,
    technicalPremium,
    technicalRate,
    gated,
    low: gated ? technicalPremium * 0.7 : undefined,
    high: gated ? technicalPremium * 1.6 : undefined,
    lowRate: gated ? (technicalPremium * 0.7) / tiv : undefined,
    highRate: gated ? (technicalPremium * 1.6) / tiv : undefined,
  };
}

export type AdequacyStatus = "underpriced" | "adequate" | "overpriced";
export interface RateAdequacy {
  chargedRate: number; // fraction of TIV
  technicalRate: number; // fraction of TIV
  ratio: number; // charged / technical
  deltaPct: number; // signed % vs technical
  status: AdequacyStatus;
}

/** chargedRatePct and technicalRate are FRACTIONS of TIV (e.g. 0.0038). */
export function rateAdequacy(
  chargedRate: number,
  technicalRate: number
): RateAdequacy {
  const ratio = technicalRate > 0 ? chargedRate / technicalRate : 1;
  const deltaPct = (ratio - 1) * 100;
  let status: AdequacyStatus = "adequate";
  if (ratio < 0.9) status = "underpriced";
  else if (ratio > 1.15) status = "overpriced";
  return { chargedRate, technicalRate, ratio, deltaPct, status };
}
