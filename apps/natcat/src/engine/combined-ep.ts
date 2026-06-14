// src/engine/combined-ep.ts
//
// Combined occurrence loss EP curve across perils:
//   G(loss) = 1 − Π_perils (1 − p_peril(loss))
// under peril independence (occurrence basis, NOT summed tails). Wildfire enters
// as a Bernoulli large-loss. Feeds terms, the layer tower, and capital pricing.

import type { PerilLossPoint } from "./aal-ext";

/** Exceedance probability P(loss > x) for one peril's loss curve. */
export function pExceed(curve: PerilLossPoint[], x: number): number {
  if (!curve.length) return 0;
  const first = curve[0]; // highest p, lowest loss
  const last = curve[curve.length - 1];
  if (x <= first.loss) return first.p;
  if (x >= last.loss) return 0; // tail cap above worst modelled loss
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (x >= a.loss && x <= b.loss) {
      const t = (x - a.loss) / (b.loss - a.loss || 1e-9);
      return a.p + t * (b.p - a.p);
    }
  }
  return 0;
}

/** Combined exceedance probability across all peril curves. */
export function gCombined(curves: PerilLossPoint[][], x: number): number {
  let prod = 1;
  for (const c of curves) prod *= 1 - pExceed(c, x);
  return 1 - prod;
}

/**
 * Expected loss to a layer [attach, attach+limit]:
 *   EL = ∫_A^{A+L} G(x) dx   (since E[min(max(L−A,0),L)] = ∫ P(L>x) dx)
 */
export function layerEL(
  curves: PerilLossPoint[][],
  attach: number,
  limit: number,
  steps = 2000
): number {
  if (limit <= 0) return 0;
  const dx = limit / steps;
  let el = 0;
  for (let i = 0; i < steps; i++) {
    const x = attach + (i + 0.5) * dx;
    el += gCombined(curves, x) * dx;
  }
  return el;
}

/** Probability the layer is touched (G at its attachment point). */
export function probTouch(curves: PerilLossPoint[][], attach: number): number {
  return gCombined(curves, attach);
}

/** Loss at a target annual exceedance probability (e.g. 1/200 → PML). */
export function lossAtP(
  curves: PerilLossPoint[][],
  targetP: number,
  maxLoss: number
): number {
  let lo = 0;
  let hi = maxLoss;
  for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2;
    if (gCombined(curves, m) > targetP) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/**
 * Tail Value at Risk at a target probability:
 *   TVaR_p = VaR_p + E[(L − VaR_p)+] / p,  E[(L−VaR)+] = ∫_VaR^∞ G(x) dx
 */
export function tvarAtP(
  curves: PerilLossPoint[][],
  targetP: number,
  maxLoss: number,
  steps = 2000
): number {
  const varp = lossAtP(curves, targetP, maxLoss);
  const dx = (maxLoss - varp) / steps;
  let tail = 0;
  for (let i = 0; i < steps; i++) {
    const x = varp + (i + 0.5) * dx;
    tail += gCombined(curves, x) * dx;
  }
  return varp + tail / targetP;
}

/** Sample the combined EP curve as [{ rp, loss }] for charting (rp in [1, 10000]). */
export function sampleCombinedEP(
  curves: PerilLossPoint[][],
  maxLoss: number,
  points = 160
): { rp: number; loss: number }[] {
  const out: { rp: number; loss: number }[] = [];
  for (let i = 1; i <= points; i++) {
    const loss = (maxLoss * i) / points;
    const g = gCombined(curves, loss);
    if (g > 0) {
      const rp = 1 / g;
      if (rp >= 1 && rp <= 10000) out.push({ rp, loss });
    }
  }
  out.sort((a, b) => a.rp - b.rp);
  return out;
}
