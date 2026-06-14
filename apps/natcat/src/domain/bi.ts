// src/domain/bi.ts
//
// §6 — Business Interruption (Section 2). Mirrors the ISR wording the MGAs live in:
//   Section 1 — Material Damage: MDR × damageable TIV (A+B+C) — the existing engine.
//   Section 2 — BI: at each peril/return-period node,
//       BI loss = BI_TIV × min(1, MDR_building × biFactor) × min(1, indemnityMonths/12)
//   i.e. "if the building is 40% damaged we assume ~40% of declared BI is lost
//   while it's repaired" (biFactor adjustable, capped by the indemnity period).
//
// Property terms (deductibles/sublimits/layers) apply to Section 1 ONLY; Section 2
// is added at the pricing step as its own line. biFactor = 0 reproduces the old
// material-damage-only numbers.

import type { AALResultExt, PerilLossPoint } from "../engine/aal-ext";
import { aalFromCurve } from "./terms";

/** Indemnity-period scale: 12 months → 1.0, 6 months → 0.5 (capped at 1). */
export function indemnityScale(months: number | undefined): number {
  const m = months == null || !isFinite(months) ? 12 : months;
  return Math.min(1, Math.max(0, m) / 12);
}

/**
 * Section-2 (BI) loss curve for one peril, reusing the per-node MDR implied by the
 * Section-1 loss curve (MDR_node = s1Loss / damageableTIV). Works for Bernoulli
 * (single-node wildfire) too.
 */
export function section2Curve(
  result: AALResultExt,
  damageableTIV: number,
  biTIV: number,
  biFactor: number,
  indemnityMonths: number | undefined
): PerilLossPoint[] {
  const scale = indemnityScale(indemnityMonths);
  if (damageableTIV <= 0 || biTIV <= 0 || biFactor <= 0 || scale <= 0) {
    return result.loss_curve.map((pt) => ({ p: pt.p, loss: 0 }));
  }
  return result.loss_curve.map((pt) => {
    const mdr = pt.loss / damageableTIV; // MDR_building at this node
    return { p: pt.p, loss: biTIV * Math.min(1, mdr * biFactor) * scale };
  });
}

/** Section-2 (BI) AAL for one peril. */
export function section2AAL(
  result: AALResultExt,
  damageableTIV: number,
  biTIV: number,
  biFactor: number,
  indemnityMonths: number | undefined
): number {
  return aalFromCurve(section2Curve(result, damageableTIV, biTIV, biFactor, indemnityMonths));
}
