// Editable underwriting authority — the per-peril referral thresholds the
// triage runs on. Defaults mirror the BEV MGA engine's authority rules.

export type RuleAction = "refer" | "decline";

export interface HazardRule {
  id: string;
  peril: string;        // CERA peril id
  label: string;
  threshold: string;    // key intensity threshold (display)
  moreFrequentThanRP: number; // refer/decline if modelled RP at threshold is shorter than this
  action: RuleAction;
}

export interface Authority {
  referTo: string;
  hazardRules: HazardRule[];
}

export const DEFAULT_AUTHORITY: Authority = {
  referTo: "Senior Underwriter — Contingency",
  hazardRules: [
    { id: "hz_tc", peril: "TropicalCyclone", label: "Tropical cyclone", threshold: "CAT3", moreFrequentThanRP: 50, action: "refer" },
    { id: "hz_fl", peril: "FloodLivePlus", label: "Flood", threshold: "1m depth", moreFrequentThanRP: 100, action: "decline" },
    { id: "hz_wf", peril: "Wildfire", label: "Wildfire", threshold: "Severe", moreFrequentThanRP: 40, action: "refer" },
    { id: "hz_eq", peril: "Earthquake", label: "Earthquake", threshold: "MMI6", moreFrequentThanRP: 100, action: "refer" },
    { id: "hz_to", peril: "USTornado", label: "US tornado", threshold: "EF2", moreFrequentThanRP: 50, action: "refer" },
  ],
};

const KEY = "bev.contingency.authority.v1";

export function loadAuthority(): Authority {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_AUTHORITY);
    const parsed = JSON.parse(raw) as Authority;
    if (!parsed?.hazardRules?.length) return structuredClone(DEFAULT_AUTHORITY);
    return parsed;
  } catch {
    return structuredClone(DEFAULT_AUTHORITY);
  }
}
export function saveAuthority(a: Authority) {
  localStorage.setItem(KEY, JSON.stringify(a));
}
export function resetAuthority(): Authority {
  localStorage.removeItem(KEY);
  return structuredClone(DEFAULT_AUTHORITY);
}
