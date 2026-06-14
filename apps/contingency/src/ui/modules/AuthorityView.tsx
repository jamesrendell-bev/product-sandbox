import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { type WeatherAuthority, saveWeatherAuthority, resetWeatherAuthority, THRESHOLD_NOTES } from "../../domain/weatherAuthority";
import { type Authority as CatAuthority, saveAuthority, resetAuthority } from "../../domain/authority";
import { catIcon } from "../../lib/perils";
import { ViewHead, PerilIcon } from "../components/ui";

const WROWS: { key: keyof WeatherAuthority["thresholds"]; icon: string; label: string; unit: string; op: string }[] = [
  { key: "rain", icon: "rainfall", label: "Rainfall (heaviest day)", unit: "mm", op: "≥" },
  { key: "windspeed", icon: "windspeed", label: "Wind speed (sustained)", unit: "km/h", op: "≥" },
  { key: "windgust", icon: "windgust", label: "Wind gust (peak)", unit: "km/h", op: "≥" },
  { key: "heat", icon: "temperature", label: "Temperature — heat", unit: "°C", op: "≥" },
  { key: "cold", icon: "temperature", label: "Temperature — cold", unit: "°C", op: "≤" },
  { key: "snow_outdoor", icon: "snowfall", label: "Snowfall — outdoor", unit: "mm", op: "≥" },
  { key: "snow_indoor", icon: "snowfall", label: "Snowfall — indoor", unit: "mm", op: "≥" },
];

function NumberField({ value, onChange, suffix, width = 80 }: { value: number; onChange: (n: number) => void; suffix?: string; width?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <input className="input" style={{ width, textAlign: "right" }} type="number" value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(parseFloat(e.target.value))} />
      {suffix && <span style={{ fontSize: 12.5, color: "var(--txt-dim)", whiteSpace: "nowrap" }}>{suffix}</span>}
    </span>
  );
}

export function AuthorityView({
  weatherAuth, setWeatherAuth, catAuth, setCatAuth,
}: { weatherAuth: WeatherAuthority; setWeatherAuth: (a: WeatherAuthority) => void; catAuth: CatAuthority; setCatAuth: (a: CatAuthority) => void }) {
  const [draft, setDraft] = useState<WeatherAuthority>(() => structuredClone(weatherAuth));
  const [cat, setCat] = useState<CatAuthority>(() => structuredClone(catAuth));
  const [dirty, setDirty] = useState(false);
  const touch = (next: WeatherAuthority) => { setDraft(next); setDirty(true); };

  const save = () => { saveWeatherAuthority(draft); setWeatherAuth(structuredClone(draft)); saveAuthority(cat); setCatAuth(structuredClone(cat)); setDirty(false); };
  const reset = () => { const w = resetWeatherAuthority(); const c = resetAuthority(); setDraft(structuredClone(w)); setWeatherAuth(w); setCat(structuredClone(c)); setCatAuth(c); setDirty(false); };

  return (
    <>
      <ViewHead
        eyebrow="Configure · Underwriting authority"
        title="Referral thresholds"
        sub="Set the weather level that would cancel an event, and the probability at which a peril is referred or declined. Saved to this browser. The basis for the defaults is in Guidance."
      />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
          <div className="card-title" style={{ margin: 0 }}>Weather cancellation thresholds</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-light btn-sm" onClick={reset}><RotateCcw size={14} /> Reset defaults</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={!dirty}><Save size={14} /> {dirty ? "Save" : "Saved"}</button>
          </div>
        </div>

        <div>
          {WROWS.map((r) => (
            <div key={r.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 16, padding: "13px 0", borderTop: "1px solid var(--line-soft)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, color: "var(--txt)" }}><PerilIcon name={r.icon} /> {r.label}</div>
                <div style={{ fontSize: 12, color: "var(--txt-dim)", marginTop: 4, maxWidth: 620 }}>{THRESHOLD_NOTES[r.key]}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--txt-dim)", fontWeight: 700 }}>{r.op}</span>
                <NumberField value={draft.thresholds[r.key]} suffix={r.unit} onChange={(n) => touch({ ...draft, thresholds: { ...draft.thresholds, [r.key]: n } })} />
              </div>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Refer when probability ≥</label>
            <NumberField width={90} suffix="%" value={Math.round(draft.referralProbability * 100)} onChange={(n) => touch({ ...draft, referralProbability: (n || 0) / 100 })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Decline when probability ≥</label>
            <NumberField width={90} suffix="%" value={Math.round(draft.declineProbability * 100)} onChange={(n) => touch({ ...draft, declineProbability: (n || 0) / 100 })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Climatology lookback</label>
            <NumberField width={90} suffix="years" value={draft.lookbackYears} onChange={(n) => touch({ ...draft, lookbackYears: Math.round(n) || 15 })} />
          </div>
        </div>
      </div>

      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--txt-dim)" }}>
          Catastrophe thresholds (secondary catastrophe-exposure view) ▾
        </summary>
        <div style={{ marginTop: 14 }}>
          {cat.hazardRules.map((r) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 14, padding: "11px 0", borderTop: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, color: "var(--txt)" }}><PerilIcon name={catIcon(r.peril)} /> {r.label} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· {r.threshold}</span></div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--txt-dim)", fontSize: 13, whiteSpace: "nowrap" }}>1-in-
                <input className="input" style={{ width: 78, textAlign: "right" }} type="number" min={1} value={r.moreFrequentThanRP}
                  onChange={(e) => { setCat({ ...cat, hazardRules: cat.hazardRules.map((h) => h.id === r.id ? { ...h, moreFrequentThanRP: parseInt(e.target.value, 10) || 1 } : h) }); setDirty(true); }} /> yrs
              </span>
              <select className="select" style={{ width: 116 }} value={r.action}
                onChange={(e) => { setCat({ ...cat, hazardRules: cat.hazardRules.map((h) => h.id === r.id ? { ...h, action: e.target.value as "refer" | "decline" } : h) }); setDirty(true); }}>
                <option value="refer">Refer</option><option value="decline">Decline</option>
              </select>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
