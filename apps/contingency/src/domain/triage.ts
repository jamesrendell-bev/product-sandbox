import type { Authority } from "./authority";
import type { PerilScore } from "../lib/api";
import { fmtRP } from "../lib/format";

export type Decision = "write" | "refer" | "decline";

export interface FiredRule {
  id: string; label: string; action: "refer" | "decline"; detail: string;
}

const RANK: Record<Decision, number> = { write: 0, refer: 1, decline: 2 };

export function triageLocation(
  scores: PerilScore[],
  authority: Authority,
): { decision: Decision; fired: FiredRule[] } {
  const fired: FiredRule[] = [];
  for (const rule of authority.hazardRules) {
    const s = scores.find((p) => p.peril === rule.peril);
    if (!s) continue;
    if (s.keyReturnPeriod < rule.moreFrequentThanRP) {
      fired.push({
        id: rule.id,
        label: rule.label,
        action: rule.action,
        detail: `${rule.label} ≥ ${rule.threshold} is more frequent than ${fmtRP(rule.moreFrequentThanRP)} (modelled ${fmtRP(s.keyReturnPeriod)})`,
      });
    }
  }
  let decision: Decision = "write";
  for (const f of fired) if (RANK[f.action] > RANK[decision]) decision = f.action;
  return { decision, fired };
}

export const decisionLabel: Record<Decision, string> = {
  write: "Accept",
  refer: "Refer",
  decline: "Decline",
};
export const decisionRag: Record<Decision, "green" | "amber" | "red"> = {
  write: "green",
  refer: "amber",
  decline: "red",
};

// Worst decision across a portfolio of locations.
export function worstDecision(decisions: Decision[]): Decision {
  let d: Decision = "write";
  for (const x of decisions) if (RANK[x] > RANK[d]) d = x;
  return d;
}
