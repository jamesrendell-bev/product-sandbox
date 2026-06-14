// Merge several nearby Meteostat stations into one daily series, taking each
// field from the nearest station that actually reports it. Fills coverage gaps
// (US / Europe / anywhere) and records provenance per field.
import type { DailyRow, Station } from "./api";
import { dateAddDays, daysBetween } from "./format";

export interface StationData { station: Station; rows: DailyRow[] }
export interface FieldSource { name: string; id: string; distance_km: number; coverage: number }
export interface MergedData {
  rows: DailyRow[];
  sources: Record<string, FieldSource | null>; // field → station that fed it
  usedStationIds: Set<string>;
}

// Meteostat daily fields the triage needs.
export const TRIAGE_FIELDS = ["prcp", "wspd", "wpgt", "tmax", "tmin", "snow"];

function fieldCoverage(rows: DailyRow[], field: string, totalDays: number): number {
  let present = 0;
  for (const r of rows) if (Number.isFinite(r[field] as number)) present++;
  return totalDays ? present / totalDays : 0;
}

export function mergeStationsByField(
  stationData: StationData[], // sorted nearest-first
  fields: string[],
  fetchStart: string,
  fetchEnd: string,
): MergedData {
  const totalDays = daysBetween(fetchStart, fetchEnd) + 1;
  const byStation = stationData.map((sd) => ({ ...sd, byDate: new Map(sd.rows.map((r) => [r.date, r])) }));

  const chosen: Record<string, number> = {};
  const sources: MergedData["sources"] = {};
  const usedStationIds = new Set<string>();

  for (const f of fields) {
    let bestIdx = -1, bestCov = -1, nearIdx = -1;
    for (let i = 0; i < byStation.length; i++) {
      const cov = fieldCoverage(byStation[i].rows, f, totalDays);
      if (cov > bestCov) { bestCov = cov; bestIdx = i; }
      if (nearIdx === -1 && cov >= 0.5) nearIdx = i; // nearest with good coverage
    }
    const idx = nearIdx >= 0 ? nearIdx : bestIdx;
    chosen[f] = idx;
    if (idx >= 0) {
      const s = byStation[idx].station;
      sources[f] = { name: s.name, id: s.id, distance_km: s.distance_km, coverage: fieldCoverage(byStation[idx].rows, f, totalDays) };
      if (sources[f]!.coverage > 0) usedStationIds.add(s.id);
    } else sources[f] = null;
  }

  const rows: DailyRow[] = [];
  for (let d = fetchStart; d <= fetchEnd; d = dateAddDays(d, 1)) {
    const row: DailyRow = { date: d };
    for (const f of fields) {
      const idx = chosen[f];
      const r = idx >= 0 ? byStation[idx].byDate.get(d) : undefined;
      row[f] = r ? ((r[f] as number | null) ?? null) : null;
    }
    rows.push(row);
  }
  return { rows, sources, usedStationIds };
}
