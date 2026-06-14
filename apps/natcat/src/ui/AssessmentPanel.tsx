import { useState } from "react";
import type { MarketProfile } from "../domain/marketProfiles";
import { perilLabel } from "../domain/marketProfiles";
import {
  CONSTRUCTIONS,
  ROOF_CLASSES,
  TIER_LABEL,
  type Submission,
} from "../domain/inputModel";
import type { Assessment } from "../domain/aalEngine";
import type { RateAdequacy } from "../domain/pricing";
import { ConfidenceMeter, ReliabilityBadge } from "./atoms";
import { LossEPChart, MDRChart } from "./charts";
import { money, pct } from "./format";
import { AlertTriangle } from "lucide-react";

function nearest100(rows: Assessment["perils"][number]["result"]["rp_curve"]) {
  if (!rows.length) return null;
  return rows.reduce((best, r) => (Math.abs(r.rp - 100) < Math.abs(best.rp - 100) ? r : best), rows[0]);
}

export function AssessmentPanel({
  profile,
  submission,
  setSubmission,
  assessment,
  adequacy,
  live,
}: {
  profile: MarketProfile;
  submission: Submission;
  setSubmission: (s: Submission) => void;
  assessment: Assessment;
  adequacy: RateAdequacy | null;
  live: boolean;
}) {
  const sym = profile.currencySymbol;
  const [focus, setFocus] = useState(assessment.perils[0]?.peril ?? "Flood");
  const focusPeril = assessment.perils.find((p) => p.peril === focus) ?? assessment.perils[0];

  // Where data is assumed or missing on THIS risk.
  const gaps: string[] = [];
  if (!submission.constructionId) gaps.push("Construction not stated → generic occupancy-default vulnerability (EQ/tornado/wildfire all use the broad class).");
  if (submission.yearBuilt == null) gaps.push("Year built not stated → no age-of-construction factor on wind/quake (add it to sharpen the number).");
  if (!submission.roofClass) gaps.push("Roof class not stated → default roof (hail is stubbed regardless).");
  if (submission.firstFloorElevationM == null) gaps.push("First-floor elevation not stated → flood assumes ground-level depth (add elevation to lower flood AAL).");
  if (!submission.secondaryModifiers) gaps.push("No secondary modifiers provided.");
  const defaults = [
    `Flood region defaulted to "${profile.defaultFloodRegion}" and cyclone basin to "${profile.cycloneBasin}" from the market profile.`,
    "TIV split A/B/C/D assumed from occupancy-typical shares (BI held out of the MDR step).",
  ];
  const pocPerils = assessment.perils.filter((p) => p.result.poc_disclaimer).map((p) => perilLabel(profile, p.peril));

  return (
    <div className="panel">
      <h2>3 · Full assessment, per-peril and total AAL</h2>
      <div className="sub">
        Each COPE field is optional and raises confidence. {TIER_LABEL[assessment.tier]} · completeness {pct(assessment.completeness, 0)}.
      </div>

      {/* COPE drop-downs */}
      <div className="controls" style={{ margin: "0 0 16px", boxShadow: "none" }}>
        <div className="ctl">
          <label>Construction</label>
          <select
            value={submission.constructionId ?? ""}
            onChange={(e) => setSubmission({ ...submission, constructionId: e.target.value || undefined })}
          >
            <option value="">— not stated —</option>
            {CONSTRUCTIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="ctl">
          <label>Year built</label>
          <input
            type="number"
            value={submission.yearBuilt ?? ""}
            placeholder="—"
            min={1850}
            max={2026}
            onChange={(e) => setSubmission({ ...submission, yearBuilt: e.target.value ? +e.target.value : undefined })}
          />
        </div>
        <div className="ctl">
          <label>Roof class</label>
          <select
            value={submission.roofClass ?? ""}
            onChange={(e) => setSubmission({ ...submission, roofClass: e.target.value || undefined })}
          >
            <option value="">— not stated —</option>
            {ROOF_CLASSES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="ctl">
          <label>First-floor elevation (m)</label>
          <input
            type="number"
            value={submission.firstFloorElevationM ?? ""}
            placeholder="—"
            step={0.1}
            onChange={(e) => setSubmission({ ...submission, firstFloorElevationM: e.target.value ? +e.target.value : undefined })}
          />
        </div>
        <div className="ctl">
          <label>Secondary modifiers</label>
          <button
            className={`pill-btn ${submission.secondaryModifiers ? "on" : ""}`}
            onClick={() => setSubmission({ ...submission, secondaryModifiers: !submission.secondaryModifiers })}
          >
            {submission.secondaryModifiers ? "Provided" : "Add"}
          </button>
        </div>
        <div className="ctl">
          <label>Charged rate (% TIV)</label>
          <input
            type="number"
            step={0.01}
            min={0}
            placeholder="for rate adequacy"
            value={submission.chargedRatePct != null ? +(submission.chargedRatePct * 100).toFixed(3) : ""}
            onChange={(e) => setSubmission({ ...submission, chargedRatePct: e.target.value ? +e.target.value / 100 : undefined })}
          />
        </div>
        <div className="ctl">
          <label>BI factor (Section 2)</label>
          <input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={submission.biFactor ?? 1}
            onChange={(e) => setSubmission({ ...submission, biFactor: e.target.value === "" ? 0 : +e.target.value })}
          />
        </div>
        <div className="ctl">
          <label>Indemnity period (months)</label>
          <input
            type="number"
            step={1}
            min={0}
            max={36}
            value={submission.indemnityMonths ?? 12}
            onChange={(e) => setSubmission({ ...submission, indemnityMonths: e.target.value === "" ? 0 : +e.target.value })}
          />
        </div>
      </div>

      <div className="poc" style={{ margin: "-6px 0 12px" }}>
        Section 2 (BI): if the building is 40% damaged we assume ~40% of the declared BI value (split D, {money(sym, assessment.biTIV)}) is lost while it's repaired — factor adjustable, capped by the indemnity period.
      </div>

      <div className="grid2">
        {/* headline + per-peril table */}
        <div>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
            <div>
              <div className="poc">Total AAL (Section 1 + Section 2)</div>
              <div className="bignum">
                {money(sym, assessment.totalAAL)} <span className="unit">/ yr</span>
              </div>
              <div className="poc">{pct(assessment.aalRate)} of TIV ({money(sym, assessment.totalTIV)})</div>
              <div className="poc" style={{ marginTop: 4 }}>
                S1 Material Damage <b>{money(sym, assessment.section1AAL)}</b> · S2 Business Interruption <b>{money(sym, assessment.section2AAL)}</b>
              </div>
            </div>
            <div>
              <ConfidenceMeter score={assessment.confidence.score} band={assessment.confidence.band} />
              {adequacy && (
                <div style={{ marginTop: 8 }} className={`rel ${adequacy.status === "underpriced" ? "Low" : adequacy.status === "overpriced" ? "Medium" : "Excellent"}`}>
                  Rate adequacy: charged {pct(adequacy.chargedRate)} vs technical {pct(adequacy.technicalRate)} ·{" "}
                  {adequacy.status === "adequate" ? "adequate" : `${Math.abs(adequacy.deltaPct).toFixed(0)}% ${adequacy.deltaPct < 0 ? "underpriced" : "overpriced"}`}
                </div>
              )}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Peril</th>
                <th>Reliability</th>
                <th>1-in-100</th>
                <th>AAL</th>
                <th>Rate</th>
                <th>Conf.</th>
              </tr>
            </thead>
            <tbody>
              {assessment.perils.map((p) => {
                const r = nearest100(p.result.rp_curve);
                const sev = p.result.is_bernoulli
                  ? `Severe`
                  : r
                  ? `${r.intensity_native}${typeof r.intensity_native === "number" ? p.result.intensity_unit_native : ""}`
                  : "—";
                return (
                  <tr key={p.peril}>
                    <td>{perilLabel(profile, p.peril)}</td>
                    <td><ReliabilityBadge score={p.confidence.reliability} /></td>
                    <td>{sev}</td>
                    <td>{money(sym, p.result.aal)}</td>
                    <td>{pct(p.result.aal_rate)}</td>
                    <td><span className={`rel ${p.confidence.band}`}>{p.confidence.band}</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td></td>
                <td></td>
                <td>{money(sym, assessment.totalAAL)}</td>
                <td>{pct(assessment.aalRate)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* charts */}
        <div>
          <div className="sechead">Combined occurrence EP curve</div>
          <LossEPChart points={assessment.combinedEP} maxLoss={assessment.damageableTIV} symbol={sym} />
          <div className="sechead" style={{ marginTop: 14 }}>
            Vulnerability (MDR) ·{" "}
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value as typeof focus)}
              style={{ minWidth: 120, padding: "3px 6px", fontSize: 12 }}
            >
              {assessment.perils.map((p) => (
                <option key={p.peril} value={p.peril}>{perilLabel(profile, p.peril)}</option>
              ))}
            </select>
          </div>
          {focusPeril && <MDRChart points={focusPeril.result.mdr_curve} unit={focusPeril.result.intensity_unit_physical} />}
          {focusPeril?.result.poc_disclaimer && <div className="poc" style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 6 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: "var(--rag-refer)" }} /> <span>{focusPeril.result.poc_disclaimer}</span></div>}

          {focusPeril && focusPeril.result.rp_curve.length > 0 && (
            <>
              <div className="sechead" style={{ marginTop: 16 }}>MDR &amp; loss contribution by return period</div>
              <table>
                <thead>
                  <tr>
                    <th>RP (yr)</th>
                    <th>Intensity</th>
                    <th>MDR</th>
                    <th>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {focusPeril.result.rp_curve.map((r, i) => (
                    <tr key={i}>
                      <td>{r.rp < 10 ? r.rp.toFixed(2) : `1-in-${Math.round(r.rp)}`}</td>
                      <td>
                        {typeof r.intensity_native === "number"
                          ? `${r.intensity_native} ${focusPeril.result.intensity_unit_native}`
                          : r.intensity_native}
                      </td>
                      <td>{pct(r.mdr, 1)}</td>
                      <td>{money(sym, r.contribution)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total AAL</td>
                    <td></td>
                    <td></td>
                    <td>{money(sym, focusPeril.result.aal)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      </div>

      <div className="note" style={{ marginTop: 16, borderStyle: "solid", borderColor: "var(--line-dark)" }}>
        <div style={{ marginBottom: 6 }}>
          <b>Data source:</b>{" "}
          {live ? (
            <span className="rel Excellent">Live CERA® feed</span>
          ) : (
            <span className="rel Medium">CERA® reference data</span>
          )}
        </div>
        <b>Where data is assumed or missing on this risk:</b>
        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          {gaps.map((g, i) => <li key={`g${i}`}>{g}</li>)}
          {defaults.map((d, i) => <li key={`d${i}`}>{d}</li>)}
          <li><b>Not in this number:</b> {profile.roadmapPerils.map((p) => perilLabel(profile, p)).join(", ")} (roadmap ~year-end 2026, hazard stubbed). EU windstorm &amp; Canada out of scope.</li>
          {pocPerils.length > 0 && <li><b>Unit conversions in play:</b> {pocPerils.join(", ")}. See the note under the MDR chart.</li>}
        </ul>
      </div>
    </div>
  );
}
