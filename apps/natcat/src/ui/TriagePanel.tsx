import type { MarketProfile } from "../domain/marketProfiles";
import { OCCUPANCIES, splitFromTotal, totalTIV, type Occupancy, type Submission } from "../domain/inputModel";
import type { TriageResult } from "../domain/triage";
import type { TriageLite } from "../engine/cera-client-ext";
import type { MarginalCheck } from "../domain/portfolio";
import { RAGBadge } from "./atoms";
import { SAMPLE_LOCATIONS } from "../data/samples";
import { money } from "./format";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function TriagePanel({
  profile,
  submission,
  setSubmission,
  onRunTriage,
  loading,
  triage,
  lite,
  onContinue,
  continued,
  marginal,
  hasBook,
}: {
  profile: MarketProfile;
  submission: Submission;
  setSubmission: (s: Submission) => void;
  onRunTriage: () => void;
  loading: boolean;
  triage: TriageResult | null;
  lite: TriageLite | null;
  onContinue: () => void;
  continued: boolean;
  marginal: MarginalCheck | null;
  hasBook: boolean;
}) {
  const ttiv = totalTIV(submission.tiv);
  const samples = SAMPLE_LOCATIONS.filter((s) => s.market === profile.id);

  return (
    <div className="panel">
      <h2>1 · Triage / clearance</h2>
      <div className="sub">
        Three fields for an instant read — address, sum insured and occupancy. Fast Lite-endpoint screen + aggregate check.
      </div>

      <div className="controls" style={{ margin: "0 0 14px", boxShadow: "none" }}>
        <div className="ctl" style={{ flex: "2 1 320px" }}>
          <label>Address / location</label>
          <input
            type="text"
            value={submission.address}
            placeholder="e.g. Brickell Ave, Miami, FL"
            onChange={(e) => setSubmission({ ...submission, address: e.target.value, lat: undefined, lng: undefined })}
          />
        </div>
        <div className="ctl">
          <label>Sum insured (TIV, {profile.currency})</label>
          <input
            type="text"
            inputMode="numeric"
            value={ttiv ? Math.round(ttiv).toLocaleString("en-US") : ""}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
              setSubmission({ ...submission, tiv: splitFromTotal(n, submission.occupancy) });
            }}
          />
        </div>
        <div className="ctl">
          <label>Occupancy</label>
          <select
            value={submission.occupancy}
            onChange={(e) => {
              const occ = e.target.value as Occupancy;
              setSubmission({ ...submission, occupancy: occ, tiv: splitFromTotal(ttiv, occ) });
            }}
          >
            {OCCUPANCIES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="ctl">
          <label>&nbsp;</label>
          <button className="pill-btn on" onClick={onRunTriage} disabled={loading}>
            {loading ? "Screening…" : "Run triage"}
          </button>
        </div>
      </div>

      <div className="pills" style={{ marginBottom: 8 }}>
        <span className="poc" style={{ marginRight: 8 }}>Try a sample:</span>
        {samples.map((s) => (
          <button
            key={s.label}
            className="pill-btn"
            onClick={() =>
              setSubmission({
                ...submission,
                address: s.address,
                lat: s.lat,
                lng: s.lng,
                occupancy: s.occupancy,
                tiv: splitFromTotal(s.tiv, s.occupancy),
              })
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {triage && lite && (
        <div className="readout" style={{ background: "var(--card-grad)", border: "1px solid var(--line-dark)", color: "var(--text)" }}>
          {lite.warning && (
            <div className="note" style={{ margin: "0 0 10px", borderColor: "var(--pink)", borderStyle: "solid", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <AlertTriangle size={15} color="var(--pink)" style={{ flexShrink: 0, marginTop: 1 }} /> <span>{lite.warning}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <RAGBadge decision={triage.decision} />
            <div className="pills">
              {lite.scores.map((s) => (
                <span key={s.peril} className="chip score" title={`CERA® Lite globally-relative hazard score: ${s.score}/5 (${s.band})`}>
                  {profile.perilLabels[s.peril] ?? s.peril}: <b>{s.keyThreshold} ≈ 1-in-{Math.round(s.keyReturnPeriod)}</b>{" "}
                  <span style={{ color: "var(--grey)" }}>({s.band} {s.score}/5)</span>
                </span>
              ))}
            </div>
          </div>
          <div className="poc" style={{ marginTop: 8 }}>
            Return period = how often this location reaches each peril's authority severity threshold (CAT3, 1m flood, Severe wildfire, MMI6, EF2). The <b>x/5</b> in brackets is CERA®'s globally-relative hazard score — a quick "how hot vs everywhere" read, not the triage trigger.
          </div>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
            {triage.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: 12.5 }}>{r}</li>
            ))}
          </ul>
          {hasBook && marginal ? (
            <div className="note" style={{ margin: "10px 0 0", borderStyle: "solid", borderColor: marginal.breach ? "var(--rag-decline)" : "var(--line)" }}>
              <b>Accumulation — Cresta zone {marginal.zone}:</b> zone TIV {money(profile.currencySymbol, marginal.zoneTIVBefore)} → {money(profile.currencySymbol, marginal.zoneTIVAfter)} (limit {money(profile.currencySymbol, marginal.limit)}). Marginal 1-in-100 PML add {money(profile.currencySymbol, marginal.marginalPMLAdd)}.{" "}
              {marginal.breach ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--rag-decline)" }}><AlertTriangle size={13} /> Breaches the zone appetite limit — refer/decline independent of price.</span>
              ) : "Within appetite."}
            </div>
          ) : (
            <div className="poc" style={{ marginTop: 8 }}>No in-force book loaded — aggregate unchecked.</div>
          )}
          {!continued && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={onContinue}>
                {triage.decision === "write" ? "Continue to full assessment" : "Assess anyway — test terms & build referral"} <ArrowRight size={16} />
              </button>
              {triage.decision !== "write" && (
                <div className="poc" style={{ marginTop: 6 }}>
                  Outside appetite on a first read — run the full assessment to see the AAL, test whether terms bring it back in, and generate a referral report to submit.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
