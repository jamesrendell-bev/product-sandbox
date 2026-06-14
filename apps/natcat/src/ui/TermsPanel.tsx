import type { MarketProfile } from "../domain/marketProfiles";
import { perilLabel } from "../domain/marketProfiles";
import type { ExtPerilId } from "../engine/aal-ext";
import type { Layer, LayerResult, PerilNet, PerilTerms } from "../domain/terms";
import type { Authority } from "../domain/authority";
import { LossEPChart } from "./charts";
import { money, pct, rpFmt } from "./format";

export function TermsPanel({
  profile,
  terms,
  setTerms,
  layers,
  setLayers,
  nets,
  netEP,
  maxLoss,
  tower,
  totalNet,
  onSuggest,
  authority,
}: {
  profile: MarketProfile;
  terms: Record<string, PerilTerms>;
  setTerms: (t: Record<string, PerilTerms>) => void;
  layers: Layer[];
  setLayers: (l: Layer[]) => void;
  nets: PerilNet[];
  netEP: { rp: number; loss: number }[];
  maxLoss: number;
  tower: { layers: LayerResult[]; totalEL: number };
  totalNet: number;
  onSuggest: () => void;
  authority: Authority;
}) {
  const sym = profile.currencySymbol;
  const setTerm = (peril: ExtPerilId, patch: Partial<PerilTerms>) =>
    setTerms({ ...terms, [peril]: { ...terms[peril], ...patch } });

  return (
    <>
      <div className="sub" style={{ marginBottom: 14 }}>
        Deductibles (flat + % wind/quake with min/max) and sublimits per peril; the layer tower prices off the combined curve.
        Net AAL after terms: <b>{money(sym, totalNet)}</b>.{" "}
        <button className="pill-btn" onClick={onSuggest} style={{ marginLeft: 8 }}>Suggest terms (target ~1.2% net)</button>
      </div>

      <table style={{ marginBottom: 22 }}>
        <thead>
          <tr>
            <th>Peril</th>
            <th>Basis</th>
            <th>Deductible % TIV</th>
            <th>Sublimit % TIV</th>
            <th>Gross AAL</th>
            <th>Net AAL</th>
          </tr>
        </thead>
        <tbody>
          {nets.map((n) => {
            const t = terms[n.peril];
            const dedFloor = t.basis === "wind" ? authority.minWindDedPct : t.basis === "quake" ? authority.minQuakeDedPct : 0;
            const floodMandatory = authority.mandatoryFloodSublimit && (n.peril === "FloodLivePlus" || n.peril === "Flood");
            const subMax = floodMandatory ? 99 : 100;
            return (
              <tr key={n.peril}>
                <td>{perilLabel(profile, n.peril)}</td>
                <td>{t.basis}</td>
                <td>
                  <input className="miniinput" type="number" step={0.5} min={dedFloor} value={t.deductiblePct}
                    onChange={(e) => setTerm(n.peril, { deductiblePct: Math.max(dedFloor, +e.target.value || 0) })} />
                  {dedFloor > 0 && <div className="poc">floor {dedFloor}%</div>}
                </td>
                <td>
                  <input className="miniinput" type="number" step={5} min={1} max={subMax} value={Math.min(t.sublimitPct, subMax)}
                    onChange={(e) => setTerm(n.peril, { sublimitPct: Math.min(subMax, +e.target.value || 0) })} />
                  {floodMandatory && <div className="poc">sublimit required</div>}
                </td>
                <td>{money(sym, n.grossAAL)}</td>
                <td><b>{money(sym, n.netAAL)}</b></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="sechead">Programme tower — multi-layer pricing off the net curve</div>
      <div className="grid2">
        <LossEPChart points={netEP} maxLoss={maxLoss} symbol={sym} layers={tower.layers} />
        <div>
          <table>
            <thead>
              <tr><th>Layer</th><th>Attach {sym}m</th><th>Limit {sym}m</th><th></th></tr>
            </thead>
            <tbody>
              {layers.map((ly, i) => (
                <tr key={i}>
                  <td>Layer {i + 1}</td>
                  <td>
                    <input type="number" step={0.25} min={0} value={+(ly.attach / 1e6).toFixed(3)}
                      onChange={(e) => { const c = [...layers]; c[i] = { ...c[i], attach: (+e.target.value || 0) * 1e6 }; setLayers(c); }} />
                  </td>
                  <td>
                    <input type="number" step={0.25} min={0} value={+(ly.limit / 1e6).toFixed(3)}
                      onChange={(e) => { const c = [...layers]; c[i] = { ...c[i], limit: (+e.target.value || 0) * 1e6 }; setLayers(c); }} />
                  </td>
                  <td>
                    <button className="pill-btn" title="Remove layer" aria-label={`Remove layer ${i + 1}`}
                      onClick={() => setLayers(layers.filter((_, j) => j !== i))}>×</button>
                  </td>
                </tr>
              ))}
              {layers.length === 0 && (
                <tr><td colSpan={4} className="poc">No layers — writing the risk ground-up at 100% (no excess tower).</td></tr>
              )}
            </tbody>
          </table>
          <div className="pills" style={{ marginTop: 8 }}>
            <button className="pill-btn"
              onClick={() => { const last = layers[layers.length - 1]; const attach = last ? last.attach + last.limit : 0; setLayers([...layers, { attach, limit: 0.25 * maxLoss }]); }}>
              + Add layer
            </button>
            <button className="pill-btn" onClick={() => setLayers([{ attach: 0, limit: maxLoss }])}>Writing 100% (single layer)</button>
            {layers.length > 0 && <button className="pill-btn" onClick={() => setLayers([])}>Clear layers</button>}
          </div>
        </div>
      </div>

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Layer</th><th>Structure</th><th>Attaches</th><th>Exhausts</th><th>Prob. touched</th><th>Loss cost</th><th>RoL</th></tr>
        </thead>
        <tbody>
          {tower.layers.map((ly) => (
            <tr key={ly.index}>
              <td>Layer {ly.index + 1}</td>
              <td>{sym}{(ly.limit / 1e6).toFixed(2)}m xs {sym}{(ly.attach / 1e6).toFixed(2)}m</td>
              <td>{rpFmt(ly.probTouch)}</td>
              <td>{rpFmt(ly.probExhaust)}</td>
              <td>{pct(ly.probTouch, 1)}</td>
              <td>{money(sym, ly.el)}</td>
              <td>{pct(ly.rol)}</td>
            </tr>
          ))}
          {tower.layers.length === 0 && (
            <tr><td colSpan={7} className="poc">No layers — writing 100% ground-up; the loss cost is the net AAL above.</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>Total programme expected loss (occurrence basis)</td>
            <td>{money(sym, tower.totalEL)}</td>
            <td>{maxLoss > 0 ? pct(tower.totalEL / maxLoss) : "—"}</td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}
