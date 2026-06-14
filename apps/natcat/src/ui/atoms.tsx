import { ChevronDown } from "lucide-react";
import type { Decision } from "../domain/triage";
import type { ConfidenceBand } from "../engine/confidence";

export function RAGBadge({ decision }: { decision: Decision }) {
  const label = decision === "write" ? "Write — auto-quote" : decision === "refer" ? "Refer" : "Decline / strong-refer";
  return (
    <span className={`rag ${decision}`}>
      <span className="dot" /> {label}
    </span>
  );
}

export function ConfidenceMeter({ score, band, label = "Confidence" }: { score: number; band: ConfidenceBand; label?: string }) {
  return (
    <span className="conf" title={`${label}: ${band} (${Math.round(score * 100)}%)`}>
      {label}
      <span className="bar">
        <i style={{ width: `${Math.max(4, Math.round(score * 100))}%` }} />
      </span>
      <span className={`rel ${band}`}>{band} · {Math.round(score * 100)}%</span>
    </span>
  );
}

export function ReliabilityBadge({ score }: { score: number }) {
  const band = score >= 0.9 ? "Excellent" : score >= 0.75 ? "High" : score >= 0.5 ? "Medium" : "Low";
  return <span className={`rel ${band}`}>{band}</span>;
}

export function Chip({ children, kind = "score" }: { children: React.ReactNode; kind?: "score" | "rp" }) {
  return <span className={`chip ${kind}`}>{children}</span>;
}

export function Disclosure({
  title,
  sub,
  open,
  children,
}: {
  title: string;
  sub?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="panel disclosure" open={open}>
      <summary>
        <div>
          <h2>{title}</h2>
          {sub && <div className="sub" style={{ marginBottom: 0 }}>{sub}</div>}
        </div>
        <span className="chev" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronDown size={14} /> expand</span>
      </summary>
      <div style={{ marginTop: 16 }}>{children}</div>
    </details>
  );
}
