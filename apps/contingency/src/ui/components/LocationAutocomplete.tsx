import { useState, useRef, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { geosearch, type GeoCandidate } from "../../lib/api";

export function LocationAutocomplete({
  value, onChange, onSelect, placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  onSelect: (c: GeoCandidate) => void;
  placeholder?: string;
}) {
  const [results, setResults] = useState<GeoCandidate[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const justChose = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (justChose.current) { justChose.current = false; return; }
    if (value.trim().length < 2) { setResults([]); setOpen(false); return; }
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try { const r = await geosearch(value); setResults(r); setActive(-1); setOpen(true); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 280);
    return () => window.clearTimeout(timer.current);
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const choose = (c: GeoCandidate) => { justChose.current = true; onSelect(c); setOpen(false); setResults([]); setActive(-1); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(results[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Search size={15} style={{ position: "absolute", left: 11, color: "var(--txt-faint)", pointerEvents: "none" }} />
        <input
          className="input"
          style={{ paddingLeft: 33 }}
          value={value}
          placeholder={placeholder ?? "Search a venue or city…"}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKey}
        />
        {loading && <span className="spinner" style={{ position: "absolute", right: 11, width: 14, height: 14 }} />}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 40, top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)",
          boxShadow: "0 18px 40px -16px rgba(0,0,0,0.7)", overflow: "hidden", maxHeight: 280, overflowY: "auto",
        }}>
          {results.map((c, i) => (
            <div key={i}
              onMouseDown={(e) => { e.preventDefault(); choose(c); }}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 12px", cursor: "pointer",
                background: i === active ? "var(--row-hover)" : "transparent",
                borderTop: i ? "1px solid var(--line-soft)" : "none",
              }}>
              <MapPin size={14} style={{ color: "var(--pink)", marginTop: 2, flex: "none" }} />
              <span style={{ fontSize: 13, lineHeight: 1.35, color: "var(--txt)" }}>
                {c.label.split(",").slice(0, 2).join(",")}
                <span style={{ color: "var(--txt-dim)" }}>{c.label.split(",").length > 2 ? `, ${c.label.split(",").slice(2).join(",").trim()}` : ""}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
