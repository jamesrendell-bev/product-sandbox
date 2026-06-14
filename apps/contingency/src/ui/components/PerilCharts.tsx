import type { CheckResult } from "../../lib/weatherTriage";

const AxisTitles = ({ W, H, padL, padB, xTitle, yTitle }: { W: number; H: number; padL: number; padB: number; xTitle: string; yTitle: string }) => (
  <>
    <text className="axis-title" x={padL + (W - padL - 18) / 2} y={H - 8} textAnchor="middle">{xTitle}</text>
    <text className="axis-title" x={15} y={(H - padB + 16) / 2} textAnchor="middle" transform={`rotate(-90, 15, ${(H - padB + 16) / 2})`}>{yTitle}</text>
  </>
);

// ---- Graph 1: worst day in the event window, per historical year ----
export function PerYearChart({ check, yTitle, height = 270 }: { check: CheckResult; yTitle: string; height?: number }) {
  const data = check.values.filter((v) => Number.isFinite(v.value));
  if (!data.length) return <div className="muted" style={{ fontSize: 13, padding: 24 }}>No yearly history at this station.</div>;
  const W = 900, H = 290, padL = 58, padR = 18, padT = 16, padB = 52;
  const vals = data.map((d) => d.value);
  const maxV = Math.max(check.threshold, ...vals) * 1.08;
  const minV = Math.min(0, check.threshold, ...vals);
  const bw = (W - padL - padR) / data.length;
  const y = (v: number) => H - padB - ((v - minV) / (maxV - minV || 1)) * (H - padT - padB);
  const breach = (v: number) => (check.tail === "upper" ? v >= check.threshold : v <= check.threshold);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => { const v = minV + t * (maxV - minV); return <g key={t}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" /><text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--txt-faint)">{v.toFixed(0)}</text></g>; })}
      <line x1={padL} x2={W - padR} y1={y(check.threshold)} y2={y(check.threshold)} stroke="var(--txt-dim)" strokeDasharray="6 4" strokeWidth={1.3} />
      <text x={W - padR} y={y(check.threshold) - 5} textAnchor="end" fontSize="11" fill="var(--txt-dim)">cancellation threshold ({check.threshold}{check.unit})</text>
      {data.map((d, i) => (
        <g key={d.year}>
          <rect x={padL + i * bw + bw * 0.16} width={bw * 0.68} y={y(d.value)} height={Math.max(y(minV) - y(d.value), 0)} fill={breach(d.value) ? "var(--pink)" : "var(--blue)"} rx={2} />
          <text x={padL + i * bw + bw / 2} y={H - padB + 15} textAnchor="middle" fontSize="10.5" fill="var(--txt-faint)">{String(d.year).slice(2)}</text>
        </g>
      ))}
      <AxisTitles W={W} H={H} padL={padL} padB={padB} xTitle="Year" yTitle={yTitle} />
    </svg>
  );
}

// ---- Graph 2: day-by-day exceedance probability ±14 days ----
export function DailyProbChart({ check, referProb, eventLenDays, height = 270 }: { check: CheckResult; referProb: number; eventLenDays: number; height?: number }) {
  const data = check.daily;
  if (!data.length) return <div className="muted" style={{ fontSize: 13, padding: 24 }}>No daily history at this station.</div>;
  const W = 900, H = 290, padL = 58, padR = 18, padT = 16, padB = 52;
  const maxP = Math.max(0.1, referProb * 1.25, ...data.map((d) => (Number.isFinite(d.p) ? d.p : 0)));
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(data.length - 1, 1);
  const y = (p: number) => H - padB - (p / maxP) * (H - padT - padB);
  const pts = data.map((d, i) => (Number.isFinite(d.p) ? `${x(i)},${y(d.p)}` : "")).filter(Boolean).join(" ");
  const area = `${padL},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`;
  const evStartI = data.findIndex((d) => d.offset === 0);
  const evEndI = data.findIndex((d) => d.offset === eventLenDays);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {evStartI >= 0 && <rect x={x(evStartI)} width={Math.max(x(evEndI >= 0 ? evEndI : evStartI) - x(evStartI), 4)} y={padT} height={H - padT - padB} fill="var(--pink)" opacity={0.1} />}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => { const p = t * maxP; return <g key={t}><line x1={padL} x2={W - padR} y1={y(p)} y2={y(p)} stroke="var(--line-soft)" /><text x={padL - 8} y={y(p) + 4} textAnchor="end" fontSize="11" fill="var(--txt-faint)">{Math.round(p * 100)}%</text></g>; })}
      <line x1={padL} x2={W - padR} y1={y(referProb)} y2={y(referProb)} stroke="var(--warn)" strokeDasharray="6 4" strokeWidth={1.3} />
      <text x={W - padR} y={y(referProb) - 5} textAnchor="end" fontSize="11" fill="var(--warn)">referral level ({Math.round(referProb * 100)}%)</text>
      <polygon points={area} fill="var(--pink)" opacity={0.14} />
      <polyline points={pts} fill="none" stroke="var(--pink)" strokeWidth={2.2} />
      {data.map((d, i) => (i % 7 === 0 || d.offset === 0) ? <g key={i}><line x1={x(i)} x2={x(i)} y1={H - padB} y2={H - padB + 4} stroke="var(--txt-faint)" /><text x={x(i)} y={H - padB + 15} textAnchor="middle" fontSize="10.5" fill="var(--txt-faint)">{d.offset === 0 ? "event" : `${d.offset > 0 ? "+" : ""}${d.offset}`}</text></g> : null)}
      <AxisTitles W={W} H={H} padL={padL} padB={padB} xTitle="Days before / after the event" yTitle="Chance of breaching threshold" />
    </svg>
  );
}

// ---- Recorded observations: actual daily values for one year's window ----
export interface ObsDay { date: string; value: number | null; inEvent: boolean; breach: boolean }
export function DailyObservationsChart({ days, threshold, unit, isBar, yTitle, height = 270 }: { days: ObsDay[]; threshold: number; unit: string; isBar: boolean; yTitle: string; height?: number }) {
  if (!days.length) return <div className="muted" style={{ fontSize: 13, padding: 24 }}>No recorded data for this year.</div>;
  const W = 900, H = 290, padL = 58, padR = 18, padT = 16, padB = 52;
  const vals = days.map((d) => d.value).filter((v): v is number => v != null);
  const maxV = Math.max(threshold, ...vals, 1);
  const minV = Math.min(0, threshold, ...vals);
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(days.length - 1, 1);
  const xBar = (W - padL - padR) / days.length;
  const y = (v: number) => H - padB - ((v - minV) / (maxV - minV || 1)) * (H - padT - padB);
  const ei0 = days.findIndex((d) => d.inEvent);
  const ei1 = days.map((d) => d.inEvent).lastIndexOf(true);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {ei0 >= 0 && <rect x={x(ei0) - xBar / 2} width={Math.max(x(ei1) - x(ei0) + xBar, 4)} y={padT} height={H - padT - padB} fill="var(--pink)" opacity={0.09} />}
      {[0, 0.5, 1].map((t) => { const v = minV + t * (maxV - minV); return <g key={t}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" /><text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--txt-faint)">{v.toFixed(0)}</text></g>; })}
      <line x1={padL} x2={W - padR} y1={y(threshold)} y2={y(threshold)} stroke="var(--txt-dim)" strokeDasharray="6 4" strokeWidth={1.3} />
      <text x={W - padR} y={y(threshold) - 5} textAnchor="end" fontSize="11" fill="var(--txt-dim)">cancellation threshold ({threshold}{unit})</text>
      {isBar
        ? days.map((d, i) => d.value == null ? null : <rect key={i} x={x(i) - xBar * 0.32} width={xBar * 0.64} y={y(d.value)} height={Math.max(y(minV) - y(d.value), 0)} fill={d.breach ? "var(--pink)" : "var(--blue)"} rx={1.5} />)
        : (<>
            <polyline fill="none" stroke="#7f8aa0" strokeWidth={1.5} points={days.map((d, i) => d.value == null ? "" : `${x(i)},${y(d.value)}`).filter(Boolean).join(" ")} />
            {days.map((d, i) => d.value == null ? null : <circle key={i} cx={x(i)} cy={y(d.value)} r={3.5} fill={d.breach ? "var(--pink)" : "var(--blue)"} />)}
          </>)}
      {days.map((d, i) => (i % 5 === 0 || i === days.length - 1) ? <text key={i} x={x(i)} y={H - padB + 15} textAnchor="middle" fontSize="10" fill="var(--txt-faint)">{d.date.slice(5)}</text> : null)}
      <AxisTitles W={W} H={H} padL={padL} padB={padB} xTitle="Date (month-day)" yTitle={yTitle} />
    </svg>
  );
}
