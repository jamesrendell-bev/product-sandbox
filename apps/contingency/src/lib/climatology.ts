// Climatology engine: probability that a weather peril exceeds its cancellation
// threshold on the event dates, from Meteostat history. Empirical share of past
// years + a parametric tail fit. Self-contained (no jStat) — Normal/Gamma/Gumbel
// CDFs implemented below.
import type { DailyRow } from "./api";
import { dateAddDays, daysBetween } from "./format";

export type Aggregator = "max" | "min" | "sum";
export type Tail = "upper" | "lower";
export type Dist = "gamma" | "gumbel" | "normal";

export function shiftToYear(iso: string, year: number): string {
  const [, m, d] = iso.split("-");
  const day = m === "02" && d === "29" ? "28" : d;
  return `${year}-${m}-${day}`;
}

// ---- special functions ----
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const normalCdf = (x: number, mu: number, sigma: number) =>
  sigma <= 0 ? (x >= mu ? 1 : 0) : 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));

function lngamma(z: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lngamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7 + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
// regularized lower incomplete gamma P(a,x)
function gammp(a: number, x: number): number {
  if (x <= 0 || a <= 0) return 0;
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 300; n++) {
      ap++; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lngamma(a));
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 300; i++) {
    const an = -i * (i - a);
    b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lngamma(a)) * h;
}
const gammaCdf = (x: number, k: number, theta: number) => (x <= 0 ? 0 : gammp(k, x / theta));
const gumbelCdf = (x: number, mu: number, beta: number) => Math.exp(-Math.exp(-(x - mu) / beta));
const clamp01 = (p: number) => (Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : NaN);

// ---- per-year aggregation over the event window ----
export interface YearValue { year: number; value: number }

export function perYearValues(
  rows: DailyRow[],
  column: string,
  agg: Aggregator,
  eventStart: string,
  eventEnd: string,
  histYears: number[],
): YearValue[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: YearValue[] = [];
  for (const y of histYears) {
    const ws = shiftToYear(eventStart, y);
    const we = shiftToYear(eventEnd, y);
    const present: number[] = [];
    let total = 0;
    for (let d = ws; d <= we; d = dateAddDays(d, 1)) {
      total++;
      const r = byDate.get(d);
      const v = r ? (r[column] as number | null) : null;
      if (v != null && Number.isFinite(v)) present.push(v);
    }
    if (!total || present.length / total < 0.6) { out.push({ year: y, value: NaN }); continue; }
    let value = NaN;
    if (agg === "max") value = Math.max(...present);
    else if (agg === "min") value = Math.min(...present);
    else value = present.reduce((a, b) => a + b, 0);
    out.push({ year: y, value });
  }
  return out;
}

// ---- probabilities ----
export function empiricalProbability(values: number[], threshold: number, tail: Tail) {
  const arr = values.filter((v) => Number.isFinite(v));
  if (!arr.length) return { p: NaN, n: 0, hits: 0 };
  const hits = arr.filter((v) => (tail === "upper" ? v >= threshold : v <= threshold)).length;
  return { p: hits / arr.length, n: arr.length, hits };
}

export function parametricProbability(values: number[], threshold: number, tail: Tail, dist: Dist) {
  const arr = values.filter((v) => Number.isFinite(v));
  if (arr.length < 5) return { p: NaN, label: "insufficient history" };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(arr.length - 1, 1);
  const std = Math.sqrt(variance);
  try {
    if (dist === "gamma") {
      const pos = arr.filter((v) => v > 0);
      const zeroFrac = 1 - pos.length / arr.length;
      if (pos.length < 3) return { p: clamp01(tail === "upper" && threshold > 0 ? 0 : 1), label: "mostly dry" };
      const pm = pos.reduce((a, b) => a + b, 0) / pos.length;
      const pv = pos.reduce((a, b) => a + (b - pm) ** 2, 0) / Math.max(pos.length - 1, 1);
      if (pv <= 0 || pm <= 0) return { p: NaN, label: "gamma fit failed" };
      const k = (pm * pm) / pv, theta = pv / pm;
      const cdfPos = gammaCdf(threshold, k, theta);
      const cdf = threshold <= 0 ? zeroFrac * 0.5 : zeroFrac + (1 - zeroFrac) * cdfPos;
      return { p: clamp01(tail === "upper" ? 1 - cdf : cdf), label: `Gamma k=${k.toFixed(2)}` };
    }
    if (dist === "gumbel") {
      if (std === 0) return { p: clamp01(tail === "upper" ? (threshold <= mean ? 1 : 0) : (threshold >= mean ? 1 : 0)), label: "no variance" };
      const beta = (std * Math.sqrt(6)) / Math.PI;
      const mu = mean - 0.5772156649 * beta;
      const cdf = gumbelCdf(threshold, mu, beta);
      return { p: clamp01(tail === "upper" ? 1 - cdf : cdf), label: `Gumbel μ=${mu.toFixed(1)}` };
    }
    // normal
    if (std === 0) return { p: clamp01(tail === "upper" ? (threshold <= mean ? 1 : 0) : (threshold >= mean ? 1 : 0)), label: "no variance" };
    const cdf = normalCdf(threshold, mean, std);
    return { p: clamp01(tail === "upper" ? 1 - cdf : cdf), label: `Normal μ=${mean.toFixed(1)} σ=${std.toFixed(1)}` };
  } catch {
    return { p: NaN, label: "fit failed" };
  }
}

// Day-by-day exceedance probability across ±pad days around the event window.
// For each calendar day, the chance that single day breaches the threshold,
// estimated across the lookback years.
export interface DailyProb { offset: number; date: string; p: number }
export function dailyExceedanceSeries(
  rows: DailyRow[], column: string, tail: Tail, dist: Dist, threshold: number,
  eventStart: string, eventEnd: string, histYears: number[], pad = 14,
): DailyProb[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: DailyProb[] = [];
  const startD = dateAddDays(eventStart, -pad);
  const endD = dateAddDays(eventEnd, pad);
  for (let d = startD; d <= endD; d = dateAddDays(d, 1)) {
    const mmdd = d.slice(5);
    const vals: number[] = [];
    for (const y of histYears) {
      const r = byDate.get(`${y}-${mmdd === "02-29" ? "02-28" : mmdd}`);
      const v = r ? (r[column] as number | null) : null;
      if (v != null && Number.isFinite(v)) vals.push(v);
    }
    const { p } = blendedProbability(vals, threshold, tail, dist);
    out.push({ offset: daysBetween(eventStart, d), date: d, p });
  }
  return out;
}

// Blend empirical + parametric for a stable headline probability.
export function blendedProbability(values: number[], threshold: number, tail: Tail, dist: Dist) {
  const emp = empiricalProbability(values, threshold, tail);
  const par = parametricProbability(values, threshold, tail, dist);
  const parts = [emp.p, par.p].filter((p) => Number.isFinite(p)) as number[];
  const p = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : NaN;
  return { p, empirical: emp, parametric: par };
}
