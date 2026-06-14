// src/domain/inputModel.ts
//
// Submission schema + the three input tiers (minimal / standard / full COPE)
// and the data-completeness inputs for the confidence calculator.

import type { MarketId } from "./marketProfiles";
import type { DataFields } from "../engine/confidence";

export type Occupancy = "residential" | "commercial" | "industrial";

export interface TIVSplit {
  buildings: number; // A
  contents: number; // B — Contents & Stock
  other: number; // C
  bi: number; // D — Business Interruption (time-element, treated separately)
}

export interface Submission {
  market: MarketId;
  insuredName?: string;
  address: string;
  crestaZone?: string;
  lat?: number;
  lng?: number;
  occupancy: Occupancy;
  tiv: TIVSplit;
  // ── Enrichment (each optional; each raises confidence) ──
  constructionId?: string; // ConstructionOption.id
  yearBuilt?: number;
  roofClass?: string; // HAIL_PARAMS key
  firstFloorElevationM?: number;
  secondaryModifiers?: boolean;
  // ── Business Interruption (§6 — Section 2) ──
  biFactor?: number; // share of declared BI value lost per unit building damage (default 1.0)
  indemnityMonths?: number; // BI indemnity period (default 12)
  // ── From a loaded BDX (rate adequacy) ──
  chargedRatePct?: number;
}

// Damageable TIV = Buildings + Contents + Other. BI handled separately upstream.
export function damageableTIV(t: TIVSplit): number {
  return (t.buildings || 0) + (t.contents || 0) + (t.other || 0);
}
export function totalTIV(t: TIVSplit): number {
  return damageableTIV(t) + (t.bi || 0);
}

// Build a TIVSplit from a single total + occupancy-typical shares.
export function splitFromTotal(total: number, occupancy: Occupancy): TIVSplit {
  // Rough occupancy-typical splits (A/B/C/D) — editable in the UI.
  const shares: Record<Occupancy, [number, number, number, number]> = {
    residential: [0.7, 0.2, 0.05, 0.05],
    commercial: [0.5, 0.25, 0.1, 0.15],
    industrial: [0.45, 0.3, 0.05, 0.2],
  };
  const [a, b, c, d] = shares[occupancy];
  return {
    buildings: total * a,
    contents: total * b,
    other: total * c,
    bi: total * d,
  };
}

// ── COPE option lists ─────────────────────────────────────────────────────────
export const OCCUPANCIES: { id: Occupancy; label: string }[] = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "industrial", label: "Industrial" },
];

export interface ConstructionOption {
  id: string;
  label: string;
  eqClass: string; // EARTHQUAKE_PARAMS key
  tornadoClass: string; // TORNADO_PARAMS key
  wildfireClass: string; // WILDFIRE_DAMAGE_IF_BURNED key
}
export const CONSTRUCTIONS: ConstructionOption[] = [
  { id: "timber", label: "Timber / light frame", eqClass: "Timber", tornadoClass: "Timber", wildfireClass: "Timber — standard" },
  { id: "masonry_unreinf", label: "Masonry — unreinforced", eqClass: "Masonry Unreinforced", tornadoClass: "Masonry", wildfireClass: "Masonry" },
  { id: "masonry_conf", label: "Masonry — reinforced/confined", eqClass: "Masonry Confined", tornadoClass: "Masonry", wildfireClass: "Masonry" },
  { id: "concrete", label: "Reinforced concrete", eqClass: "Concrete Ductile", tornadoClass: "Concrete", wildfireClass: "Non-combustible" },
  { id: "steel", label: "Steel frame", eqClass: "Steel", tornadoClass: "Steel", wildfireClass: "Non-combustible" },
];
export function constructionById(id?: string): ConstructionOption | undefined {
  return CONSTRUCTIONS.find((c) => c.id === id);
}

export const ROOF_CLASSES = [
  "Asphalt shingle",
  "Tile / slate",
  "Metal standing-seam",
  "Membrane / flat",
];

// ── Tiers & confidence inputs ─────────────────────────────────────────────────
export type Tier = 0 | 1 | 2;
export function tierOf(s: Submission): Tier {
  if (s.roofClass || s.firstFloorElevationM != null || s.secondaryModifiers) return 2;
  if (s.constructionId || s.yearBuilt != null) return 1;
  return 0;
}
export const TIER_LABEL: Record<Tier, string> = {
  0: "Tier 0 — minimal",
  1: "Tier 1 — standard",
  2: "Tier 2 — full COPE",
};

export function dataFieldsOf(s: Submission): DataFields {
  return {
    hasLocation: !!(s.address || (s.lat != null && s.lng != null)),
    hasTIV: damageableTIV(s.tiv) > 0,
    hasOccupancy: !!s.occupancy,
    hasConstruction: !!s.constructionId,
    hasYearBuilt: s.yearBuilt != null,
    hasRoof: !!s.roofClass,
    hasElevation: s.firstFloorElevationM != null,
    hasSecondaryModifiers: !!s.secondaryModifiers,
  };
}

export function emptySubmission(market: MarketId): Submission {
  return {
    market,
    address: "",
    occupancy: "commercial",
    tiv: splitFromTotal(5_000_000, "commercial"),
    biFactor: 1,
    indemnityMonths: 12,
  };
}
