// src/ui/ReferralReport.tsx
//
// §9 — Referral report. When the decision is refer/decline, one click opens a
// branded, print-friendly view (new window + window.print() → PDF). Replaces the
// MGA hand-writing a contextual email to their capacity provider.

import type { MarketProfile } from "../domain/marketProfiles";
import { perilLabel } from "../domain/marketProfiles";
import type { Submission } from "../domain/inputModel";
import { constructionById } from "../domain/inputModel";
import type { Assessment } from "../domain/aalEngine";
import type { TriageLite } from "../engine/cera-client-ext";
import type { PerilNet, PerilTerms } from "../domain/terms";
import type { LayerResult } from "../domain/terms";
import type { PriceBuildUp, RateAdequacy } from "../domain/pricing";
import type { Authority, Decision, FiredRule } from "../domain/authority";
import { money, pct, rpFmt } from "./format";

export interface ReferralData {
  profile: MarketProfile;
  submission: Submission;
  assessment: Assessment;
  lite: TriageLite | null;
  terms: Record<string, PerilTerms>;
  nets: PerilNet[];
  tower: { layers: LayerResult[]; totalEL: number };
  build: PriceBuildUp;
  adequacy: RateAdequacy | null;
  decision: Decision;
  fired: FiredRule[];
  authority: Authority;
  live: boolean;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

function gapsFor(s: Submission): string[] {
  const g: string[] = [];
  if (!s.constructionId) g.push("Construction not stated → generic occupancy-default vulnerability.");
  if (s.yearBuilt == null) g.push("Year built not stated → no age factor on wind/quake.");
  if (!s.roofClass) g.push("Roof class not stated → default roof.");
  if (s.firstFloorElevationM == null) g.push("First-floor elevation not stated → flood uses ground-level depth.");
  return g;
}

function buildHTML(d: ReferralData): string {
  const { profile, submission: s, assessment: a, build, decision, fired, authority } = d;
  const sym = profile.currencySymbol;
  const con = constructionById(s.constructionId);
  const today = new Date().toISOString().slice(0, 10);

  const perilRows = a.perils
    .map(
      (p) => `<tr><td>${esc(perilLabel(profile, p.peril))}</td><td>${money(sym, p.s1)}</td><td>${money(sym, p.s2)}</td>
      <td>${money(sym, p.s1 + p.s2)}</td><td>${p.confidence.band} · rel ${(p.confidence.reliability * 100).toFixed(0)}%</td></tr>`
    )
    .join("");

  const liteRows = (d.lite?.scores ?? [])
    .map((sc) => `<tr><td>${esc(perilLabel(profile, sc.peril))}</td><td>${esc(sc.band)} (${sc.score}/5)</td><td>${esc(sc.keyThreshold)} ≈ 1-in-${Math.round(sc.keyReturnPeriod)}</td></tr>`)
    .join("");

  const termRows = d.nets
    .map((n) => {
      const t = d.terms[n.peril];
      return `<tr><td>${esc(perilLabel(profile, n.peril))}</td><td>${t.deductiblePct}% (${t.basis})</td><td>${t.sublimitPct}%</td><td>${money(sym, n.netAAL)}</td></tr>`;
    })
    .join("");

  const layerRows = d.tower.layers
    .map((ly) => `<tr><td>L${ly.index + 1}</td><td>${sym}${(ly.limit / 1e6).toFixed(2)}m xs ${sym}${(ly.attach / 1e6).toFixed(2)}m</td><td>${rpFmt(ly.probTouch)}</td><td>${money(sym, ly.el)}</td><td>${pct(ly.rol)}</td></tr>`)
    .join("");

  const firedRows = fired.length
    ? fired.map((f) => `<li><b>${esc(f.label)}</b> — ${esc(f.detail)} → <b>${f.action}</b></li>`).join("")
    : "<li>No rule breaches — within authority.</li>";

  const gaps = [...gapsFor(s), `Data source: ${d.live ? "LIVE CERA® feed" : "STUB — illustrative, not live CERA® output"}.`,
    `PoC unit conversions in play for: ${a.perils.filter((p) => p.result.poc_disclaimer).map((p) => perilLabel(profile, p.peril)).join(", ") || "none"}.`]
    .map((x) => `<li>${esc(x)}</li>`).join("");

  const adq = d.adequacy
    ? `charged ${pct(d.adequacy.chargedRate)} vs technical ${pct(d.adequacy.technicalRate)} — ${d.adequacy.status}`
    : "no charged rate provided";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Referral Report — ${esc(s.insuredName || s.address)}</title>
<style>
  :root{--navy:#131F3C;--pink:#FF66C4;--grey:#5A6178;--line:#e4e7ee;--pale:#FFF0F9}
  *{box-sizing:border-box}
  body{font-family:"Aptos","Inter","Helvetica Neue",system-ui,sans-serif;color:var(--navy);margin:0;padding:0 0 40px;font-size:13px;line-height:1.5}
  header{background:var(--navy);color:#fff;border-bottom:3px solid var(--pink);padding:18px 28px;display:flex;justify-content:space-between;align-items:center}
  .logo{font-weight:600;letter-spacing:.16em}.logo b{color:var(--pink)}
  .wrap{max-width:820px;margin:0 auto;padding:0 28px}
  h1{font-size:20px;margin:20px 0 2px}.sub{color:var(--grey);font-size:12px;margin-bottom:16px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--pink);border-bottom:1px solid var(--line);padding-bottom:4px;margin:20px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:12px;margin:4px 0}
  th,td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line)}
  th{color:var(--grey);font-weight:500;font-size:10.5px;text-transform:uppercase}
  .decision{display:inline-block;padding:6px 14px;border-radius:8px;font-weight:600;font-size:15px}
  .decline{background:#fde8e6;color:#b3261e}.refer{background:#fff6e0;color:#9a6b00}.write{background:#e6f7ef;color:#11804f}
  .kv{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px}.kv div{padding:3px 0;border-bottom:1px solid var(--line)}
  .kv span{color:var(--grey)}
  ul{margin:6px 0;padding-left:18px}
  .big{font-size:22px;font-weight:600}
  footer{border-top:2px solid var(--navy);margin-top:24px;padding-top:10px;color:var(--grey);font-size:11px}
  .req{background:var(--pale);border:1px solid #f6d4ec;border-radius:8px;padding:10px 12px;margin-top:14px}
  @media print{.noprint{display:none}}
</style></head><body>
<header><div class="logo"><b>BIRDS</b>EYEVIEW</div><div>CERA® · Referral Report</div></header>
<div class="wrap">
  <h1>Referral to ${esc(authority.referTo)}</h1>
  <div class="sub">Generated ${today} · ${d.live ? "live" : "illustrative (stub)"} data · v0.2</div>
  <div class="decision ${decision}">${decision.toUpperCase()}</div>

  <h2>1 · Risk summary</h2>
  <div class="kv">
    <div><span>Insured:</span> ${esc(s.insuredName || "—")}</div>
    <div><span>Occupancy:</span> ${esc(s.occupancy)}</div>
    <div><span>Address:</span> ${esc(s.address)}</div>
    <div><span>Construction:</span> ${esc(con?.label ?? "not stated")}</div>
    <div><span>Lat/Lng:</span> ${s.lat?.toFixed(4) ?? "—"}, ${s.lng?.toFixed(4) ?? "—"}</div>
    <div><span>Year built:</span> ${esc(s.yearBuilt ?? "—")}</div>
    <div><span>TIV A/B/C/D:</span> ${money(sym, s.tiv.buildings)} / ${money(sym, s.tiv.contents)} / ${money(sym, s.tiv.other)} / ${money(sym, s.tiv.bi)}</div>
    <div><span>Indemnity period:</span> ${esc(s.indemnityMonths ?? 12)} months</div>
    <div><span>Total TIV:</span> ${money(sym, a.totalTIV)}</div>
    <div><span>Market:</span> ${esc(profile.label)} (${profile.currency})</div>
  </div>

  <h2>2 · Authority outcome</h2>
  <p>Decision <b>${decision.toUpperCase()}</b>, referred to <b>${esc(authority.referTo)}</b>. Rules that fired:</p>
  <ul>${firedRows}</ul>

  <h2>3 · Hazard profile (triage)</h2>
  <table><tr><th>Peril</th><th>Score</th><th>Key return period</th></tr>${liteRows || "<tr><td colspan=3>—</td></tr>"}</table>

  <h2>4 · Loss view</h2>
  <p>Total AAL <span class="big">${money(sym, a.totalAAL)}</span> /yr (${pct(a.aalRate)} of TIV) · Section 1 ${money(sym, a.section1AAL)} · Section 2 ${money(sym, a.section2AAL)} · overall confidence ${a.confidence.band} (${Math.round(a.confidence.score * 100)}%).</p>
  <table><tr><th>Peril</th><th>S1 — MD</th><th>S2 — BI</th><th>Total</th><th>Confidence</th></tr>${perilRows}</table>

  <h2>5 · Proposed terms</h2>
  <table><tr><th>Peril</th><th>Deductible</th><th>Sublimit</th><th>Net AAL</th></tr>${termRows}</table>
  <table style="margin-top:8px"><tr><th>Layer</th><th>Structure</th><th>Attaches</th><th>Loss cost</th><th>RoL</th></tr>${layerRows || "<tr><td colspan=5>—</td></tr>"}</table>

  <h2>6 · Price</h2>
  <div class="kv">
    <div><span>Section 1 (MD) net AAL:</span> ${money(sym, build.section1AAL)}</div>
    <div><span>Section 2 (BI) AAL:</span> ${money(sym, build.section2AAL)}</div>
    <div><span>Capital load:</span> ${money(sym, build.capitalLoad)}</div>
    <div><span>Expenses + profit:</span> ${money(sym, build.expenses + build.profit)}</div>
    <div><span>Technical premium:</span> <b>${money(sym, build.technicalPremium)}</b> (${pct(build.technicalRate)} TIV)</div>
    <div><span>Rate adequacy:</span> ${adq}</div>
  </div>

  <h2>7 · Data &amp; caveats</h2>
  <ul>${gaps}</ul>

  <div class="req">
    <b>Requested action from ${esc(authority.referTo)}:</b> approve / decline / amend terms. Please respond with any binding conditions.
  </div>
  <footer>CERA® MGA AAL &amp; Pricing Engine · ${today} · v0.2 · All figures illustrative until the live CERA® feed and calibrated curves land. CERA® is a registered trademark of BirdsEyeView.</footer>
</div>
<script>setTimeout(function(){window.print();}, 350);</script>
</body></html>`;
}

export function ReferralReport({ data }: { data: ReferralData }) {
  function open() {
    const w = window.open("", "_blank", "width=920,height=1040");
    if (!w) {
      alert("Pop-up blocked — allow pop-ups to generate the referral report.");
      return;
    }
    w.document.write(buildHTML(data));
    w.document.close();
    w.focus();
  }
  return (
    <button className="pill-btn on" onClick={open} style={{ marginTop: 10 }}>
      Generate referral report →
    </button>
  );
}
