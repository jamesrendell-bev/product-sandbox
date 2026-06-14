// Export-screen renderer + download trigger. Calls /api/export-edm and
// /api/export-cede, surfaces them in the side-by-side diff, and streams the
// xlsx back to disk.

import { RMS_OCC, RMS_CONSTR, RMS_GEO } from "../shared/rms-codes.mjs";
import { AIR_OCC, AIR_CONSTR, AIR_GEO } from "../shared/cede-codes.mjs";
import { mapPerils } from "../shared/canonical.mjs";
import { buildEdmWorkbook, buildCedeWorkbook, downloadWorkbook } from "../browser/exporters-build.mjs";

export function renderDiff(state) {
  const loc = state.locations[state.selectedIndex] || state.locations[0];
  if (!loc) return;
  const rms_occ = RMS_OCC[loc.occ_key] || {};
  const rms_con = RMS_CONSTR[loc.constr_key] || {};
  const rms_geo = RMS_GEO[loc.geo_canonical] || {};
  const cede_occ = AIR_OCC[loc.occ_key] || {};
  const cede_con = AIR_CONSTR[loc.constr_key] || {};
  const cede_geo = AIR_GEO[loc.geo_canonical] || {};

  const rmsPerils  = mapPerils(loc.perils_covered || [], "rms").join(",");
  const cedePerils = mapPerils(loc.perils_covered || [], "cede").join(",");

  const rows = [
    ["Sheet name",         "Location",              "LocationInfo"],
    ["Account wrapper",    "Account",               "ContractInfo"],
    ["BI field name",      "BIValue",               "TimeElementValue"],
    ["Occupancy code",     `${rms_occ.code} (${rms_occ.desc || ""})`,  `${cede_occ.code} (${cede_occ.desc || ""})`],
    ["Construction code",  `${rms_con.code} (${rms_con.desc || ""})`,  `${cede_con.code} (${cede_con.desc || ""})`],
    ["Geocode level",      `${rms_geo.code} ${rms_geo.desc || ""}`,    `${cede_geo.code} ${cede_geo.desc || ""}`],
    ["Perils covered",     rmsPerils,               cedePerils],
    ["Country field",      "USA (ISO-3)",           "US (ISO-2)"],
    ["Locations included", `${state.locations.length}`, `${state.locations.length}`],
    ["Accounts / Contracts", `${Object.keys(state.accounts).length}`, `${Object.keys(state.accounts).length}`],
    ["Total TIV",          fmtMoney(totalTiv(state)), fmtMoney(totalTiv(state))],
  ];

  const rmsHtml = rows.map((r) => row(r[0], r[1], r[1] !== r[2])).join("");
  const cedeHtml = rows.map((r) => row(r[0], r[2], r[1] !== r[2])).join("");
  document.getElementById("diff-rms").innerHTML = rmsHtml;
  document.getElementById("diff-cede").innerHTML = cedeHtml;
}

function row(k, v, differs) {
  return `<div class="row"><span class="k">${esc(k)}</span><span class="v ${differs ? "differs" : ""}">${esc(v)}</span></div>`;
}

function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function totalTiv(state) { return state.locations.reduce((s, l) => s + (l.tiv_total || 0), 0); }
function fmtMoney(n) { return "$" + Math.round(n).toLocaleString(); }

export async function downloadExport(vendor, state) {
  const wb = vendor === "edm" ? buildEdmWorkbook(state) : buildCedeWorkbook(state);
  const filename = vendor === "edm" ? "CERA-RMS-EDM-Export.xlsx" : "CERA-Verisk-CEDE-Export.xlsx";
  await downloadWorkbook(wb, filename);
}
