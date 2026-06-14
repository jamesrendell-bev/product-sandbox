// src/domain/wording.ts
//
// Clause selection against two wording skeletons (US ISO CP / E&S; AU ISR Mark V),
// with optional LMA clause add-ons for the Lloyd's-US user. Output is a marked-up
// schedule. NO copyrighted ISO/LMA text — section skeletons only; production
// plugs in licensed wording. ISR Mark V structure may be referenced (public).

import type { ExtPerilId } from "../engine/aal-ext";
import type { MarketProfile } from "./marketProfiles";
import { perilLabel } from "./marketProfiles";
import type { PerilTerms } from "./terms";

export interface WordingSection {
  id: string;
  title: string;
  status: "included" | "excluded" | "n/a";
  note?: string;
}
export interface ScheduleRow {
  peril: ExtPerilId;
  label: string;
  covered: boolean;
  sublimitPct: number;
  deductiblePct: number;
  basis: string;
}
export interface WordingSchedule {
  templateId: string;
  templateName: string;
  sections: WordingSection[];
  scheduleRows: ScheduleRow[];
  exclusions: string[];
  lmaAddOns: string[];
}

const ISR_SECTIONS: WordingSection[] = [
  { id: "schedule", title: "Schedule — Situation, Limits & Sub-Limits, Deductibles/Excess", status: "included" },
  { id: "s1", title: "Section 1 — Material Damage", status: "included", note: "Covers TIV split A/B/C (Buildings / Contents & Stock / Other)." },
  { id: "s2", title: "Section 2 — Business Interruption", status: "included", note: "Covers TIV split D (time-element)." },
  { id: "basis", title: "Basis of Settlement", status: "included" },
  { id: "defs", title: "Definitions (incl. Flood)", status: "included" },
  { id: "genex", title: "General Exclusions (incl. Flood inclusion/exclusion)", status: "included" },
  { id: "conds", title: "General Conditions", status: "included" },
  { id: "memo", title: "Memoranda", status: "included" },
];

const ISO_SECTIONS: WordingSection[] = [
  { id: "common", title: "Common Policy Conditions", status: "included" },
  { id: "cp0010", title: "Building & Personal Property Coverage Form (CP 00 10) — structure", status: "included", note: "Buildings / Business Personal Property (TIV A/B/C)." },
  { id: "cp1030", title: "Causes of Loss — Special Form (CP 10 30) — structure", status: "included" },
  { id: "bi", title: "Business Income / Extra Expense (time-element)", status: "included", note: "Covers TIV split D." },
  { id: "schedule", title: "Schedule — Limits, Sub-Limits & Deductibles", status: "included" },
  { id: "endorse", title: "Surplus-lines manuscript endorsements", status: "included" },
];

const LMA_ADDONS = [
  "Cyber exclusion (LMA-style)",
  "Communicable disease exclusion (LMA-style)",
  "War & terrorism exclusion (LMA-style)",
  "Sanctions limitation & exclusion (LMA-style)",
];

export function generateWording(
  profile: MarketProfile,
  perils: ExtPerilId[],
  coveredPerils: Set<ExtPerilId>,
  terms: Record<string, PerilTerms>,
  hasBI: boolean,
  lmaSelected: string[] = []
): WordingSchedule {
  const isISR = profile.wordingTemplateId === "AU-ISR";
  const base = isISR ? ISR_SECTIONS : ISO_SECTIONS;
  const sections = base.map((s) => {
    if ((s.id === "s2" || s.id === "bi") && !hasBI)
      return { ...s, status: "n/a" as const, note: "No BI (TIV split D) on this risk." };
    return { ...s };
  });

  const scheduleRows: ScheduleRow[] = perils.map((p) => {
    const t = terms[p];
    return {
      peril: p,
      label: perilLabel(profile, p),
      covered: coveredPerils.has(p),
      sublimitPct: t?.sublimitPct ?? 100,
      deductiblePct: t?.deductiblePct ?? 0,
      basis: t?.basis ?? "flat",
    };
  });

  const exclusions: string[] = [];
  for (const p of perils) {
    if (!coveredPerils.has(p)) exclusions.push(`${perilLabel(profile, p)} excluded (not written on this risk).`);
  }
  // Flood treatment is an explicit ISR memorandum / ISO endorsement decision.
  if (coveredPerils.has("FloodLivePlus") || coveredPerils.has("Flood")) {
    exclusions.push("Flood included by endorsement/memorandum with the scheduled sub-limit.");
  }

  return {
    templateId: profile.wordingTemplateId,
    templateName: isISR
      ? "Australia/NZ — ISR Mark V (skeleton)"
      : "US E&S — ISO Commercial Property (CP 00 10 + CP 10 30) (skeleton)",
    sections,
    scheduleRows,
    exclusions,
    lmaAddOns: profile.allowLMAClauses ? lmaSelected : [],
  };
}

export function availableLMAAddOns(): string[] {
  return [...LMA_ADDONS];
}
