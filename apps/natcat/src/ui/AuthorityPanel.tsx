import { useRef } from "react";
import type { MarketProfile } from "../domain/marketProfiles";
import { perilLabel } from "../domain/marketProfiles";
import type { Authority, RuleAction } from "../domain/authority";
import { OCCUPANCIES, CONSTRUCTIONS, type Occupancy } from "../domain/inputModel";
import { money, pct } from "./format";
import {
  Users,
  ListFilter,
  Activity,
  SlidersHorizontal,
  ShieldCheck,
  Save,
  RotateCcw,
  Download,
  Upload,
  CircleDot,
  CheckCircle2,
} from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

// Defined at MODULE scope (not inside AuthorityPanel) so React keeps a stable
// component identity and the inputs don't lose focus while you type.
function ActionSelect({ value, onChange, disabled }: { value: RuleAction; onChange: (a: RuleAction) => void; disabled?: boolean }) {
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as RuleAction)} style={{ minWidth: 90, padding: "3px 6px", fontSize: 12 }}>
      <option value="refer">refer</option>
      <option value="decline">decline</option>
    </select>
  );
}

// `money` shows thousands separators and a wide box for large values (TIV);
// otherwise it's a plain numeric field that allows decimals/steps.
function Num({ value, onChange, step = 1, suffix, disabled, money }: { value: number; onChange: (n: number) => void; step?: number; suffix?: string; disabled?: boolean; money?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {money ? (
        <input
          className="miniinput"
          type="text"
          inputMode="numeric"
          value={value ? Math.round(value).toLocaleString("en-US") : ""}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          style={{ minWidth: 150, textAlign: "right" }}
        />
      ) : (
        <input
          className="miniinput"
          type="number"
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(+e.target.value || 0)}
        />
      )}
      {suffix && <span className="poc">{suffix}</span>}
    </span>
  );
}

export function AuthorityPanel({
  authority,
  setAuthority,
  role,
  setRole,
  profile,
  dirty,
  onSave,
  onReset,
}: {
  authority: Authority;
  setAuthority: (a: Authority) => void;
  role: "underwriter" | "manager";
  setRole: (r: "underwriter" | "manager") => void;
  profile: MarketProfile;
  dirty: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  const ro = role === "underwriter";
  const sym = profile.currencySymbol;
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<Authority>) =>
    setAuthority({ ...authority, ...patch, meta: { setBy: "Manager / Capacity provider", setDate: today() } });


  function exportJSON() {
    const blob = new Blob([JSON.stringify(authority, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "underwriting-authority.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      setAuthority(parsed);
    } catch {
      /* ignore bad file */
    }
  }

  const toggleOcc = (o: Occupancy) => {
    const has = authority.permittedOccupancies.includes(o);
    update({ permittedOccupancies: has ? authority.permittedOccupancies.filter((x) => x !== o) : [...authority.permittedOccupancies, o] });
  };
  const toggleCon = (id: string) => {
    const has = authority.permittedConstructions.includes(id);
    update({ permittedConstructions: has ? authority.permittedConstructions.filter((x) => x !== id) : [...authority.permittedConstructions, id] });
  };

  return (
    <>
      {/* Save / status strip */}
      <div className="bevcard" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "14px 20px", borderColor: dirty ? "var(--pink)" : "var(--line)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
          {dirty ? (
            <>
              <CircleDot size={17} color="var(--pink)" />
              <span><b>Unsaved changes</b> — click <b>Save rules</b> to keep them.</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={17} color="var(--rag-write)" />
              <span><b>All changes saved</b> — stored in this browser and reloaded automatically.</span>
            </>
          )}
        </span>
        <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={onSave} disabled={ro || !dirty}><Save size={15} /> Save rules</button>
          <button className="btn btn-sm" onClick={onReset} disabled={ro} title="Restore the default authority"><RotateCcw size={14} /> Reset</button>
        </span>
      </div>

      {/* Access & referral */}
      <section className="bevcard">
        <div className="card-head">
          <span className="eyebrow">Access</span>
          <h3><Users size={18} strokeWidth={1.75} /> Who can edit, and where referrals go</h3>
          <div className="desc">Authority is granted by the capacity provider (a Lloyd's Syndicate DUA team for a US coverholder). Managers edit the rules; underwriters view them. Anything outside the rules is referred for prior submit.</div>
        </div>
        <div className="controls" style={{ margin: 0, boxShadow: "none", background: "transparent", padding: 0, border: "none" }}>
          <div className="ctl">
            <label>Your role</label>
            <div className="pills">
              <button className={`pill-btn ${role === "underwriter" ? "on" : ""}`} onClick={() => setRole("underwriter")}>Underwriter (view only)</button>
              <button className={`pill-btn ${role === "manager" ? "on" : ""}`} onClick={() => setRole("manager")}>Manager / Capacity Provider</button>
            </div>
          </div>
          <div className="ctl">
            <label>Refer outside-appetite risks to</label>
            <input type="text" placeholder="e.g. Hudson" value={authority.referTo} disabled={ro} onChange={(e) => update({ referTo: e.target.value })} />
          </div>
          <div className="ctl">
            <label>Last set by</label>
            <div className="poc">{authority.meta.setBy} · {authority.meta.setDate}</div>
          </div>
          <div className="ctl" style={{ marginLeft: "auto" }}>
            <label>Share guidelines (JSON)</label>
            <div className="pills">
              <button className="btn btn-sm btn-ghost" onClick={exportJSON}><Download size={14} /> Export</button>
              <label className="btn btn-sm btn-ghost" style={{ cursor: ro ? "not-allowed" : "pointer", opacity: ro ? 0.45 : 1 }}>
                <Upload size={14} /> Import<input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} disabled={ro} onChange={importJSON} />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="bevcard">
        <div className="card-head">
          <span className="eyebrow">Stage 1 · eligibility</span>
          <h3><ListFilter size={18} strokeWidth={1.75} /> What you may write</h3>
          <div className="desc">Hard limits checked the moment a risk is screened — size, occupancy, construction, location and accumulation.</div>
        </div>
        <table>
          <tbody>
            <tr>
              <td>Max sum insured per location</td>
              <td><Num disabled={ro} money value={authority.maxTIVPerLocation} onChange={(n) => update({ maxTIVPerLocation: n })} suffix={sym} /></td>
              <td><ActionSelect disabled={ro} value={authority.maxTIVAction} onChange={(a) => update({ maxTIVAction: a })} /></td>
            </tr>
            <tr>
              <td>Permitted occupancies</td>
              <td colSpan={2}>
                <div className="pills">
                  {OCCUPANCIES.map((o) => (
                    <button key={o.id} className={`pill-btn ${authority.permittedOccupancies.includes(o.id) ? "on" : ""}`} disabled={ro} onClick={() => toggleOcc(o.id)}>{o.label}</button>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td>Permitted constructions<div className="poc">none ticked = all allowed</div></td>
              <td colSpan={2}>
                <div className="pills">
                  {CONSTRUCTIONS.map((c) => (
                    <button key={c.id} className={`pill-btn ${authority.permittedConstructions.includes(c.id) ? "on" : ""}`} disabled={ro} onClick={() => toggleCon(c.id)}>{c.label}</button>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td>Excluded zones / states<div className="poc">comma-separated</div></td>
              <td colSpan={2}>
                <input type="text" style={{ width: "100%" }} disabled={ro} value={authority.excludedZones.join(", ")} onChange={(e) => update({ excludedZones: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </td>
            </tr>
            <tr>
              <td>Max share of the book in one Cresta zone</td>
              <td><Num disabled={ro} value={authority.maxAggregateZoneSharePct} onChange={(n) => update({ maxAggregateZoneSharePct: n })} suffix="%" /></td>
              <td><ActionSelect disabled={ro} value={authority.aggregateAction} onChange={(a) => update({ aggregateAction: a })} /></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Hazard frequency */}
      <section className="bevcard">
        <div className="card-head">
          <span className="eyebrow">Stage 1 · hazard</span>
          <h3><Activity size={18} strokeWidth={1.75} /> How exposed is too exposed</h3>
          <div className="desc">Refer or decline if the location reaches a given severity more often than the chosen return period. (A '1-in-50' return period means a 2% chance each year.)</div>
        </div>
        <table>
          <thead><tr><th>Peril</th><th>Severity threshold</th><th>Refer/decline if more frequent than</th><th>Action</th></tr></thead>
          <tbody>
            {authority.hazardRules.map((hr, i) => (
              <tr key={hr.id}>
                <td>{perilLabel(profile, hr.peril)}</td>
                <td>{hr.threshold}</td>
                <td>1-in-<input className="miniinput" type="number" step={5} disabled={ro} value={hr.moreFrequentThanRP} onChange={(e) => { const c = [...authority.hazardRules]; c[i] = { ...hr, moreFrequentThanRP: +e.target.value || 0 }; update({ hazardRules: c }); }} /></td>
                <td><ActionSelect disabled={ro} value={hr.action} onChange={(a) => { const c = [...authority.hazardRules]; c[i] = { ...hr, action: a }; update({ hazardRules: c }); }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Stage 2 gates */}
      <section className="bevcard">
        <div className="card-head">
          <span className="eyebrow">Stage 2 · pricing &amp; confidence</span>
          <h3><SlidersHorizontal size={18} strokeWidth={1.75} /> When to auto-bind, refer or decline</h3>
          <div className="desc">Applied once the risk is fully assessed — on the expected-loss rate, the data confidence, the tail loss, and the charged rate. ('AAL rate' is expected annual loss as a percentage of sum insured.)</div>
        </div>
        <table>
          <tbody>
            <tr><td>Auto-bind if AAL rate is at or below</td><td><Num disabled={ro} value={+(authority.writeMaxAALRate * 100).toFixed(2)} step={0.1} onChange={(n) => update({ writeMaxAALRate: n / 100 })} suffix="% of TIV" /></td><td className="poc">else refer</td></tr>
            <tr><td>Decline if AAL rate is above</td><td><Num disabled={ro} value={+(authority.declineMinAALRate * 100).toFixed(2)} step={0.1} onChange={(n) => update({ declineMinAALRate: n / 100 })} suffix="% of TIV" /></td><td className="poc">decline</td></tr>
            <tr><td>Refer if data confidence below</td><td><Num disabled={ro} value={+(authority.minConfidence * 100).toFixed(0)} onChange={(n) => update({ minConfidence: n / 100 })} suffix="%" /></td><td className="poc">refer</td></tr>
            <tr><td>Decline if data confidence below</td><td><Num disabled={ro} value={+(authority.declineMaxConfidence * 100).toFixed(0)} onChange={(n) => update({ declineMaxConfidence: n / 100 })} suffix="%" /></td><td className="poc">decline</td></tr>
            <tr><td>Decline if 1-in-100 loss above</td><td><Num disabled={ro} value={+(authority.declineMax1in100Rate * 100).toFixed(0)} onChange={(n) => update({ declineMax1in100Rate: n / 100 })} suffix="% of TIV" /></td><td className="poc">decline</td></tr>
            <tr><td>Charged rate must be at least</td><td><Num disabled={ro} value={+(authority.rateFloorPctOfTechnical * 100).toFixed(0)} onChange={(n) => update({ rateFloorPctOfTechnical: n / 100 })} suffix="% of technical" /></td><td><ActionSelect disabled={ro} value={authority.rateFloorAction} onChange={(a) => update({ rateFloorAction: a })} /></td></tr>
          </tbody>
        </table>
        <div className="poc" style={{ marginTop: 10 }}>Auto-bind window: at or below {pct(authority.writeMaxAALRate)} write · {pct(authority.writeMaxAALRate)}–{pct(authority.declineMinAALRate)} refer · above {pct(authority.declineMinAALRate)} decline.</div>
      </section>

      {/* Minimum terms */}
      <section className="bevcard">
        <div className="card-head">
          <span className="eyebrow">Stage 2 · terms floors</span>
          <h3><ShieldCheck size={18} strokeWidth={1.75} /> Minimum terms you must apply</h3>
          <div className="desc">Floors the pricing step enforces on every quote — minimum deductibles and a mandatory flood sublimit.</div>
        </div>
        <table>
          <tbody>
            <tr><td>Minimum wind deductible</td><td><Num disabled={ro} value={authority.minWindDedPct} step={0.5} onChange={(n) => update({ minWindDedPct: n })} suffix="% of TIV" /></td></tr>
            <tr><td>Minimum earthquake deductible</td><td><Num disabled={ro} value={authority.minQuakeDedPct} step={0.5} onChange={(n) => update({ minQuakeDedPct: n })} suffix="% of TIV" /></td></tr>
            <tr><td>Flood sublimit</td><td><button className={`pill-btn ${authority.mandatoryFloodSublimit ? "on" : ""}`} disabled={ro} onClick={() => update({ mandatoryFloodSublimit: !authority.mandatoryFloodSublimit })}>{authority.mandatoryFloodSublimit ? "Mandatory" : "Optional"}</button></td></tr>
          </tbody>
        </table>
      </section>
    </>
  );
}
