// Extended sanity tests for the MGA engine additions.
// Run via:  npm run sanity:ext   (tsx src/engine/_sanity-ext.ts)
//
// Covers: US Tornado, wildfire single-term, hail stub, total AAL = Σ per-peril,
// combined-EP layer reconciliation, and confidence monotonicity.

import { tornadoMDR, wildfireSevereMDR, hailMDR } from "./vuln-functions-ext";
import { computeAALExt, totalAAL, type AALInputsExt, type ExtPerilId } from "./aal-ext";
import { layerEL, sampleCombinedEP } from "./combined-ep";
import { stubCurveFor as stubFor, stubBundle } from "./cera-client-ext";
import { dataCompleteness, overallConfidence } from "./confidence";
import { assessRisk } from "../domain/aalEngine";
import { MARKET_PROFILES } from "../domain/marketProfiles";
import { emptySubmission, splitFromTotal } from "../domain/inputModel";

interface Case {
  label: string;
  got: number;
  want: number;
  tol?: number;
}
const approx: Case[] = [];
const checks: { label: string; ok: boolean; detail: string }[] = [];

// ── Tornado MDR — monotonic & bounded ────────────────────────────────────────
checks.push({
  label: "Tornado MDR rises with wind (Timber)",
  ok: tornadoMDR(30, "Timber") < tornadoMDR(60, "Timber") && tornadoMDR(60, "Timber") <= 1,
  detail: `30→${tornadoMDR(30, "Timber").toFixed(3)}  60→${tornadoMDR(60, "Timber").toFixed(3)}`,
});
checks.push({
  label: "Tornado: timber more vulnerable than concrete @ 45 m/s",
  ok: tornadoMDR(45, "Timber") > tornadoMDR(45, "Concrete"),
  detail: `timber=${tornadoMDR(45, "Timber").toFixed(3)} concrete=${tornadoMDR(45, "Concrete").toFixed(3)}`,
});

// ── Wildfire single-term — construction ordering ──────────────────────────────
checks.push({
  label: "Wildfire MDR_severe: WUI timber > non-combustible",
  ok: wildfireSevereMDR("Timber / WUI") > wildfireSevereMDR("Non-combustible"),
  detail: `wui=${wildfireSevereMDR("Timber / WUI").toFixed(3)} nc=${wildfireSevereMDR("Non-combustible").toFixed(3)}`,
});

// ── Hail stub — threshold behaviour ───────────────────────────────────────────
checks.push({
  label: "Hail MDR zero below threshold, positive above",
  ok: hailMDR(1.0, "Asphalt shingle") === 0 && hailMDR(5.0, "Asphalt shingle") > 0,
  detail: `1cm=${hailMDR(1.0, "Asphalt shingle")} 5cm=${hailMDR(5.0, "Asphalt shingle").toFixed(3)}`,
});

// ── Build an AU multi-peril risk on stub curves ───────────────────────────────
const TIV = 5_000_000;
const auPerils: ExtPerilId[] = ["Flood", "TropicalCyclone", "Earthquake", "Wildfire"];
function inputs(peril: ExtPerilId): AALInputsExt {
  return {
    peril,
    tiv: TIV,
    propertyType: "commercial",
    region: "Oceania",
    cycloneBasin: "Australia",
    rawCurve: stubFor(peril, 1.0),
  };
}
const results = auPerils.map((p) => computeAALExt(inputs(p)));

// Total AAL = exact Σ per-peril
const sumManual = results.reduce((s, r) => s + r.aal, 0);
checks.push({
  label: "Total AAL = Σ per-peril AAL (exact)",
  ok: Math.abs(totalAAL(results) - sumManual) < 1e-6,
  detail: `total=${totalAAL(results).toFixed(2)} sum=${sumManual.toFixed(2)}`,
});

// Wildfire single-term is Bernoulli with one loss point
const wf = results[auPerils.indexOf("Wildfire")];
checks.push({
  label: "Wildfire is single-term Bernoulli (1 loss point)",
  ok: wf.is_bernoulli && wf.loss_curve.length === 1 && wf.aal > 0,
  detail: `bernoulli=${wf.is_bernoulli} pts=${wf.loss_curve.length} aal=${wf.aal.toFixed(0)}`,
});

// ── Combined-EP layer reconciliation ──────────────────────────────────────────
// Stacked layers covering [0, maxLoss] must sum to the full-height layer EL.
const curves = results.map((r) => r.loss_curve);
const maxLoss = TIV;
const full = layerEL(curves, 0, maxLoss, 4000);
const a = layerEL(curves, 0, maxLoss * 0.25, 4000);
const b = layerEL(curves, maxLoss * 0.25, maxLoss * 0.25, 4000);
const c = layerEL(curves, maxLoss * 0.5, maxLoss * 0.5, 4000);
checks.push({
  label: "Layer ELs reconcile to full ground-up occurrence cost",
  ok: Math.abs(full - (a + b + c)) / Math.max(full, 1) < 0.01,
  detail: `full=${full.toFixed(0)} stacked=${(a + b + c).toFixed(0)}`,
});

// Combined EP curve is non-empty and monotone in loss
const ep = sampleCombinedEP(curves, maxLoss);
checks.push({
  label: "Combined EP curve samples (rp increases with loss)",
  ok: ep.length > 3 && ep[0].loss <= ep[ep.length - 1].loss,
  detail: `points=${ep.length}`,
});

// ── Confidence falls as fields are removed ────────────────────────────────────
const full3 = dataCompleteness({
  hasLocation: true, hasTIV: true, hasOccupancy: true,
  hasConstruction: true, hasYearBuilt: true, hasRoof: true,
  hasElevation: true, hasSecondaryModifiers: true,
});
const tier1 = dataCompleteness({ hasLocation: true, hasTIV: true, hasOccupancy: true, hasConstruction: true, hasYearBuilt: true });
const tier0 = dataCompleteness({ hasLocation: true, hasTIV: true, hasOccupancy: true });
checks.push({
  label: "Data completeness falls as fields are removed (tier2>tier1>tier0)",
  ok: full3 > tier1 && tier1 > tier0,
  detail: `t2=${full3.toFixed(2)} t1=${tier1.toFixed(2)} t0=${tier0.toFixed(2)}`,
});
const perilAAL = results.map((r) => ({ peril: r.peril, aal: r.aal }));
const cHi = overallConfidence(full3, perilAAL).score;
const cLo = overallConfidence(tier0, perilAAL).score;
checks.push({
  label: "Overall confidence falls with less data",
  ok: cHi > cLo,
  detail: `hi=${cHi.toFixed(2)} lo=${cLo.toFixed(2)}`,
});

// ── §5a — first-floor elevation lowers flood AAL ──────────────────────────────
const floodAAL = (elev?: number) =>
  computeAALExt({
    peril: "FloodLivePlus",
    tiv: TIV,
    propertyType: "commercial",
    region: "Oceania",
    firstFloorElevationM: elev,
    rawCurve: stubFor("FloodLivePlus", 1.0),
  }).aal;
const floodGround = floodAAL(0);
const floodRaised = floodAAL(1.5);
checks.push({
  label: "§5a: raising first-floor elevation lowers flood AAL",
  ok: floodRaised < floodGround && floodGround > 0,
  detail: `0m=${floodGround.toFixed(0)} 1.5m=${floodRaised.toFixed(0)}`,
});

// ── §5b — year-built factor moves wind/quake AAL (1975 vs 2015) ────────────────
const tcAAL = (year?: number) =>
  computeAALExt({
    peril: "TropicalCyclone",
    tiv: TIV,
    propertyType: "commercial",
    cycloneBasin: "Australia",
    yearBuilt: year,
    rawCurve: stubFor("TropicalCyclone", 1.0),
  }).aal;
const tc1975 = tcAAL(1975);
const tc2015 = tcAAL(2015);
checks.push({
  label: "§5b: year built 1975 (×1.25) > 2015 (×0.90) on wind AAL",
  ok: tc1975 > tc2015 && tc2015 > 0,
  detail: `1975=${tc1975.toFixed(0)} 2015=${tc2015.toFixed(0)}`,
});

// ── §5 — both fields legitimately raise completeness ──────────────────────────
const base0 = dataCompleteness({ hasLocation: true, hasTIV: true, hasOccupancy: true });
const wElev = dataCompleteness({ hasLocation: true, hasTIV: true, hasOccupancy: true, hasElevation: true });
const wYear = dataCompleteness({ hasLocation: true, hasTIV: true, hasOccupancy: true, hasYearBuilt: true });
checks.push({
  label: "§5: elevation & year-built each raise completeness",
  ok: wElev > base0 && wYear > base0,
  detail: `base=${base0.toFixed(2)} +elev=${wElev.toFixed(2)} +year=${wYear.toFixed(2)}`,
});

// ── §6 — BI Section 1 / Section 2 (through assessRisk) ────────────────────────
const auProfile = MARKET_PROFILES.AU;
const biBundle = stubBundle({ location: "Brisbane", perils: auProfile.perils, apiKey: "", baseUrl: "" });
const baseSub = {
  ...emptySubmission("AU"),
  address: "Brisbane",
  occupancy: "commercial" as const,
  tiv: splitFromTotal(9_000_000, "commercial"),
  biFactor: 1,
  indemnityMonths: 12,
};
const a12 = assessRisk(baseSub, auProfile, biBundle);
const aZero = assessRisk({ ...baseSub, biFactor: 0 }, auProfile, biBundle);
const a6 = assessRisk({ ...baseSub, indemnityMonths: 6 }, auProfile, biBundle);

checks.push({
  label: "§6: total AAL = Section 1 + Section 2",
  ok: Math.abs(a12.totalAAL - (a12.section1AAL + a12.section2AAL)) < 1e-6 && a12.section2AAL > 0,
  detail: `S1=${a12.section1AAL.toFixed(0)} S2=${a12.section2AAL.toFixed(0)} total=${a12.totalAAL.toFixed(0)}`,
});
checks.push({
  label: "§6: biFactor 0 reproduces material-damage-only (S2=0, total=S1)",
  ok: aZero.section2AAL === 0 && Math.abs(aZero.totalAAL - aZero.section1AAL) < 1e-6,
  detail: `S2=${aZero.section2AAL.toFixed(0)} total=${aZero.totalAAL.toFixed(0)} S1=${aZero.section1AAL.toFixed(0)}`,
});
checks.push({
  label: "§6: indemnity 6 months halves Section 2 vs 12",
  ok: Math.abs(a6.section2AAL - a12.section2AAL / 2) < 1,
  detail: `6mo=${a6.section2AAL.toFixed(0)} 12mo=${a12.section2AAL.toFixed(0)}`,
});

// ── Report ────────────────────────────────────────────────────────────────────
let pass = 0;
for (const c of approx) {
  const ok = Math.abs(c.got - c.want) < (c.tol ?? 0.005);
  console.log(`${ok ? "✓" : "✗"}  ${c.label.padEnd(46)}  got=${c.got.toFixed(4)} want=${c.want.toFixed(4)}`);
  if (ok) pass++;
}
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"}  ${c.label.padEnd(46)}  ${c.detail}`);
  if (c.ok) pass++;
}
const tot = approx.length + checks.length;
console.log(`\n${pass}/${tot} extended cases pass`);
process.exit(pass === tot ? 0 : 1);
