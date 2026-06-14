// src/domain/marketProfiles.ts
//
// Market Profile selector — sets everything downstream from one choice.
// Scope is deliberately narrowed to two risk geographies: US and Australia.
// Both are fully covered by CERA®'s live perils (no coverage gap).

import type { ExtPerilId } from "../engine/aal-ext";

export type MarketId = "US" | "AU";
export type UserType = "US MGA" | "Lloyd's-US syndicate" | "Australian MGA";

export interface MarketProfile {
  id: MarketId;
  label: string;
  serves: string;
  currency: string;
  currencySymbol: string;
  defaultFloodRegion: string; // JRC region for floodMDR
  cycloneBasin: string;
  /** Live perils, in display order. Flood uses FloodLivePlus (FATHOM, preferred). */
  perils: ExtPerilId[];
  /** Roadmap perils — feature-flagged off until the model ships. */
  roadmapPerils: ExtPerilId[];
  perilLabels: Partial<Record<ExtPerilId, string>>;
  wordingTemplateId: "US-ISO" | "AU-ISR";
  userTypes: UserType[];
  /** Allow optional LMA clause add-ons (Lloyd's-US user). */
  allowLMAClauses: boolean;
}

export const MARKET_PROFILES: Record<MarketId, MarketProfile> = {
  US: {
    id: "US",
    label: "United States",
    serves: "US MGAs + Lloyd's syndicates writing US business",
    currency: "USD",
    currencySymbol: "$",
    defaultFloodRegion: "North America",
    cycloneBasin: "North Atlantic",
    perils: ["TropicalCyclone", "USTornado", "Wildfire", "FloodLivePlus", "Earthquake"],
    roadmapPerils: ["Hail"],
    perilLabels: {
      TropicalCyclone: "Hurricane (TC)",
      USTornado: "US Tornado",
      Wildfire: "Wildfire",
      FloodLivePlus: "Flood (FATHOM)",
      Earthquake: "Earthquake",
      Hail: "Hail / SCS",
    },
    wordingTemplateId: "US-ISO",
    userTypes: ["US MGA", "Lloyd's-US syndicate"],
    allowLMAClauses: true,
  },
  AU: {
    id: "AU",
    label: "Australia",
    serves: "Australian MGAs",
    currency: "AUD",
    currencySymbol: "$",
    defaultFloodRegion: "Oceania",
    cycloneBasin: "Australia",
    perils: ["TropicalCyclone", "Wildfire", "FloodLivePlus", "Earthquake"],
    roadmapPerils: ["Hail"],
    perilLabels: {
      TropicalCyclone: "Cyclone (TC)",
      Wildfire: "Bushfire",
      FloodLivePlus: "Flood (FATHOM)",
      Earthquake: "Earthquake",
      Hail: "Hail / SCS",
    },
    wordingTemplateId: "AU-ISR",
    userTypes: ["Australian MGA"],
    allowLMAClauses: false,
  },
};

export const MARKET_LIST = Object.values(MARKET_PROFILES);

export function perilLabel(profile: MarketProfile, peril: ExtPerilId): string {
  return profile.perilLabels[peril] ?? peril;
}

export function fmtMoney(profile: MarketProfile, n: number): string {
  const s = profile.currencySymbol;
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1e9) return `${s}${(n / 1e9).toFixed(2)}bn`;
  if (Math.abs(n) >= 1e6) return `${s}${(n / 1e6).toFixed(2)}m`;
  if (Math.abs(n) >= 1e3) return `${s}${(n / 1e3).toFixed(0)}k`;
  return `${s}${Math.round(n).toLocaleString("en-US")}`;
}
