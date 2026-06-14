// src/domain/triage.ts
//
// §8: all triage thresholds + rule logic were migrated into the editable
// Underwriting Authority object (domain/authority.ts) — the triage now RUNS ON
// those rules. Nothing is hardcoded here any more. Kept as a thin re-export so
// existing imports (Decision, TriageResult) keep working.

export type { Decision, TriageResult, FiredRule } from "./authority";
export {
  triageStage1,
  triageStage2,
  evaluateStage1,
  evaluateStage2,
  decisionFrom,
  defaultAuthority,
  type Authority,
  type Stage1Ctx,
  type Stage2Ctx,
  type HazardRule,
  type RuleAction,
} from "./authority";
