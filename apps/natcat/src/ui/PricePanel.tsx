import type { MarketProfile } from "../domain/marketProfiles";
import type { PriceBuildUp, PricingParams } from "../domain/pricing";
import type { ConfidenceBand } from "../engine/confidence";
import { money, pct } from "./format";

export function PricePanel({
  profile,
  build,
  params,
  setParams,
  confidenceBand,
}: {
  profile: MarketProfile;
  build: PriceBuildUp;
  params: PricingParams;
  setParams: (p: PricingParams) => void;
  confidenceBand: ConfidenceBand;
}) {
  const sym = profile.currencySymbol;
  const row = (lbl: string, val: string, total = false) => (
    <div className={`row ${total ? "total" : ""}`}>
      <span className="lbl">{lbl}</span>
      <span>{val}</span>
    </div>
  );

  return (
    <>
      <div className="sub" style={{ marginBottom: 14 }}>
        Technical premium = net AAL + expenses + cost-of-capital × capital consumed + profit. Capital basis:{" "}
        {params.capitalBasis} at 1-in-{params.returnPeriod}. Framed to the capacity provider's economics.
      </div>

      <div className="controls" style={{ margin: "0 0 16px", boxShadow: "none" }}>
        <div className="ctl">
          <label>Expense ratio</label>
          <input type="number" step={0.01} min={0} max={0.6} value={params.expenseRatio}
            onChange={(e) => setParams({ ...params, expenseRatio: +e.target.value || 0 })} />
        </div>
        <div className="ctl">
          <label>Cost of capital</label>
          <input type="number" step={0.01} min={0} max={0.4} value={params.costOfCapital}
            onChange={(e) => setParams({ ...params, costOfCapital: +e.target.value || 0 })} />
        </div>
        <div className="ctl">
          <label>Profit ratio</label>
          <input type="number" step={0.01} min={0} max={0.3} value={params.profitRatio}
            onChange={(e) => setParams({ ...params, profitRatio: +e.target.value || 0 })} />
        </div>
        <div className="ctl">
          <label>Capital basis</label>
          <select value={params.capitalBasis} onChange={(e) => setParams({ ...params, capitalBasis: e.target.value as "TVaR" | "VaR" })}>
            <option value="TVaR">1-in-200 TVaR</option>
            <option value="VaR">1-in-200 VaR</option>
          </select>
        </div>
      </div>

      <div className="grid2">
        <div className="buildup">
          {row("Section 1 — Material Damage (net AAL)", money(sym, build.section1AAL))}
          {row("Section 2 — Business Interruption (AAL)", money(sym, build.section2AAL))}
          {row("Loss cost (S1 + S2)", money(sym, build.netAAL))}
          {row(`Tail measure (${params.capitalBasis} 1-in-${params.returnPeriod})`, money(sym, build.tailMeasure))}
          {row("Capital consumed (tail − AAL)", money(sym, build.capitalConsumed))}
          {row(`Capital load (${pct(params.costOfCapital, 0)} × capital)`, money(sym, build.capitalLoad))}
          {row("Expenses", money(sym, build.expenses))}
          {row("Profit", money(sym, build.profit))}
          {row("Technical premium", money(sym, build.technicalPremium), true)}
          {row("Technical rate (% TIV)", pct(build.technicalRate))}
        </div>
        <div>
          {build.gated ? (
            <div className="note" style={{ borderColor: "var(--rag-decline)" }}>
              <b>Confidence-gated.</b> This risk is <b>{confidenceBand}</b> confidence — we show a range, not a point, and recommend a referral.
              <div style={{ marginTop: 10 }}>
                <div className="bignum">{money(sym, build.low!)}–{money(sym, build.high!)}</div>
                <div className="poc">≈ {pct(build.lowRate!)}–{pct(build.highRate!)} of TIV · add COPE data to tighten.</div>
              </div>
            </div>
          ) : (
            <div className="readout">
              <div className="poc">Technical premium</div>
              <div className="bignum">{money(sym, build.technicalPremium)}</div>
              <div className="poc">{pct(build.technicalRate)} of TIV · {confidenceBand} confidence</div>
            </div>
          )}
          <div className="note">All figures illustrative until live feed + calibration. Capital number is confidence-gated; never shown as false precision on thin data.</div>
        </div>
      </div>
    </>
  );
}
