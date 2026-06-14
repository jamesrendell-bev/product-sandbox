import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Crosshair, Radar, CloudRain, Printer } from "lucide-react";
import { geocode, ceraTriage, type TriageLocation } from "../../lib/api";
import { CAT_PERILS, catIcon } from "../../lib/perils";
import { triageLocation, decisionLabel, decisionRag, worstDecision, type Decision, type FiredRule } from "../../domain/triage";
import { type Authority } from "../../domain/authority";
import { seasonalFlags, type SeasonFlag } from "../../lib/seasonality";
import { fmtRP } from "../../lib/format";
import { ViewHead, RagChip, Spinner, PerilIcon } from "../components/ui";
import type { ViewId, Prefill } from "../../App";

interface Row {
  loc: TriageLocation;
  decision: Decision;
  fired: FiredRule[];
  seasons: SeasonFlag[];
  failed?: boolean;
  query: string;
}

const DEC_COLOR: Record<Decision, string> = { write: "#2FBF8F", refer: "#E0A33A", decline: "#F0584A" };

function FitBounds({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  if (pts.length) {
    const lats = pts.map((p) => p[0]), lons = pts.map((p) => p[1]);
    map.fitBounds([[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]], { padding: [40, 40], maxZoom: 9, animate: false });
  }
  return null;
}

function seasonStatusRag(s: SeasonFlag["status"]) { return s === "in-season" ? "red" : s === "shoulder" ? "amber" : "neutral"; }

export function TriageView({ authority, go }: { authority: Authority; go: (v: ViewId, p?: Prefill) => void }) {
  const [text, setText] = useState("Miami, FL\nLisbon, Portugal\nTokyo, Japan\nLondon, UK");
  const [date, setDate] = useState("2026-09-12");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [mode, setMode] = useState<"live" | "stub">("stub");

  const run = async () => {
    const queries = text.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!queries.length) return;
    setLoading(true); setError(null); setRows(null);
    try {
      setMsg("Geocoding locations…");
      const geos = await Promise.all(queries.map(async (q) => {
        try { const g = await geocode(q); return { q, ...g }; } catch { return { q, failed: true } as any; }
      }));
      const ok = geos.filter((g) => !g.failed && Number.isFinite(g.lat));
      if (!ok.length) throw new Error("None of the locations could be geocoded.");
      setMsg("Scoring hazard with CERA…");
      const res = await ceraTriage(ok.map((g) => ({ label: g.label, lat: g.lat, lon: g.lon, country: g.country })));
      setMode(res.mode);
      const built: Row[] = res.results.map((loc, i) => {
        const { decision, fired } = triageLocation(loc.scores, authority);
        return { loc, decision, fired, seasons: seasonalFlags(loc.lat, loc.lon, date), query: ok[i].q };
      });
      // append failed geocodes as rows so the user sees them
      for (const g of geos.filter((x) => x.failed)) built.push({ loc: { index: -1, label: g.q, lat: 0, lon: 0, country: null, scores: [] }, decision: "refer", fired: [], seasons: [], failed: true, query: g.q });
      setRows(built);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); setMsg(""); }
  };

  const valid = rows?.filter((r) => !r.failed) ?? [];
  const portfolio = valid.length ? worstDecision(valid.map((r) => r.decision)) : null;
  const pts: [number, number][] = valid.map((r) => [r.loc.lat, r.loc.lon]);
  const referrals = valid.filter((r) => r.decision !== "write");

  return (
    <>
      <ViewHead
        eyebrow="Assess · Portfolio triage"
        title="Risk triage"
        sub="Enter one or more venues. CERA® scores each against your referral thresholds for cyclone, flood, wildfire, earthquake and tornado — and flags where the event date lands in a hazard season."
      />

      <div className="card">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 2 }}>
            <label className="label">Venues / locations <span className="muted">(one per line)</span></label>
            <textarea className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Event date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <p className="hint">Drives the seasonality check.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? <Spinner /> : <Crosshair />} {loading ? (msg || "Working…") : "Triage portfolio"}</button>
      </div>

      {error && <div className="card"><div className="error-box">{error}</div></div>}

      {rows && (
        <>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div className="card-title" style={{ margin: 0 }}>Portfolio outcome</div>
              {portfolio && <RagChip rag={decisionRag[portfolio]}>Portfolio: {decisionLabel[portfolio]}</RagChip>}
            </div>
            <div className="stat-grid" style={{ marginTop: 14 }}>
              <div className="stat"><div className="stat-label">Locations</div><div className="stat-value">{valid.length}</div></div>
              <div className="stat"><div className="stat-label">Accept</div><div className="stat-value" style={{ color: "var(--ok)" }}>{valid.filter((r) => r.decision === "write").length}</div></div>
              <div className="stat"><div className="stat-label">Refer</div><div className="stat-value" style={{ color: "var(--warn)" }}>{valid.filter((r) => r.decision === "refer").length}</div></div>
              <div className="stat"><div className="stat-label">Decline</div><div className="stat-value" style={{ color: "var(--danger)" }}>{valid.filter((r) => r.decision === "decline").length}</div></div>
            </div>
            {mode === "stub" && <p className="hint" style={{ marginTop: 12 }}>Hazard scores are deterministic regional stubs. Add a CERA® API key to go live. Return periods show at each peril's key threshold.</p>}
          </div>

          {pts.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <MapContainer center={pts[0]} zoom={3} style={{ height: 360, width: "100%" }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
                <FitBounds pts={pts} />
                {valid.map((r) => (
                  <CircleMarker key={r.loc.index} center={[r.loc.lat, r.loc.lon]} radius={9} pathOptions={{ color: DEC_COLOR[r.decision], fillColor: DEC_COLOR[r.decision], fillOpacity: 0.8, weight: 2 }}>
                    <Popup><strong>{r.query}</strong><br />{decisionLabel[r.decision]}{r.fired.length ? ` · ${r.fired.length} rule(s)` : ""}</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          )}

          <div className="card">
            <div className="card-title">Triage table</div>
            <p className="card-hint">Each cell is the modelled return period at the peril's key threshold. Pink = breaches an authority rule.</p>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Decision</th>
                    {CAT_PERILS.map((p) => <th key={p.id} className="num" title={p.label}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}><PerilIcon name={p.icon} size={15} />{p.label.split(" ")[0]}</span></th>)}
                    <th>Season</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    if (r.failed) return <tr key={`f${idx}`}><td className="rowlabel">{r.query}</td><td><span className="muted">geocode failed</span></td><td colSpan={CAT_PERILS.length + 1} /></tr>;
                    const firedPerils = new Set(r.fired.map((f) => authority.hazardRules.find((h) => h.id === f.id)?.peril));
                    const worstSeason = r.seasons.find((s) => s.status === "in-season") || r.seasons.find((s) => s.status === "shoulder");
                    return (
                      <tr key={r.loc.index}>
                        <td className="rowlabel">{r.query}{r.loc.country ? <span className="muted" style={{ fontWeight: 400 }}> · {r.loc.country}</span> : ""}</td>
                        <td><RagChip rag={decisionRag[r.decision]}>{decisionLabel[r.decision]}</RagChip></td>
                        {CAT_PERILS.map((p) => {
                          const s = r.loc.scores.find((x) => x.peril === p.id);
                          const fired = firedPerils.has(p.id);
                          return <td key={p.id} className="num" style={fired ? { background: "var(--pale-pink)", color: "var(--pink-deep)", fontWeight: 700 } : undefined}>{s ? fmtRP(s.keyReturnPeriod) : "—"}</td>;
                        })}
                        <td>{worstSeason ? <RagChip rag={seasonStatusRag(worstSeason.status) as any}><PerilIcon name={worstSeason.icon} size={12} /> {worstSeason.status === "in-season" ? "In season" : "Shoulder"}</RagChip> : <span className="muted">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {referrals.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div className="card-title" style={{ margin: 0 }}>Referral report · {referrals.length} location(s)</div>
                <button className="btn btn-light btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
              </div>
              {referrals.map((r) => (
                <div key={r.loc.index} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <strong>{r.query}</strong>
                    <RagChip rag={decisionRag[r.decision]}>{decisionLabel[r.decision]} → {authority.referTo}</RagChip>
                  </div>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                    {r.fired.map((f) => <li key={f.id}><strong>{f.action === "decline" ? "Decline" : "Refer"}:</strong> {f.detail}</li>)}
                    {r.seasons.filter((s) => s.status === "in-season").map((s, i) => <li key={`s${i}`}><strong>Seasonality:</strong> {s.season} — {s.note}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
