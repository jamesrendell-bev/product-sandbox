import type { ReactNode, CSSProperties } from "react";

// Brand peril line-icon, coloured via currentColor using a CSS mask.
export function PerilIcon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const style: CSSProperties = {
    display: "inline-block",
    width: size,
    height: size,
    backgroundColor: color ?? "currentColor",
    WebkitMaskImage: `url(/brand/perils/${name}.svg)`,
    maskImage: `url(/brand/perils/${name}.svg)`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    flex: "none",
  };
  return <span style={style} aria-hidden />;
}

export type Rag = "green" | "amber" | "red" | "neutral";
export function RagChip({ rag, children }: { rag: Rag; children: ReactNode }) {
  return <span className={`chip rag-${rag}`}>{children}</span>;
}

export function ViewHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: ReactNode }) {
  return (
    <div className="view-head">
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="view-title">{title}</h1>
      <div className="pink-rule" />
      {sub && <p className="view-sub">{sub}</p>}
    </div>
  );
}

export function Spinner({ large }: { large?: boolean }) {
  return <span className={`spinner${large ? " spinner-lg" : ""}`} />;
}

// 1..5 score dots
export function ScoreDots({ score }: { score: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, verticalAlign: "middle" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: i <= score ? (score >= 4 ? "var(--danger)" : score >= 3 ? "var(--warn)" : "var(--ok)") : "var(--line-light)",
          }}
        />
      ))}
    </span>
  );
}

export function severityRag(sev: string): Rag {
  return sev === "high" ? "red" : sev === "medium" ? "amber" : "neutral";
}
export function flagRag(flag: string): Rag {
  return flag === "red" ? "red" : flag === "amber" ? "amber" : "green";
}

export function SourceList({ sources }: { sources: { url: string; title?: string }[] }) {
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div className="section-label">Sources ({sources.length})</div>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
        {sources.map((s, i) => (
          <li key={i}>
            <a className="src-link" href={s.url} target="_blank" rel="noreferrer">
              {s.title || s.url}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
