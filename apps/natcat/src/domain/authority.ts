// src/domain/authority.ts
//
// §8 — Underwriting Authority. The binder reality: a capacity provider (e.g.
// Hudson, for a US coverholder like Amynta) grants authority within written
// guidelines; outside the guidelines = prior-submit referral. Rules are explicit,
// EDITABLE data objects that the triage RUNS ON, and every refer/decline reason
// cites the rule that fired. All thresholds live here (migrated out of triage.ts).
//
// Ships the "simple version": a flat rule list, single referral tier, no
// TIV-conditional construction rules yet.

import type { Occupancy } from "./inputModel";
import type { ExtPerilId } from "../engine/aal-ext";
import type { TriageScore } from "../engine/cera-client-ext";

export type Decision = "write" | "refer" | "decline";
export type RuleAction = "refer" | "decline";

export interface FiredRule {
  id: string;
  label: string; // names the rule
  action: RuleAction;
  detail: string;
}
export interface TriageResult {
  decision: Decision;
  reasons: string[];
  fired: FiredRule[];
}

// A per-peril hazard-frequency rule at the peril's fixed severity threshold.
export interface HazardRule {
  id: string;
  peril: ExtPerilId;
  label: string; // peril name, e.g. "Hurricane / Cyclone"
  threshold: string; // fixed severity the frequency applies to, e.g. "CAT3", "1m depth", "MMI6"
  moreFrequentThanRP: number; // fire if the return period at that severity is shorter than this
  action: RuleAction;
}

export interface Authority {
  referTo: string;
  meta: { setBy: string; setDate: string };
  // ── Stage 1 — eligibility + lite ──
  maxTIVPerLocation: number;
  maxTIVAction: RuleAction;
  permittedOccupancies: Occupancy[];
  occupancyAction: RuleAction;
  permittedConstructions: string[]; // construction ids; [] = all permitted
  constructionAction: RuleAction;
  excludedZones: string[]; // Cresta zones / states
  excludedZoneAction: RuleAction;
  maxAggregateZoneSharePct: number; // feeds §7 marginal check appetite
  aggregateAction: RuleAction;
  hazardRules: HazardRule[];
  // ── Stage 2 — post-assessment ──
  writeMaxAALRate: number; // auto-bind ceiling (net AAL / TIV)
  declineMinAALRate: number; // decline ceiling
  minConfidence: number; // refer below
  declineMaxConfidence: number; // decline below
  declineMax1in100Rate: number;
  rateFloorPctOfTechnical: number; // charged ≥ X% of technical, else fire
  rateFloorAction: RuleAction;
  // ── Minimum terms floors (TermsPanel enforces) ──
  minWindDedPct: number;
  minQuakeDedPct: number;
  mandatoryFloodSublimit: boolean;
}

export function defaultAuthority(): Authority {
  return {
    referTo: "Capacity provider",
    meta: { setBy: "Default", setDate: "2026-06-06" },
    maxTIVPerLocation: 50_000_000,
    maxTIVAction: "decline",
    permittedOccupancies: ["residential", "commercial", "industrial"],
    occupancyAction: "decline",
    permittedConstructions: [],
    constructionAction: "refer",
    excludedZones: [],
    excludedZoneAction: "decline",
    maxAggregateZoneSharePct: 20,
    aggregateAction: "decline",
    hazardRules: [
      { id: "hz_tc", peril: "TropicalCyclone", label: "Hurricane / Cyclone", threshold: "CAT3", moreFrequentThanRP: 50, action: "refer" },
      { id: "hz_fl", peril: "FloodLivePlus", label: "Flood", threshold: "1m depth", moreFrequentThanRP: 100, action: "decline" },
      { id: "hz_wf", peril: "Wildfire", label: "Wildfire", threshold: "Severe (any occurrence)", moreFrequentThanRP: 40, action: "refer" },
      { id: "hz_eq", peril: "Earthquake", label: "Earthquake", threshold: "MMI6", moreFrequentThanRP: 100, action: "refer" },
      { id: "hz_to", peril: "USTornado", label: "US Tornado", threshold: "EF2", moreFrequentThanRP: 50, action: "refer" },
    ],
    writeMaxAALRate: 0.015,
    declineMinAALRate: 0.03,
    minConfidence: 0.65,
    declineMaxConfidence: 0.4,
    declineMax1in100Rate: 0.25,
    rateFloorPctOfTechnical: 0.8,
    rateFloorAction: "refer",
    minWindDedPct: 2,
    minQuakeDedPct: 5,
    mandatoryFloodSublimit: true,
  };
}

// ── Persistence (browser localStorage) ───────────────────────────────────────
const STORAGE_KEY = "mga.authority.v1";

export function loadStoredAuthority(): Authority | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // light shape check so a malformed entry can't break the app
    if (parsed && Array.isArray(parsed.hazardRules) && parsed.referTo != null) return parsed as Authority;
    return null;
  } catch {
    return null;
  }
}
export function saveStoredAuthority(a: Authority): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* ignore quota / private-mode errors */
  }
}
export function clearStoredAuthority(): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const ORDER: Decision[] = ["write", "refer", "decline"];
function worst(a: Decision, b: Decision): Decision {
  return ORDER[Math.max(ORDER.indexOf(a), ORDER.indexOf(b))];
}
export function decisionFrom(fired: FiredRule[]): Decision {
  return fired.reduce<Decision>((d, r) => worst(d, r.action), "write");
}
function toResult(fired: FiredRule[], okMessage: string): TriageResult {
  const decision = decisionFrom(fired);
  const reasons = fired.map((r) => `[${r.label}] ${r.detail} → ${r.action}`);
  if (decision === "write") reasons.unshift(okMessage);
  return { decision, reasons, fired };
}

// ── Stage 1 — eligibility + lite ──────────────────────────────────────────────
export interface Stage1Ctx {
  tivPerLocation: number;
  occupancy: Occupancy;
  constructionId?: string;
  zone?: string;
  liteScores: TriageScore[];
  aggregateBreach?: boolean;
  aggregateZoneSharePct?: number;
}

export function evaluateStage1(a: Authority, ctx: Stage1Ctx): FiredRule[] {
  const fired: FiredRule[] = [];
  if (ctx.tivPerLocation > a.maxTIVPerLocation)
    fired.push({ id: "maxTIV", label: "Max TIV per location", action: a.maxTIVAction, detail: `TIV ${Math.round(ctx.tivPerLocation).toLocaleString()} exceeds limit ${a.maxTIVPerLocation.toLocaleString()}` });
  if (!a.permittedOccupancies.includes(ctx.occupancy))
    fired.push({ id: "occ", label: "Permitted occupancies", action: a.occupancyAction, detail: `${ctx.occupancy} not in appetite` });
  if (a.permittedConstructions.length && ctx.constructionId && !a.permittedConstructions.includes(ctx.constructionId))
    fired.push({ id: "con", label: "Permitted constructions", action: a.constructionAction, detail: `${ctx.constructionId} not permitted` });
  if (ctx.zone && a.excludedZones.map((z) => z.trim()).includes(ctx.zone))
    fired.push({ id: "zone", label: "Excluded zones", action: a.excludedZoneAction, detail: `zone ${ctx.zone} excluded` });
  if (ctx.aggregateBreach)
    fired.push({ id: "agg", label: "Max aggregate zone share", action: a.aggregateAction, detail: `new risk breaches the ${a.maxAggregateZoneSharePct}% zone-aggregate limit` });
  for (const hr of a.hazardRules) {
    const s = ctx.liteScores.find((x) => x.peril === hr.peril);
    if (s && s.keyReturnPeriod > 0 && s.keyReturnPeriod < hr.moreFrequentThanRP)
      fired.push({ id: hr.id, label: hr.label, action: hr.action, detail: `${s.keyThreshold} at 1-in-${Math.round(s.keyReturnPeriod)} is more frequent than 1-in-${hr.moreFrequentThanRP}` });
  }
  return fired;
}

// ── Stage 2 — post-assessment ─────────────────────────────────────────────────
export interface Stage2Ctx {
  netAALRate: number;
  confidence: number;
  oneIn100NetRate?: number;
  anyPerilReliabilityLow?: boolean;
  chargedRate?: number; // fraction of TIV
  technicalRate?: number; // fraction of TIV
}

export function evaluateStage2(a: Authority, ctx: Stage2Ctx): FiredRule[] {
  const fired: FiredRule[] = [];
  if (ctx.netAALRate > a.declineMinAALRate)
    fired.push({ id: "aalDecline", label: "Max AAL rate (decline ceiling)", action: "decline", detail: `net AAL ${(ctx.netAALRate * 100).toFixed(2)}% > ${(a.declineMinAALRate * 100).toFixed(1)}%` });
  else if (ctx.netAALRate >= a.writeMaxAALRate)
    fired.push({ id: "aalRefer", label: "Max AAL rate (auto-bind ceiling)", action: "refer", detail: `net AAL ${(ctx.netAALRate * 100).toFixed(2)}% ≥ ${(a.writeMaxAALRate * 100).toFixed(1)}%` });
  if (ctx.confidence < a.declineMaxConfidence)
    fired.push({ id: "confDecline", label: "Minimum confidence (floor)", action: "decline", detail: `confidence ${(ctx.confidence * 100).toFixed(0)}% < ${(a.declineMaxConfidence * 100).toFixed(0)}%` });
  else if (ctx.confidence < a.minConfidence)
    fired.push({ id: "confRefer", label: "Minimum confidence", action: "refer", detail: `confidence ${(ctx.confidence * 100).toFixed(0)}% < ${(a.minConfidence * 100).toFixed(0)}%` });
  if (ctx.oneIn100NetRate != null && ctx.oneIn100NetRate > a.declineMax1in100Rate)
    fired.push({ id: "pml", label: "Max 1-in-100 net loss", action: "decline", detail: `1-in-100 net ${(ctx.oneIn100NetRate * 100).toFixed(0)}% > ${(a.declineMax1in100Rate * 100).toFixed(0)}%` });
  if (ctx.anyPerilReliabilityLow)
    fired.push({ id: "rel", label: "Peril model reliability", action: "refer", detail: "a peril has low model reliability at this location" });
  if (ctx.chargedRate != null && ctx.technicalRate != null && ctx.technicalRate > 0 && ctx.chargedRate < a.rateFloorPctOfTechnical * ctx.technicalRate)
    fired.push({ id: "rate", label: "Rate floor", action: a.rateFloorAction, detail: `charged ${(ctx.chargedRate * 100).toFixed(2)}% < ${Math.round(a.rateFloorPctOfTechnical * 100)}% of technical ${(ctx.technicalRate * 100).toFixed(2)}%` });
  return fired;
}

// ── Public triage entry points (replace the old triage.ts thresholds) ─────────
export function triageStage1(a: Authority, ctx: Stage1Ctx): TriageResult {
  return toResult(evaluateStage1(a, ctx), "Within authority — auto-quote (subject to full assessment).");
}
export function triageStage2(a: Authority, ctx: Stage2Ctx, stage1Fired: FiredRule[] = []): TriageResult {
  return toResult([...stage1Fired, ...evaluateStage2(a, ctx)], "Within authority — auto-bind.");
}
