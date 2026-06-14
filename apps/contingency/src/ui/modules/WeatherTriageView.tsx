import { useState } from "react";
import { Crosshair, Building2, Tent, ArrowRight, Maximize2 } from "lucide-react";
import { geocode, fetchStations, fetchDaily, type DailyRow, type GeoCandidate } from "../../lib/api";
import { mergeStationsByField, TRIAGE_FIELDS, type StationData, type MergedData } from "../../lib/stationMerge";
import { runWeatherTriage, decisionLabel, decisionRag, RAG_COLOR, type WeatherTriageResult, type PerilResult } from "../../lib/weatherTriage";
import type { WeatherAuthority } from "../../domain/weatherAuthority";
import { shiftToYear } from "../../lib/climatology";
import { dateAddDays, daysBetween, fmtRP } from "../../lib/format";
import { ViewHead, RagChip, Spinner, PerilIcon } from "../components/ui";
import { PerilRingMap } from "../components/PerilRingMap";
import { LocationAutocomplete } from "../components/LocationAutocomplete";
import { PerilDetailModal } from "../components/PerilDetailModal";
import type { ViewId, Prefill } from "../../App";

const pct = (p: number) => (Number.isFinite(p) ? `${Math.round(p * 100)}%` : "n/a");

function PerilTile({ peril, onOpen }: { peril: PerilResult; onOpen: () => void }) {
  const c = peril.binding;
  const na = !peril.applicable;
  const clickable = !na && !!c;
  return (
    <div
      onClick={() => clickable && onOpen()}
      className={`card peril-tile${clickable ? "" : " na"}`}
      style={{ margin: 0, padding: "15px 17px", borderTop: `3px solid ${na ? "var(--line)" : RAG_COLOR[peril.rag]}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--txt)" }}><PerilIcon name={peril.icon} size={18} /> {peril.label}</span>
        {na ? <span className="muted" style={{ fontSize: 12 }}>n/a · indoor</span>
          : <span style={{ fontSize: 22, fontWeight: 700, color: RAG_COLOR[peril.rag] }}>{pct(peril.p)}</span>}
      </div>
      {na ? <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>Indoor event. Wind, rain and temperature assumed not to cancel.</p>
        : c ? <>
            <div style={{ fontSize: 12.5, color: "var(--txt-dim)", marginTop: 8 }}>chance of {c.label.toLowerCase()} {c.tail === "upper" ? "≥" : "≤"} <strong style={{ color: "var(--txt)" }}>{c.threshold}{c.unit}</strong> · breached {c.hits}/{c.n} yrs</div>
            <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid var(--line-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="tile-open">Open full history <span className="chev"><ArrowRight size={13} /></span></span>
              <Maximize2 size={14} style={{ color: "var(--txt-faint)" }} />
            </div>
          </> : null}
    </div>
  );
}

export function WeatherTriageView({ auth, go: _go }: { auth: WeatherAuthority; go: (v: ViewId, p?: Prefill) => void }) {
  const [location, setLocation] = useState("Glastonbury, UK");
  const [selected, setSelected] = useState<GeoCandidate | null>(null);
  const [start, setStart] = useState("2026-06-26");
  const [end, setEnd] = useState("2026-06-28");
  const [indoor, setIndoor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ res: WeatherTriageResult; lat: number; lon: number; label: string; stations: any[]; rows: DailyRow[]; sources: MergedData["sources"]; histYears: number[] } | null>(null);
  const [detail, setDetail] = useState<PerilResult | null>(null);

  const run = async () => {
    setLoading(true); setError(null); setOut(null); setDetail(null);
    try {
      if (!start || !end || end < start) throw new Error("Event end must be on or after start.");
      const currentYear = new Date().getFullYear();
      const eventYear = parseInt(start.slice(0, 4), 10);
      const refYear = Math.min(eventYear, currentYear);
      const lookback = auth.lookbackYears;
      const histYears = Array.from({ length: lookback }, (_, i) => refYear - lookback + i);

      let lat: number, lon: number, label: string;
      if (selected && selected.label === location) { lat = selected.lat; lon = selected.lon; label = selected.label; }
      else { setMsg("Geocoding venue…"); const g = await geocode(location); lat = g.lat; lon = g.lon; label = g.label; }

      const fetchStart = dateAddDays(shiftToYear(start, histYears[0]), -18);
      const fetchEnd = dateAddDays(shiftToYear(end, histYears.at(-1)!), 18);

      setMsg("Finding nearest ground stations…");
      const stations = await fetchStations(lat, lon, 8);
      if (!stations.length) throw new Error("No weather stations near this venue.");

      setMsg("Pulling history from nearest stations…");
      const near = stations.slice(0, 5);
      const fetched = await Promise.all(near.map(async (s) => {
        try { const rows = await fetchDaily(s.id, fetchStart, fetchEnd); return rows.length ? { station: s, rows } : null; }
        catch { return null; }
      }));
      const stationData = fetched.filter(Boolean) as StationData[];
      if (!stationData.length) throw new Error("No nearby station has usable history for these dates.");

      const merged = mergeStationsByField(stationData, TRIAGE_FIELDS, fetchStart, fetchEnd);
      const res = runWeatherTriage(merged.rows, start, end, histYears, auth, indoor);
      const stationPts = stations.map((s) => ({ name: s.name, latitude: s.latitude, longitude: s.longitude, distance_km: s.distance_km, used: merged.usedStationIds.has(s.id) }));
      setOut({ res, lat, lon, label, stations: stationPts, rows: merged.rows, sources: merged.sources, histYears });
    } catch (e: any) { setError(e.message); } finally { setLoading(false); setMsg(""); }
  };

  const res = out?.res;
  const summary = res ? (() => {
    const live = res.perils.filter((p) => p.applicable);
    const red = live.filter((p) => p.rag === "red");
    const amber = live.filter((p) => p.rag === "amber");
    if (res.indoor) return red.length ? "Heavy snow risk on the event dates would refer this indoor event." : "Indoor event — no material weather cancellation risk on the dates modelled.";
    if (red.length) return `${red.map((p) => p.label.toLowerCase()).join(", ")} would likely cancel the event on these dates.`;
    if (amber.length) return `${amber.map((p) => p.label.toLowerCase()).join(", ")} carry a referable cancellation probability on these dates.`;
    return "All five weather perils sit below the referral probability on these dates.";
  })() : "";

  const toggleStyle = (on: boolean) => ({ borderRadius: 0, background: on ? "var(--pink)" : "transparent", color: on ? "#04102a" : "var(--txt-dim)" });

  return (
    <>
      <ViewHead
        eyebrow="Assess · Weather cancellation risk"
        title="Weather risk triage"
        sub="Model a single venue against the five weather perils on the event dates. Click any peril for its full history and recorded observations. Indoor events refer only on heavy snow. Guidance, not a price."
      />

      <div className="card">
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 2 }}>
            <label className="label">Venue / location</label>
            <LocationAutocomplete value={location} onChange={(t) => { setLocation(t); setSelected(null); }} onSelect={(c) => { setLocation(c.label); setSelected(c); }} placeholder="Start typing a venue or city…" />
          </div>
          <div className="field"><label className="label">Event start</label><input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="field"><label className="label">Event end</label><input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="label">Event setting</label>
            <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
              <button type="button" onClick={() => setIndoor(false)} className="btn btn-sm" style={toggleStyle(!indoor)}><Tent size={15} /> Outdoor</button>
              <button type="button" onClick={() => setIndoor(true)} className="btn btn-sm" style={toggleStyle(indoor)}><Building2 size={15} /> Indoor</button>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={run} disabled={loading}>{loading ? <Spinner /> : <Crosshair />} {loading ? (msg || "Working…") : "Run weather triage"}</button>
        </div>
      </div>

      {error && <div className="card"><div className="error-box">{error}</div></div>}

      {res && out && (
        <>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div className="card-title" style={{ margin: 0 }}>{out.label.split(",").slice(0, 2).join(",")}</div>
                <p style={{ margin: "6px 0 0", maxWidth: 640, lineHeight: 1.5 }}>{summary}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <RagChip rag={decisionRag[res.decision]}>{decisionLabel[res.decision]}</RagChip>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{res.indoor ? "Indoor" : "Outdoor"} · refer ≥ {pct(res.referProb)} · {res.histYears.length}-yr climatology</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <PerilRingMap lat={out.lat} lon={out.lon} label={out.label} decision={res.decision} perils={res.perils} stations={out.stations} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "12px 16px", borderTop: "1px solid var(--line-soft)" }}>
              {res.perils.map((p) => (
                <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: p.applicable ? RAG_COLOR[p.rag] : "var(--line)" }} />
                  <PerilIcon name={p.icon} size={14} /> {p.label}{p.applicable ? ` · ${pct(p.p)}` : ""}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(248px, 1fr))", gap: 16 }}>
            {res.perils.map((p) => <PerilTile key={p.id} peril={p} onOpen={() => setDetail(p)} />)}
          </div>

          <p className="hint" style={{ marginTop: 4 }}>
            Click a peril for its full history — worst day per year, day-by-day breach probability ±14 days, and the actual recorded observations for any year. Probabilities blend the empirical share of years with a parametric tail fit from {res.histYears.length} years; each peril is drawn from the nearest station that reports it. Thresholds and bands are editable under Referral thresholds. Guidance, not a price.
          </p>
        </>
      )}

      {detail && out && res && (
        <PerilDetailModal
          peril={detail} rows={out.rows} eventStart={start} eventEnd={end} histYears={out.histYears}
          referProb={res.referProb} source={detail.binding ? out.sources[detail.binding.column] : null}
          venueLabel={out.label} onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
