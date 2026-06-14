// src/domain/portfolio.ts
//
// BDX ingest → per-location AAL; Cresta-zone aggregation; event-based PML;
// marginal aggregate check; diversification. Bulk plotting uses the BDX
// AI_Output coordinates (no live geocoding).

import { computeAALExt, type ExtPerilId, type PerilLossPoint } from "../engine/aal-ext";
import { stubBundle, type HazardBundleExt } from "../engine/cera-client-ext";
import { lossAtP, tvarAtP } from "../engine/combined-ep";
import type { MarketProfile } from "./marketProfiles";
import {
  constructionById,
  CONSTRUCTIONS,
  damageableTIV,
  totalTIV,
  type Occupancy,
  type Submission,
} from "./inputModel";

export interface PortfolioLocation {
  id: number;
  insured: string;
  address: string;
  cresta: string;
  lat?: number;
  lng?: number;
  occupancy: Occupancy;
  constructionId?: string;
  yearBuilt?: number;
  damageableTIV: number;
  bi: number;
  totalTIV: number;
  chargedRatePct?: number; // fraction of TIV
  indemnityMonths?: number; // §6 — BI indemnity period
}

// ── BDX row mapping (header-keyed, fuzzy) ─────────────────────────────────────
type Row = Record<string, unknown>;
function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isFinite(n) ? n : 0;
}
function pick(row: Row, candidates: string[]): unknown {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const k = keys.find((k) => k.trim().toLowerCase() === c.toLowerCase());
    if (k != null && row[k] != null && row[k] !== "") return row[k];
  }
  // contains fallback
  for (const c of candidates) {
    const k = keys.find((k) => k.trim().toLowerCase().includes(c.toLowerCase()));
    if (k != null && row[k] != null && row[k] !== "") return row[k];
  }
  return undefined;
}

function guessOccupancy(desc: string): Occupancy {
  const d = desc.toLowerCase();
  if (/(home|dwelling|residential|apartment|flat|house)/.test(d)) return "residential";
  if (/(factory|industrial|warehouse|plant|manufactur|storage)/.test(d)) return "industrial";
  return "commercial";
}
function guessConstruction(desc: string): string | undefined {
  const d = desc.toLowerCase();
  if (/(timber|wood|frame|weatherboard)/.test(d)) return "timber";
  if (/(reinforced concrete|concrete|rc)/.test(d)) return "concrete";
  if (/(steel|metal)/.test(d)) return "steel";
  if (/(brick|masonry|block)/.test(d)) return CONSTRUCTIONS[1].id;
  return undefined;
}

export function mapBdxRow(row: Row, id: number): PortfolioLocation | null {
  const lat = num(pick(row, ["Latitude", "lat"]));
  const lng = num(pick(row, ["Longitude", "lon", "lng"]));
  const a = num(pick(row, ["A_Buildings", "A - Buildings (100%)", "A - Buildings"]));
  const b = num(pick(row, ["B_OtherStructures", "B - Contents & Stock (100%)", "B - Contents"]));
  const c = num(pick(row, ["C_Contents", "C - Other (100%)", "C - Other"]));
  const d = num(pick(row, ["D_BusinessInterruptionOrALE", "D - Business Interruption (100%)", "D - Business Interruption"]));
  const totalRaw = num(pick(row, ["TotalInsurableValues", "Total Insurable Values (100%)", "Total Insurable Values"]));
  const dmg = a + b + c;
  const total = totalRaw || dmg + d;
  if (total <= 0 && !(lat || lng)) return null;

  const occDesc = String(pick(row, ["OccupancyDescription", "Principal Activity", "Business Description"]) ?? "");
  const conDesc = String(pick(row, ["ConstructionDescription", "Construction Description"]) ?? "");
  const street = [pick(row, ["BuildingOrHouseNumber", "Property No.", "Street"]), pick(row, ["Street"]), pick(row, ["City", "Suburb"]), pick(row, ["State"])]
    .filter(Boolean)
    .join(", ");
  const chargedRate = num(pick(row, ["Charged Rate This Year"]));

  return {
    id,
    insured: String(pick(row, ["NameOfInsured", "Name of Insured"]) ?? `Location ${id}`),
    address: street || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
    cresta: String(pick(row, ["Cresta Zone", "CrestaZone", "Cresta"]) ?? pick(row, ["State"]) ?? "—"),
    lat: lat || undefined,
    lng: lng || undefined,
    occupancy: guessOccupancy(occDesc),
    constructionId: guessConstruction(conDesc),
    yearBuilt: num(pick(row, ["YearBuilt", "Year Built"])) || undefined,
    damageableTIV: dmg || total * 0.85,
    bi: d || total * 0.15,
    totalTIV: total,
    chargedRatePct: chargedRate > 0 ? (chargedRate < 1 ? chargedRate : chargedRate / 100) : undefined,
    indemnityMonths: num(pick(row, ["Indemnity Period (Months)", "IndemnityPeriodMonths", "Indemnity Period"])) || undefined,
  };
}

// ── Per-location assessment (stub hazard, sync) ───────────────────────────────
export interface LocationAAL {
  loc: PortfolioLocation;
  perilAAL: Record<string, number>;
  perilCurves: Record<string, PerilLossPoint[]>;
  totalAAL: number;
  aalRatePct: number; // total AAL / total TIV
}

function hazardFor(loc: PortfolioLocation, perils: ExtPerilId[]): HazardBundleExt {
  return stubBundle({
    location: loc.address,
    latitude: loc.lat,
    longitude: loc.lng,
    perils,
    apiKey: "",
    baseUrl: "",
  });
}

export function assessLocation(loc: PortfolioLocation, profile: MarketProfile): LocationAAL {
  const perils = profile.perils;
  const bundle = hazardFor(loc, perils);
  const con = constructionById(loc.constructionId);
  const perilAAL: Record<string, number> = {};
  const perilCurves: Record<string, PerilLossPoint[]> = {};
  let total = 0;
  for (const peril of perils) {
    const raw = bundle.results.find((r) => r.peril === peril);
    if (!raw) continue;
    const res = computeAALExt({
      peril,
      tiv: loc.damageableTIV,
      propertyType: loc.occupancy,
      region: profile.defaultFloodRegion,
      cycloneBasin: profile.cycloneBasin,
      constructionClass:
        con && peril === "Earthquake" ? con.eqClass : con && peril === "USTornado" ? con.tornadoClass : undefined,
      wildfireExposureClass: con && peril === "Wildfire" ? con.wildfireClass : undefined,
      yearBuilt: loc.yearBuilt, // §5b
      rawCurve: raw,
    });
    if (res.unsupported) continue;
    perilAAL[peril] = res.aal;
    perilCurves[peril] = res.loss_curve;
    total += res.aal;
  }
  return {
    loc,
    perilAAL,
    perilCurves,
    totalAAL: total,
    aalRatePct: loc.totalTIV > 0 ? (total / loc.totalTIV) * 100 : 0,
  };
}

// ── Cresta aggregation ────────────────────────────────────────────────────────
export interface CrestaAgg {
  cresta: string;
  count: number;
  tiv: number;
  aal: number;
  share: number; // share of book TIV
  peak: boolean;
}

export function aggregateByCresta(
  rows: LocationAAL[],
  appetiteShare = 0.2
): CrestaAgg[] {
  const totalTIV = rows.reduce((s, r) => s + r.loc.totalTIV, 0) || 1;
  const map = new Map<string, CrestaAgg>();
  for (const r of rows) {
    const z = r.loc.cresta || "—";
    const agg = map.get(z) ?? { cresta: z, count: 0, tiv: 0, aal: 0, share: 0, peak: false };
    agg.count++;
    agg.tiv += r.loc.totalTIV;
    agg.aal += r.totalAAL;
    map.set(z, agg);
  }
  const out = [...map.values()];
  for (const a of out) {
    a.share = a.tiv / totalTIV;
    a.peak = a.share > appetiteShare;
  }
  return out.sort((a, b) => b.tiv - a.tiv);
}

// ── Event-based portfolio PML (pragmatic) ─────────────────────────────────────
// Within a peril, aggregate location losses at matched return periods (full
// within-peril correlation — the standard accumulation upper bound). Across
// perils, combine on an occurrence (independent) basis. Documented PoC approach.
const RP_GRID = [5, 10, 20, 50, 100, 250, 500, 1000];

function lossAtRP(curve: PerilLossPoint[], rp: number): number {
  if (!curve.length) return 0;
  if (curve.length === 1) return rp >= (curve[0].p > 0 ? 1 / curve[0].p : Infinity) ? curve[0].loss : 0;
  // curve sorted by p desc → rp asc
  const pts = curve.map((c) => ({ rp: c.p > 0 ? 1 / c.p : Infinity, loss: c.loss }));
  if (rp <= pts[0].rp) return pts[0].loss * (rp / pts[0].rp); // scale down below first node
  if (rp >= pts[pts.length - 1].rp) return pts[pts.length - 1].loss;
  for (let i = 0; i < pts.length - 1; i++) {
    if (rp >= pts[i].rp && rp <= pts[i + 1].rp) {
      const t = (Math.log10(rp) - Math.log10(pts[i].rp)) / (Math.log10(pts[i + 1].rp) - Math.log10(pts[i].rp));
      return pts[i].loss + t * (pts[i + 1].loss - pts[i].loss);
    }
  }
  return pts[pts.length - 1].loss;
}

export interface PortfolioPML {
  totalAAL: number;
  totalTIV: number;
  pml100: number;
  pml250: number;
  tvar200: number;
  diversification: number; // sum standalone PML100 / portfolio PML100
  perilCurves: PerilLossPoint[][];
}

export function portfolioPML(rows: LocationAAL[], perils: ExtPerilId[]): PortfolioPML {
  const totalTIV = rows.reduce((s, r) => s + r.loc.totalTIV, 0);
  const maxLoss = rows.reduce((s, r) => s + r.loc.damageableTIV, 0) || 1;
  const totalAAL = rows.reduce((s, r) => s + r.totalAAL, 0);

  const perilCurves: PerilLossPoint[][] = [];
  for (const peril of perils) {
    const pts: PerilLossPoint[] = RP_GRID.map((rp) => {
      const loss = rows.reduce((s, r) => s + lossAtRP(r.perilCurves[peril] ?? [], rp), 0);
      return { p: 1 / rp, loss };
    }).sort((a, b) => b.p - a.p);
    if (pts.some((p) => p.loss > 0)) perilCurves.push(pts);
  }

  const pml100 = lossAtP(perilCurves, 1 / 100, maxLoss);
  const pml250 = lossAtP(perilCurves, 1 / 250, maxLoss);
  const tvar200 = tvarAtP(perilCurves, 1 / 200, maxLoss);

  // standalone sum of location PML100 (no diversification)
  const standalone = rows.reduce((s, r) => {
    const locCurves = Object.values(r.perilCurves);
    return s + lossAtP(locCurves, 1 / 100, r.loc.damageableTIV || 1);
  }, 0);

  return {
    totalAAL,
    totalTIV,
    pml100,
    pml250,
    tvar200,
    diversification: pml100 > 0 ? standalone / pml100 : 1,
    perilCurves,
  };
}

// ── Marginal aggregate check (single risk vs in-force book) ────────────────────
export interface MarginalCheck {
  breach: boolean;
  zone: string;
  zoneTIVBefore: number;
  zoneTIVAfter: number;
  limit: number;
  marginalPMLAdd: number;
}

/** Cresta zone of the geographically nearest in-force risk (for single-risk marginal check). */
export function nearestZone(lat: number | undefined, lng: number | undefined, book: LocationAAL[]): string | undefined {
  if (lat == null || lng == null) return undefined;
  let best: string | undefined;
  let bestD = Infinity;
  for (const r of book) {
    if (r.loc.lat == null || r.loc.lng == null) continue;
    const d = (r.loc.lat - lat) ** 2 + (r.loc.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = r.loc.cresta;
    }
  }
  return best;
}

/** Build a PortfolioLocation from a single-risk Submission for the marginal check. */
export function submissionToPortfolioLocation(s: Submission, cresta: string): PortfolioLocation {
  return {
    id: 0,
    insured: s.insuredName ?? "New risk",
    address: s.address,
    cresta,
    lat: s.lat,
    lng: s.lng,
    occupancy: s.occupancy,
    constructionId: s.constructionId,
    yearBuilt: s.yearBuilt,
    damageableTIV: damageableTIV(s.tiv),
    bi: s.tiv.bi || 0,
    totalTIV: totalTIV(s.tiv),
    chargedRatePct: s.chargedRatePct,
    indemnityMonths: s.indemnityMonths,
  };
}

export function marginalCheck(
  book: LocationAAL[],
  newLoc: PortfolioLocation,
  newAAL: LocationAAL,
  perils: ExtPerilId[],
  appetiteShare = 0.2
): MarginalCheck {
  const totalTIVAfter = book.reduce((s, r) => s + r.loc.totalTIV, 0) + newLoc.totalTIV;
  const limit = appetiteShare * totalTIVAfter;
  const zoneBefore = book
    .filter((r) => r.loc.cresta === newLoc.cresta)
    .reduce((s, r) => s + r.loc.totalTIV, 0);
  const zoneAfter = zoneBefore + newLoc.totalTIV;

  const pmlBefore = portfolioPML(book, perils).pml100;
  const pmlAfter = portfolioPML([...book, newAAL], perils).pml100;

  return {
    breach: zoneAfter > limit,
    zone: newLoc.cresta,
    zoneTIVBefore: zoneBefore,
    zoneTIVAfter: zoneAfter,
    limit,
    marginalPMLAdd: pmlAfter - pmlBefore,
  };
}
