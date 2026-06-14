import { money } from "./format";
import type { LayerResult } from "../domain/terms";

const RPS = [5, 10, 25, 50, 100, 250, 500, 1000];
const RP_MIN = 2;
const RP_MAX = 1000;

function xFromRP(rp: number, l: number, w: number, r: number): number {
  const t = (Math.log10(Math.max(RP_MIN, Math.min(RP_MAX, rp))) - Math.log10(RP_MIN)) /
    (Math.log10(RP_MAX) - Math.log10(RP_MIN));
  return l + t * (w - l - r);
}

// ── Combined occurrence EP curve (loss vs return period) ─────────────────────
export function LossEPChart({
  points,
  maxLoss,
  symbol,
  layers,
}: {
  points: { rp: number; loss: number }[];
  maxLoss: number;
  symbol: string;
  layers?: LayerResult[];
}) {
  const W = 460, H = 300, L = 70, R = 16, T = 14, B = 36;
  const yMax = maxLoss || 1;
  const yL = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const xR = (rp: number) => xFromRP(rp, L, W, R);

  const path = points
    .filter((p) => p.rp >= RP_MIN && p.rp <= RP_MAX)
    .map((p, i) => `${i ? "L" : "M"}${xR(p.rp).toFixed(1)} ${yL(p.loss).toFixed(1)}`)
    .join(" ");

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <filter id="epGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} rx={10} fill="rgba(4,16,42,0.55)" />
      {RPS.map((rp) => (
        <g key={rp}>
          <line className="grid" x1={xR(rp)} y1={T} x2={xR(rp)} y2={H - B} />
          <text className="axlbl" x={xR(rp)} y={H - B + 14} textAnchor="middle">1-in-{rp}</text>
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const v = (yMax * i) / 5;
        const y = T + (1 - i / 5) * (H - T - B);
        return (
          <g key={i}>
            <line className="grid" x1={L} y1={y} x2={W - R} y2={y} />
            <text className="axlbl" x={L - 6} y={y + 3} textAnchor="end">{money(symbol, v)}</text>
          </g>
        );
      })}
      {layers?.map((ly, idx) => {
        const yTop = yL(ly.exhaust);
        const yBot = yL(ly.attach);
        return (
          <g key={idx}>
            <rect x={L} y={yTop} width={W - L - R} height={Math.max(0, yBot - yTop)}
              fill={idx % 2 ? "rgba(255,108,170,.14)" : "rgba(255,255,255,.05)"}
              stroke="rgba(255,108,170,.5)" strokeWidth={1} />
            <text className="axlbl" x={L + 6} y={(yTop + yBot) / 2 + 3} fill="#cfd6e6">L{idx + 1}</text>
          </g>
        );
      })}
      {path && <path className="curve" d={path} filter="url(#epGlow)" />}
      <line className="axis" x1={L} y1={T} x2={L} y2={H - B} />
      <line className="axis" x1={L} y1={H - B} x2={W - R} y2={H - B} />
      <text className="axlbl" x={L - 54} y={T + 6} transform={`rotate(-90 ${L - 54} ${H / 2})`} textAnchor="middle">
        Combined occurrence loss
      </text>
    </svg>
  );
}

// ── Per-peril MDR(intensity) curve ───────────────────────────────────────────
export function MDRChart({ points, unit }: { points: { intensity: number; mdr: number }[]; unit: string }) {
  const W = 380, H = 200, L = 40, R = 12, T = 12, B = 30;
  if (!points.length) return <div className="poc">No continuous intensity axis for this peril.</div>;
  const xMin = points[0].intensity;
  const xMax = points[points.length - 1].intensity;
  const xP = (v: number) => L + ((v - xMin) / (xMax - xMin || 1)) * (W - L - R);
  const yP = (v: number) => T + (1 - v) * (H - T - B);
  const path = points.map((p, i) => `${i ? "L" : "M"}${xP(p.intensity).toFixed(1)} ${yP(p.mdr).toFixed(1)}`).join(" ");
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <filter id="mdrGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} rx={10} fill="rgba(4,16,42,0.55)" />
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line className="grid" x1={L} y1={yP(g)} x2={W - R} y2={yP(g)} />
          <text className="axlbl" x={L - 5} y={yP(g) + 3} textAnchor="end">{Math.round(g * 100)}%</text>
        </g>
      ))}
      <path className="curve" d={path} filter="url(#mdrGlow)" />
      <line className="axis" x1={L} y1={T} x2={L} y2={H - B} />
      <line className="axis" x1={L} y1={H - B} x2={W - R} y2={H - B} />
      <text className="axlbl" x={(W + L) / 2} y={H - 6} textAnchor="middle">Intensity ({unit})</text>
    </svg>
  );
}
