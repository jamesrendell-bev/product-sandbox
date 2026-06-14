import type { MarketProfile } from "../domain/marketProfiles";
import type { WordingSchedule } from "../domain/wording";
import { availableLMAAddOns } from "../domain/wording";
import { pct } from "./format";

export function WordingPanel({
  profile,
  schedule,
  lma,
  setLma,
}: {
  profile: MarketProfile;
  schedule: WordingSchedule;
  lma: string[];
  setLma: (l: string[]) => void;
}) {
  const toggle = (c: string) => setLma(lma.includes(c) ? lma.filter((x) => x !== c) : [...lma, c]);

  return (
    <>
      <div className="sub" style={{ marginBottom: 14 }}>
        Clause selection against the <b>{schedule.templateName}</b>. Section skeletons only — production plugs in licensed wording.
      </div>

      <div className="grid2">
        <div>
          <div className="sechead">Sections</div>
          <table>
            <thead><tr><th>Section</th><th>Status</th></tr></thead>
            <tbody>
              {schedule.sections.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}{s.note && <div className="poc">{s.note}</div>}</td>
                  <td><span className={`rel ${s.status === "included" ? "Excellent" : s.status === "n/a" ? "Medium" : "Low"}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {profile.allowLMAClauses && (
            <>
              <div className="sechead" style={{ marginTop: 16 }}>LMA clause add-ons (Lloyd's-US)</div>
              <div className="pills">
                {availableLMAAddOns().map((c) => (
                  <button key={c} className={`pill-btn ${lma.includes(c) ? "on" : ""}`} onClick={() => toggle(c)}>{c}</button>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="sechead">Schedule — perils, sub-limits, deductibles</div>
          <table>
            <thead><tr><th>Peril</th><th>Covered</th><th>Sub-limit</th><th>Deductible</th></tr></thead>
            <tbody>
              {schedule.scheduleRows.map((r) => (
                <tr key={r.peril}>
                  <td>{r.label}</td>
                  <td>{r.covered ? "Yes" : "—"}</td>
                  <td>{r.sublimitPct}% TIV</td>
                  <td>{pct(r.deductiblePct / 100, 1)} ({r.basis})</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="sechead" style={{ marginTop: 16 }}>Exclusions / memoranda</div>
          <ul style={{ fontSize: 12.5, paddingLeft: 18 }}>
            {schedule.exclusions.map((e, i) => <li key={i}>{e}</li>)}
            {schedule.lmaAddOns.map((e, i) => <li key={`lma${i}`}>{e} (added)</li>)}
          </ul>
        </div>
      </div>
    </>
  );
}
