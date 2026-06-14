import { useState } from "react";
import { X } from "lucide-react";
import type { PerilResult } from "../../lib/weatherTriage";
import { RAG_COLOR } from "../../lib/weatherTriage";
import type { DailyRow } from "../../lib/api";
import type { FieldSource } from "../../lib/stationMerge";
import { shiftToYear } from "../../lib/climatology";
import { dateAddDays, dayOfWeek, fmtRP } from "../../lib/format";
import { PerilIcon } from "./ui";
import { PerYearChart, DailyProbChart, DailyObservationsChart, type ObsDay } from "./PerilCharts";

const pct = (p: number) => (Number.isFinite(p) ? `${Math.round(p * 100)}%` : "n/a");

function buildYearSeries(rows: DailyRow[], column: string, tail: string, threshold: number, year: number, eventStart: string, eventEnd: string, pad = 14): ObsDay[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const ws = shiftToYear(eventStart, year), we = shiftToYear(eventEnd, year);
  const out: ObsDay[] = [];
  for (let d = dateAddDays(ws, -pad); d <= dateAddDays(we, pad); d = dateAddDays(d, 1)) {
    const raw = byDate.get(d)?.[column];
    const value = Number.isFinite(raw as number) ? (raw as number) : null;
    const inEvent = d >= ws && d <= we;
    const breach = value != null && (tail === "upper" ? value >= threshold : value <= threshold);
    out.push({ date: d, value, inEvent, breach });
  }
  return out;
}

type LegendItem = { type: "box" | "line" | "dash"; color: string; label: string };
const Legend = ({ items }: { items: LegendItem[] }) => (
  <div className="chart-legend">
    {items.map((it, i) => (
      <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
        {it.type === "box" && <i style={{ background: it.color }} />}
        {it.type === "line" && <span className="ln" style={{ borderTopColor: it.color }} />}
        {it.type === "dash" && <span className="ln" style={{ borderTopColor: it.color, borderTopStyle: "dashed" }} />}
        {it.label}
      </span>
    ))}
  </div>
);

const Stat = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) => (
  <div className="stat">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={accent ? { color: "var(--pink)" } : undefined}>{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export function PerilDetailModal({
  peril, rows, eventStart, eventEnd, histYears, referProb, source, venueLabel, onClose,
}: {
  peril: PerilResult; rows: DailyRow[]; eventStart: string; eventEnd: string; histYears: number[];
  referProb: number; source: FieldSource | null; venueLabel: string; onClose: () => void;
}) {
  const c = peril.binding!;
  const eventLenDays = histYears.length ? (() => { const ws = shiftToYear(eventStart, 2000), we = shiftToYear(eventEnd, 2000); return Math.round((+new Date(we) - +new Date(ws)) / 86400000); })() : 0;
  const [graph, setGraph] = useState<"year" | "day">("year");
  const recent = histYears[histYears.length - 1];
  const [year, setYear] = useState<number>(recent);
  const isRain = c.column === "prcp";

  const days = buildYearSeries(rows, c.column, c.tail, c.threshold, year, eventStart, eventEnd);
  const withData = days.filter((d) => d.value != null);
  const breaches = days.filter((d) => d.breach);
  const evBreaches = days.filter((d) => d.inEvent && d.breach);
  let max: ObsDay | null = null, min: ObsDay | null = null, sum = 0;
  for (const d of withData) { sum += d.value!; if (!max || d.value! > max.value!) max = d; if (!min || d.value! < min.value!) min = d; }
  const mean = withData.length ? sum / withData.length : NaN;

  const tabBtn = (g: "year" | "day", label: string) => (
    <button className="btn btn-sm" onClick={() => setGraph(g)} style={{ padding: "7px 14px", background: graph === g ? "var(--pink)" : "transparent", color: graph === g ? "#04102a" : "var(--txt-dim)" }}>{label}</button>
  );

  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(2,7,18,0.66)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 28 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 960, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#0a1f3c,#061328)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>

        {/* header */}
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(255,108,170,0.16)", color: "var(--pink)" }}><PerilIcon name={peril.icon} size={20} /></span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{peril.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--txt-dim)" }}>{venueLabel.split(",").slice(0, 2).join(",")} · {c.label} {c.tail === "upper" ? "≥" : "≤"} {c.threshold}{c.unit}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: RAG_COLOR[peril.rag] }}>{pct(peril.p)}</div>
              <div style={{ fontSize: 10.5, color: "var(--txt-dim)" }}>{fmtRP(peril.p > 0 ? 1 / peril.p : 9999)} · refer ≥ {pct(referProb)}</div>
            </div>
            <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--txt-dim)", cursor: "pointer" }}><X size={18} /></div>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 22px" }}>
          <p className="hint" style={{ margin: "0 0 14px", fontSize: 12.5 }}>How likely this peril is to breach the cancellation threshold on your dates — from the <strong style={{ color: "var(--txt)" }}>long-run record</strong> — and the <strong style={{ color: "var(--txt)" }}>actual weather</strong> in any chosen year.</p>

          {/* climatology graphs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="section-label" style={{ margin: 0 }}>1 · The long-run record ({histYears.length} years)</div>
              <div className="hint" style={{ marginTop: 4 }}>{graph === "year" ? "How bad each year got, and how often the threshold was beaten." : "How the breach probability shifts day-by-day around the event."}</div>
            </div>
            <div style={{ display: "inline-flex", gap: 4, background: "var(--field)", border: "1px solid var(--line)", borderRadius: "var(--r-pill)", padding: 3, flex: "none" }}>
              {tabBtn("year", "Worst day each year")}{tabBtn("day", "Day-by-day chance")}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            {graph === "year"
              ? <><PerYearChart check={c} yTitle={`Worst day (${c.unit})`} /><Legend items={[{ type: "box", color: "var(--pink)", label: "Day breached threshold" }, { type: "box", color: "var(--blue)", label: "Stayed within limits" }, { type: "dash", color: "var(--txt-dim)", label: "Cancellation threshold" }]} /></>
              : <><DailyProbChart check={c} referProb={referProb} eventLenDays={eventLenDays} /><Legend items={[{ type: "line", color: "var(--pink)", label: "Chance of a breach" }, { type: "dash", color: "var(--warn)", label: "Your referral level" }, { type: "box", color: "rgba(255,108,170,0.3)", label: "Event window" }]} /></>}
          </div>

          {source && <p className="hint" style={{ marginTop: 4 }}>Source: {source.name} · {source.distance_km.toFixed(0)} km · {Math.round(source.coverage * 100)}% coverage.</p>}

          {/* recorded observations */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
            <div>
              <div className="section-label" style={{ margin: 0 }}>2 · What actually happened</div>
              <div className="hint" style={{ marginTop: 4 }}>The recorded daily weather around these dates — pick a year to compare.</div>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--txt-dim)", flex: "none" }}>
              Year
              <select className="select" style={{ width: 100 }} value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
                {[...histYears].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>

          <div className="stat-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
            <Stat label={`Days ${c.tail === "upper" ? "over" : "under"} threshold`} value={`${breaches.length}`} sub={`of ${withData.length} with data · ${evBreaches.length} in event`} accent />
            <Stat label={`Peak (${c.unit})`} value={max ? max.value!.toFixed(1) : "—"} sub={max ? `${max.date} (${dayOfWeek(max.date)})` : "no data"} />
            <Stat label={`Lowest (${c.unit})`} value={min ? min.value!.toFixed(1) : "—"} sub={min ? `${min.date} (${dayOfWeek(min.date)})` : "no data"} />
            <Stat label={`${isRain ? "Total" : "Mean"} (${c.unit})`} value={isRain ? sum.toFixed(1) : (Number.isFinite(mean) ? mean.toFixed(1) : "—")} sub={`${days.length ? Math.round((withData.length / days.length) * 100) : 0}% coverage`} />
          </div>

          <div style={{ marginTop: 14 }}>
            <DailyObservationsChart days={days} threshold={c.threshold} unit={c.unit} isBar={isRain} yTitle={`${c.label} (${c.unit})`} />
            <Legend items={[{ type: "box", color: "var(--pink)", label: `Day ${c.tail === "upper" ? "over" : "under"} threshold` }, { type: "box", color: "var(--blue)", label: "Within limits" }, { type: "box", color: "rgba(255,108,170,0.28)", label: "Event window" }]} />
          </div>

          <div style={{ marginTop: 12, maxHeight: 300, overflowY: "auto", border: "1px solid var(--line-soft)", borderRadius: "var(--r-md)" }}>
            <table className="table">
              <thead><tr><th>Date</th><th>Day</th><th className="num">{c.label} ({c.unit})</th><th>Event</th><th>Status</th></tr></thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className={d.inEvent ? "banded" : ""}>
                    <td>{d.date}</td><td>{dayOfWeek(d.date)}</td>
                    <td className="num">{d.value == null ? "—" : d.value.toFixed(1)}</td>
                    <td>{d.inEvent ? "●" : ""}</td>
                    <td>{d.value == null ? <span className="muted">no data</span> : d.breach ? <span style={{ color: "var(--pink)", fontWeight: 700 }}>{c.tail === "upper" ? "Over" : "Under"}</span> : <span className="muted">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
