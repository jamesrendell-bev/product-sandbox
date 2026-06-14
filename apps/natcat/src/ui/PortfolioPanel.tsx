import { useState } from "react";
import type { MarketProfile } from "../domain/marketProfiles";
import { perilLabel } from "../domain/marketProfiles";
import { parseBDXFile, loadSampleBDX } from "../data/bdx";
import {
  aggregateByCresta,
  assessLocation,
  mapBdxRow,
  portfolioPML,
  type CrestaAgg,
  type LocationAAL,
  type PortfolioPML,
} from "../domain/portfolio";
import { MapView, type MapPoint } from "./MapView";
import { money, pct } from "./format";
import { AlertTriangle } from "lucide-react";

const ROW_LIMIT = 600; // cap heavy compute for the demo — truncation surfaced below
const SHOW_ROWS = 60;

export function PortfolioPanel({ profile }: { profile: MarketProfile }) {
  const sym = profile.currencySymbol;
  const [rows, setRows] = useState<LocationAAL[]>([]);
  const [cresta, setCresta] = useState<CrestaAgg[]>([]);
  const [pml, setPml] = useState<PortfolioPML | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function process(raw: Record<string, unknown>[]) {
    const locs = raw
      .map((r, i) => mapBdxRow(r, i + 1))
      .filter((x): x is NonNullable<typeof x> => !!x);
    setTotal(locs.length);
    const limited = locs.slice(0, ROW_LIMIT);
    const assessed = limited.map((l) => assessLocation(l, profile));
    setRows(assessed);
    setCresta(aggregateByCresta(assessed));
    setPml(portfolioPML(assessed, profile.perils));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true); setErr("");
    try { process(await parseBDXFile(f)); }
    catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  }
  async function onSample() {
    setLoading(true); setErr("");
    try { process(await loadSampleBDX()); }
    catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  }

  const peakZones = new Set(cresta.filter((c) => c.peak).map((c) => c.cresta));
  const mapPoints: MapPoint[] = rows
    .filter((r) => r.loc.lat != null && r.loc.lng != null)
    .map((r) => ({
      lat: r.loc.lat!,
      lng: r.loc.lng!,
      label: r.loc.insured,
      html: `${r.loc.cresta} · TIV ${money(sym, r.loc.totalTIV)} · AAL ${money(sym, r.totalAAL)} (${r.aalRatePct.toFixed(2)}%)`,
      peak: peakZones.has(r.loc.cresta),
      weight: Math.min(1, r.aalRatePct / 3),
    }));

  // book-level rate adequacy: charged premium vs AAL (pure loss cost)
  const chargedPrem = rows.reduce((s, r) => s + (r.loc.chargedRatePct ?? 0) * r.loc.totalTIV, 0);
  const withCharged = rows.filter((r) => r.loc.chargedRatePct != null);

  const cov = {
    geo: rows.filter((r) => r.loc.lat != null && r.loc.lng != null).length,
    con: rows.filter((r) => !!r.loc.constructionId).length,
    cresta: rows.filter((r) => r.loc.cresta && r.loc.cresta !== "—").length,
    charged: withCharged.length,
  };

  return (
    <div className="panel">
      <h2>2 · Portfolio — bulk BDX</h2>
      <div className="sub">
        Upload a coverholder bordereau (or its AI_Output sheet with geocoded lat/long). Per-location AAL, Cresta accumulation, PML and a dark cluster map.
      </div>

      <div className="controls" style={{ margin: "0 0 16px", boxShadow: "none" }}>
        <div className="ctl">
          <label>Upload BDX (.xlsx)</label>
          <input type="file" accept=".xlsx,.xls" onChange={onFile} />
        </div>
        <div className="ctl">
          <label>&nbsp;</label>
          <button className="pill-btn on" onClick={onSample} disabled={loading}>
            {loading ? "Scoring…" : "Load sample AU bordereau"}
          </button>
        </div>
      </div>

      {err && <div className="note" style={{ borderColor: "var(--rag-decline)" }}>{err}</div>}

      {pml && rows.length > 0 && (
        <>
          <div className="grid3" style={{ marginBottom: 18 }}>
            <Stat label="Portfolio AAL" value={money(sym, pml.totalAAL)} sub={`${pct(pml.totalAAL / (pml.totalTIV || 1))} of ${money(sym, pml.totalTIV)} TIV`} />
            <Stat label="1-in-100 PML" value={money(sym, pml.pml100)} sub={`1-in-250 ${money(sym, pml.pml250)}`} />
            <Stat label="1-in-200 TVaR (capital)" value={money(sym, pml.tvar200)} sub={`diversification ×${pml.diversification.toFixed(2)}`} />
          </div>

          {total > ROW_LIMIT && (
            <div className="note">Scored the first <b>{ROW_LIMIT.toLocaleString()}</b> of <b>{total.toLocaleString()}</b> locations for the demo (compute cap). Production runs the full book via the async <code>/v1/in-depth/batch</code> endpoint.</div>
          )}

          <div className="note">
            <b>Data coverage (where the BDX is complete vs missing):</b>{" "}
            geocoded {cov.geo}/{rows.length} · construction {cov.con}/{rows.length} · Cresta zone {cov.cresta}/{rows.length} · charged rate {cov.charged}/{rows.length}.
            {cov.cresta < rows.length && " Rows without a Cresta Zone column fall back to State for accumulation."}
            {cov.con < rows.length && " Rows without construction use a generic occupancy-default vulnerability."}{" "}
            Portfolio mode runs on stub/illustrative hazard until the live CERA® batch feed is switched on.
          </div>

          <div className="sechead">Accumulation by Cresta zone</div>
          <table style={{ marginBottom: 20 }}>
            <thead><tr><th>Cresta zone</th><th>Risks</th><th>TIV</th><th>AAL</th><th>Share of book</th><th>Flag</th></tr></thead>
            <tbody>
              {cresta.slice(0, 12).map((c) => (
                <tr key={c.cresta} className={c.peak ? "peak" : ""}>
                  <td>{c.cresta}</td>
                  <td>{c.count}</td>
                  <td>{money(sym, c.tiv)}</td>
                  <td>{money(sym, c.aal)}</td>
                  <td>{pct(c.share, 1)}</td>
                  <td>{c.peak ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--rag-decline)" }}><AlertTriangle size={13} /> peak zone</span> : "ok"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="sechead">Map — clustered, peak zones in red</div>
          <MapView points={mapPoints} height={420} />

          <div className="sechead" style={{ marginTop: 20 }}>
            Per-location results {rows.length > SHOW_ROWS && <span className="poc">(first {SHOW_ROWS} of {rows.length})</span>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Insured</th><th>Cresta</th><th>TIV</th>
                  {profile.perils.map((p) => <th key={p}>AAL {perilLabel(profile, p)}</th>)}
                  <th>AAL Total</th><th>Rate %</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, SHOW_ROWS).map((r) => (
                  <tr key={r.loc.id} className={peakZones.has(r.loc.cresta) ? "peak" : ""}>
                    <td>{r.loc.id}</td>
                    <td>{r.loc.insured}</td>
                    <td>{r.loc.cresta}</td>
                    <td>{money(sym, r.loc.totalTIV)}</td>
                    {profile.perils.map((p) => <td key={p}>{money(sym, r.perilAAL[p] ?? 0)}</td>)}
                    <td><b>{money(sym, r.totalAAL)}</b></td>
                    <td>{r.aalRatePct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {withCharged.length > 0 && (
            <div className="note" style={{ marginTop: 16 }}>
              <b>Rate adequacy (book):</b> charged premium {money(sym, chargedPrem)} vs portfolio AAL {money(sym, pml.totalAAL)} —
              loss ratio on AAL ≈ {pct(pml.totalAAL / (chargedPrem || 1), 0)}. ({withCharged.length} of {rows.length} rows carry a charged rate.)
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <div className="poc">{label}</div>
      <div className="bignum" style={{ margin: "6px 0 4px" }}>{value}</div>
      <div className="poc">{sub}</div>
    </div>
  );
}
