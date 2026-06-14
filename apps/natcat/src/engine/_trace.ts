// End-to-end numbers trace for model reassessment.
// Run via:  npm run trace   (tsx src/engine/_trace.ts)
//
// Fixes the stub location factor at 1.0 so the run is reproducible, then prints
// every intermediate value: hazard curve → physical intensity → MDR → ΔP →
// per-peril AAL → total → terms → net → combined EP → layer EL → capital price.

import { computeAALExt, totalAAL, type AALInputsExt, type ExtPerilId } from "./aal-ext";
import { stubCurveFor } from "./cera-client-ext";
import { sampleCombinedEP, layerEL, lossAtP, tvarAtP } from "./combined-ep";
import { applyTerms, defaultTermsFor, totalNetAAL, defaultLayers, priceTower } from "../domain/terms";
import { priceRisk, DEFAULT_PRICING } from "../domain/pricing";

const TIV = 9_000_000; // damageable TIV (Buildings+Contents+Other) for this trace
const PROP = "commercial" as const;
const PERILS: ExtPerilId[] = ["TropicalCyclone", "FloodLivePlus", "Wildfire", "Earthquake"];

const m = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const p4 = (n: number) => n.toFixed(4);
const line = (s = "") => console.log(s);
const rule = () => line("─".repeat(92));

line("CERA® MGA ENGINE — END-TO-END NUMBERS TRACE");
line(`Risk: ${PROP} property, damageable TIV ${m(TIV)}, AU profile (region Oceania, basin Australia)`);
line("Hazard: stub curves with location factor fixed at 1.0 (reproducible). Tail cap 1-in-10,000.");
rule();

const inputs = (peril: ExtPerilId): AALInputsExt => ({
  peril,
  tiv: TIV,
  propertyType: PROP,
  region: "Oceania",
  cycloneBasin: "Australia",
  rawCurve: stubCurveFor(peril, 1.0),
});

const results = PERILS.map((p) => computeAALExt(inputs(p)));

for (const r of results) {
  line(`\nPERIL: ${r.peril}   (native unit: ${r.intensity_unit_native} → physical: ${r.intensity_unit_physical})`);
  if (r.poc_disclaimer) line(`  ⚠ ${r.poc_disclaimer}`);
  if (r.is_bernoulli) {
    const row = r.rp_curve[0];
    line(`  Bernoulli single-term: P(severe)=${p4(row.deltaP)} (1-in-${Math.round(row.rp)}), MDR_severe=${p4(row.mdr)}, loss=${m(row.loss)}`);
    line(`  AAL = P × MDR × TIV = ${m(r.aal)}  (rate ${(r.aal_rate * 100).toFixed(3)}% of damageable TIV)`);
    continue;
  }
  line("  RP        native    physical     MDR       ΔP        loss            contribution");
  for (const row of r.rp_curve) {
    line(
      `  1-in-${String(Math.round(row.rp)).padEnd(5)} ` +
        `${String(row.intensity_native).padEnd(8)} ` +
        `${p4(Number(row.intensity_physical)).padStart(8)}   ` +
        `${p4(row.mdr)}   ${p4(row.deltaP)}   ${m(row.loss).padStart(12)}   ${m(row.contribution).padStart(12)}`
    );
  }
  line(`  → AAL = Σ contributions = ${m(r.aal)}  (rate ${(r.aal_rate * 100).toFixed(3)}% of damageable TIV)`);
}

rule();
const total = totalAAL(results);
line(`TOTAL NatCat AAL = Σ per-peril = ${m(total)}  (${(total / TIV * 100).toFixed(3)}% of damageable TIV)`);

// ── Terms ─────────────────────────────────────────────────────────────────────
rule();
line("DEFAULT TERMS → NET AAL");
const perilCurves = results.map((r) => ({ peril: r.peril, curve: r.loss_curve }));
const terms = defaultTermsFor(PERILS);
const nets = applyTerms(perilCurves, terms, TIV);
line("  peril              ded%   sub%    deductible $     gross AAL        net AAL");
for (const n of nets) {
  const t = terms[n.peril];
  line(
    `  ${n.peril.padEnd(17)} ${String(t.deductiblePct).padStart(4)}  ${String(t.sublimitPct).padStart(4)}   ` +
      `${m(n.deductible).padStart(12)}   ${m(n.grossAAL).padStart(12)}   ${m(n.netAAL).padStart(12)}`
  );
}
const totalNet = totalNetAAL(nets);
line(`  → TOTAL NET AAL = ${m(totalNet)}  (${(totalNet / TIV * 100).toFixed(3)}% of damageable TIV)`);

// ── Combined EP + layer tower ─────────────────────────────────────────────────
rule();
line("COMBINED OCCURRENCE EP (net of terms)   G(loss) = 1 − Π(1 − p_peril(loss))");
const netCurves = nets.map((n) => n.netCurve).filter((c) => c.length > 0);
const ep = sampleCombinedEP(netCurves, TIV);
const pick = [100, 250, 500].map((rp) => ep.reduce((b, x) => (Math.abs(x.rp - rp) < Math.abs(b.rp - rp) ? x : b), ep[0]));
for (const x of pick) line(`  ~1-in-${Math.round(x.rp)}: combined loss ${m(x.loss)}`);
line(`  1-in-100 PML  = ${m(lossAtP(netCurves, 1 / 100, TIV))}`);
line(`  1-in-200 VaR  = ${m(lossAtP(netCurves, 1 / 200, TIV))}`);
line(`  1-in-200 TVaR = ${m(tvarAtP(netCurves, 1 / 200, TIV))}`);

rule();
line("LAYER TOWER (off the net combined curve)");
const layers = defaultLayers(TIV);
const tower = priceTower(netCurves, layers);
line("  layer   structure              prob touched   EL              RoL");
for (const ly of tower.layers) {
  line(
    `  L${ly.index + 1}      ${("$" + (ly.limit / 1e6).toFixed(2) + "m xs $" + (ly.attach / 1e6).toFixed(2) + "m").padEnd(20)} ` +
      `${(ly.probTouch * 100).toFixed(2).padStart(6)}%        ${m(ly.el).padStart(12)}   ${(ly.rol * 100).toFixed(2)}%`
  );
}
line(`  → total programme EL = ${m(tower.totalEL)}`);

// ── Capital-aware price ───────────────────────────────────────────────────────
rule();
line("CAPITAL-AWARE TECHNICAL PRICE (confidence band assumed 'Medium')");
const build = priceRisk(netCurves, totalNet, TIV, "Medium", DEFAULT_PRICING);
line(`  net AAL (loss cost)        ${m(build.netAAL)}`);
line(`  tail measure (TVaR 1/200)  ${m(build.tailMeasure)}`);
line(`  capital consumed           ${m(build.capitalConsumed)}   (tail − AAL)`);
line(`  capital load (12% × cap)   ${m(build.capitalLoad)}`);
line(`  expenses (30% of prem)     ${m(build.expenses)}`);
line(`  profit (5% of prem)        ${m(build.profit)}`);
line(`  ───────────────────────────────────────────`);
line(`  TECHNICAL PREMIUM          ${m(build.technicalPremium)}   (${(build.technicalRate * 100).toFixed(3)}% of TIV)`);
rule();
