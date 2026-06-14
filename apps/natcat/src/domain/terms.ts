// src/domain/terms.ts
//
// Deductibles (flat + % wind/quake with min/max), peril sublimits, and the
// layer tower (attach/exhaust/RoL/prob-touch). suggestTerms() targets a net-AAL
// rate. Net AAL after terms is computed live off each peril's loss curve.

import { TAIL_CAP_P, type ExtPerilId, type PerilLossPoint } from "../engine/aal-ext";
import { layerEL, probTouch } from "../engine/combined-ep";

export type DeductibleBasis = "wind" | "quake" | "flat";

export interface PerilTerms {
  deductiblePct: number; // % of TIV
  deductibleMinPct?: number; // floor as % TIV
  deductibleMaxPct?: number; // cap as % TIV
  sublimitPct: number; // % of TIV (100 = full)
  basis: DeductibleBasis;
}

export const DEFAULT_TERMS: Record<ExtPerilId, PerilTerms> = {
  TropicalCyclone: { deductiblePct: 2, deductibleMinPct: 0.5, deductibleMaxPct: 10, sublimitPct: 100, basis: "wind" },
  USTornado: { deductiblePct: 2, deductibleMinPct: 0.5, deductibleMaxPct: 10, sublimitPct: 100, basis: "wind" },
  Hail: { deductiblePct: 2, deductibleMinPct: 0.5, deductibleMaxPct: 10, sublimitPct: 100, basis: "wind" },
  Earthquake: { deductiblePct: 5, deductibleMinPct: 1, deductibleMaxPct: 15, sublimitPct: 50, basis: "quake" },
  FloodLivePlus: { deductiblePct: 1, sublimitPct: 50, basis: "flat" },
  Flood: { deductiblePct: 1, sublimitPct: 50, basis: "flat" },
  Wildfire: { deductiblePct: 2, sublimitPct: 100, basis: "flat" },
};

export function defaultTermsFor(perils: ExtPerilId[]): Record<string, PerilTerms> {
  const out: Record<string, PerilTerms> = {};
  for (const p of perils) out[p] = { ...DEFAULT_TERMS[p] };
  return out;
}

export function deductibleAmount(t: PerilTerms, tiv: number): number {
  let amt = (t.deductiblePct / 100) * tiv;
  if (t.deductibleMinPct != null) amt = Math.max(amt, (t.deductibleMinPct / 100) * tiv);
  if (t.deductibleMaxPct != null) amt = Math.min(amt, (t.deductibleMaxPct / 100) * tiv);
  return amt;
}
export function sublimitAmount(t: PerilTerms, tiv: number): number {
  return (t.sublimitPct / 100) * tiv;
}

/** Apply deductible + sublimit to a peril's gross loss curve → net loss curve. */
export function netCurve(
  gross: PerilLossPoint[],
  t: PerilTerms,
  tiv: number
): PerilLossPoint[] {
  const ded = deductibleAmount(t, tiv);
  const sub = sublimitAmount(t, tiv);
  return gross.map((pt) => ({
    p: pt.p,
    loss: Math.min(Math.max(pt.loss - ded, 0), sub),
  }));
}

/** AAL from a loss curve (gross or net). Single-point curves = Bernoulli p×loss. */
export function aalFromCurve(curve: PerilLossPoint[]): number {
  if (curve.length === 0) return 0;
  if (curve.length === 1) return curve[0].p * curve[0].loss;
  let aal = 0;
  for (let i = 0; i < curve.length; i++) {
    const pi = curve[i].p;
    const pnext = i + 1 < curve.length ? curve[i + 1].p : TAIL_CAP_P;
    aal += curve[i].loss * Math.max(0, pi - pnext);
  }
  return aal;
}

export interface PerilNet {
  peril: ExtPerilId;
  grossAAL: number;
  netAAL: number;
  netCurve: PerilLossPoint[];
  deductible: number;
  sublimit: number;
}

export function applyTerms(
  perilCurves: { peril: ExtPerilId; curve: PerilLossPoint[] }[],
  terms: Record<string, PerilTerms>,
  tiv: number
): PerilNet[] {
  return perilCurves.map(({ peril, curve }) => {
    const t = terms[peril] ?? DEFAULT_TERMS[peril];
    const nc = netCurve(curve, t, tiv);
    return {
      peril,
      grossAAL: aalFromCurve(curve),
      netAAL: aalFromCurve(nc),
      netCurve: nc,
      deductible: deductibleAmount(t, tiv),
      sublimit: sublimitAmount(t, tiv),
    };
  });
}

export function totalNetAAL(nets: PerilNet[]): number {
  return nets.reduce((s, n) => s + n.netAAL, 0);
}

// ── Layer tower ──────────────────────────────────────────────────────────────
export interface Layer {
  attach: number;
  limit: number;
}
export interface LayerResult {
  index: number;
  attach: number;
  limit: number;
  exhaust: number;
  el: number; // expected loss
  rol: number; // rate on line = EL / limit
  probTouch: number;
  probExhaust: number;
}

export function priceTower(
  netCurves: PerilLossPoint[][],
  layers: Layer[]
): { layers: LayerResult[]; totalEL: number } {
  const out: LayerResult[] = [];
  let totalEL = 0;
  layers.forEach((ly, i) => {
    if (ly.limit <= 0) return;
    const el = layerEL(netCurves, ly.attach, ly.limit);
    totalEL += el;
    out.push({
      index: i,
      attach: ly.attach,
      limit: ly.limit,
      exhaust: ly.attach + ly.limit,
      el,
      rol: el / ly.limit,
      probTouch: probTouch(netCurves, ly.attach),
      probExhaust: probTouch(netCurves, ly.attach + ly.limit),
    });
  });
  return { layers: out, totalEL };
}

export function defaultLayers(tiv: number): Layer[] {
  return [
    { attach: 0, limit: 0.25 * tiv },
    { attach: 0.25 * tiv, limit: 0.25 * tiv },
    { attach: 0.5 * tiv, limit: 0.5 * tiv },
  ];
}

// ── suggestTerms — hit a target net-AAL rate (% of TIV) ───────────────────────
// Per peril, raise the deductible (within its min/max) until the peril's net
// AAL share is at or below its target contribution. Sublimits left at default.
export function suggestTerms(
  perilCurves: { peril: ExtPerilId; curve: PerilLossPoint[] }[],
  tiv: number,
  targetNetRate = 0.012 // 1.2% TIV
): Record<string, PerilTerms> {
  const target = targetNetRate * tiv;
  const out: Record<string, PerilTerms> = {};
  // Even split of the target budget across perils that actually carry loss.
  const active = perilCurves.filter((p) => aalFromCurve(p.curve) > 0);
  const perPerilBudget = active.length ? target / active.length : target;
  for (const { peril, curve } of perilCurves) {
    const base = { ...DEFAULT_TERMS[peril] };
    if (aalFromCurve(curve) <= perPerilBudget) {
      out[peril] = base;
      continue;
    }
    let chosen = base;
    const maxPct = base.deductibleMaxPct ?? 10;
    for (let pct = base.deductiblePct; pct <= maxPct + 1e-9; pct += 0.5) {
      const t = { ...base, deductiblePct: pct };
      if (aalFromCurve(netCurve(curve, t, tiv)) <= perPerilBudget) {
        chosen = t;
        break;
      }
      chosen = t; // keep tightening to the cap
    }
    out[peril] = chosen;
  }
  return out;
}
