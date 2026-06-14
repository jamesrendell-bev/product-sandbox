// Weather triage engine: turns Meteostat history + the editable authority into a
// per-peril probability, RAG and an overall Accept / Refer / Decline decision.
import type { DailyRow } from "./api";
import { TRIAGE_PERILS } from "./weatherPerils";
import type { WeatherAuthority } from "../domain/weatherAuthority";
import { perYearValues, blendedProbability, dailyExceedanceSeries, type YearValue, type DailyProb } from "./climatology";

export type Decision = "write" | "refer" | "decline";
export type Rag = "green" | "amber" | "red" | "neutral";

export interface CheckResult {
  key: string; label: string; column: string; unit: string;
  tail: "upper" | "lower"; threshold: number; applicable: boolean;
  p: number; empiricalP: number; hits: number; n: number;
  values: YearValue[]; daily: DailyProb[]; rag: Rag;
}
export interface PerilResult {
  id: string; label: string; icon: string;
  applicable: boolean; p: number; rag: Rag;
  binding: CheckResult | null; checks: CheckResult[];
}
export interface WeatherTriageResult {
  decision: Decision; perils: PerilResult[]; indoor: boolean;
  referProb: number; declineProb: number; histYears: number[];
}

function ragFromP(p: number, applicable: boolean, refer: number, decline: number): Rag {
  if (!applicable || !Number.isFinite(p)) return "neutral";
  if (p >= decline) return "red";
  if (p >= refer) return "amber";
  return "green";
}

export function runWeatherTriage(
  rows: DailyRow[],
  eventStart: string,
  eventEnd: string,
  histYears: number[],
  auth: WeatherAuthority,
  indoor: boolean,
): WeatherTriageResult {
  const perils: PerilResult[] = TRIAGE_PERILS.map((peril) => {
    const checks: CheckResult[] = peril.checks.map((c) => {
      let threshold = (auth.thresholds as any)[c.key] as number;
      if (c.key === "snow") threshold = indoor ? auth.thresholds.snow_indoor : auth.thresholds.snow_outdoor;
      const applicable = indoor ? !c.outdoorOnly : true;
      const values = perYearValues(rows, c.column, c.agg, eventStart, eventEnd, histYears);
      const { p, empirical } = blendedProbability(values.map((v) => v.value), threshold, c.tail, c.dist);
      const daily = applicable ? dailyExceedanceSeries(rows, c.column, c.tail, c.dist, threshold, eventStart, eventEnd, histYears, 14) : [];
      return {
        key: c.key, label: c.label, column: c.column, unit: c.unit, tail: c.tail, threshold, applicable,
        p, empiricalP: empirical.p, hits: empirical.hits, n: empirical.n, values, daily,
        rag: ragFromP(p, applicable, auth.referralProbability, auth.declineProbability),
      };
    });
    const live = checks.filter((c) => c.applicable && Number.isFinite(c.p));
    const binding = live.length ? live.reduce((a, b) => (b.p > a.p ? b : a)) : null;
    const p = binding ? binding.p : NaN;
    const applicable = checks.some((c) => c.applicable);
    return { id: peril.id, label: peril.label, icon: peril.icon, applicable, p, rag: ragFromP(p, applicable, auth.referralProbability, auth.declineProbability), binding, checks };
  });

  let decision: Decision = "write";
  for (const pr of perils) {
    if (pr.rag === "red") { decision = "decline"; break; }
    if (pr.rag === "amber") decision = "refer";
  }
  return { decision, perils, indoor, referProb: auth.referralProbability, declineProb: auth.declineProbability, histYears };
}

export const decisionLabel: Record<Decision, string> = { write: "Accept", refer: "Refer", decline: "Decline" };
export const decisionRag: Record<Decision, "green" | "amber" | "red"> = { write: "green", refer: "amber", decline: "red" };
export const RAG_COLOR: Record<Rag, string> = { green: "#2FBF8F", amber: "#E0A33A", red: "#F0584A", neutral: "#5E708A" };
