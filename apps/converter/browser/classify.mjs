// Browser-side classifier. Runs the deterministic rules engine entirely in the
// page (no backend), so occupancy and construction are classified against the
// CERA taxonomy with no API call. This mirrors the rules-only path that the
// server function already falls back to when no Claude key is present.
//
// Optional Claude enhancement: if you later stand up a classify endpoint
// (or proxy), set window.CERA_CLASSIFY_URL and pass useClaude:true; otherwise
// the rules engine handles every row.

import {
  classifyOccupancyFromNarrative, classifyOccupancyFromLocName,
  classifyConstructionFromNarrative, classifyConstructionFromAge,
} from "../shared/rules-classifier.mjs";

export function classifyRows(rows) {
  return rows.map((r, i) => {
    const occNarr = classifyOccupancyFromNarrative(r.occupancy_narrative);
    const conNarr = classifyConstructionFromNarrative(r.construction_narrative);

    const occ = occNarr || classifyOccupancyFromLocName(r.location, r.insured);
    const con = conNarr || classifyConstructionFromAge(occ, r.year_built);

    const bothSupplied = occNarr && conNarr;
    return {
      id: r.id || `row-${i}`,
      occ_key: occ,
      constr_key: con,
      occ_source: occNarr ? "SUPPLIED" : "ESTIMATED",
      constr_source: conNarr ? "SUPPLIED" : "ESTIMATED",
      reason: bothSupplied
        ? "Occupancy and construction matched directly from the broker narrative (rule-based)."
        : "Classified by the CERA taxonomy rules engine: broker narrative where present, otherwise inferred from the location name, insured and year built.",
    };
  });
}
