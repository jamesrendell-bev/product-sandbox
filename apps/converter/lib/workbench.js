// Workbench: editable table + side panel. Renders the canonical locations
// with source-flag colouring, supports inline cell editing on the broker
// narrative fields, and surfaces Claude's reasoning per selected row.

import { RMS_OCC, RMS_CONSTR } from "../shared/rms-codes.mjs";
import { AIR_OCC, AIR_CONSTR } from "../shared/cede-codes.mjs";

let handlers = { onCellEdit: () => {}, onReclassifyRow: () => {}, onRowSelect: () => {} };
export function attachWorkbenchHandlers(h) { handlers = { ...handlers, ...h }; }

const COLUMNS = [
  { key: "location",               label: "Location",        editable: true,  source: "address" },
  { key: "address",                label: "Street",          editable: true,  source: "address" },
  { key: "city",                   label: "City",            editable: true,  source: "address" },
  { key: "state",                  label: "State",           editable: true,  source: "address" },
  { key: "zip",                    label: "Zip",             editable: false, source: "address" },
  { key: "occ_key",                label: "Occupancy",       editable: false, source: "occupancy",    transform: (v, row) => `${RMS_OCC[v]?.code ?? "—"} · ${v}` },
  { key: "constr_key",             label: "Construction",   editable: false,  source: "construction", transform: (v) => `${RMS_CONSTR[v]?.code ?? "—"} · ${v}` },
  { key: "year_built",             label: "Year",           editable: false,  source: "year_built" },
  { key: "stories",                label: "Stories",        editable: false,  source: "stories" },
  { key: "tiv_total",              label: "TIV total",      editable: false,  source: "tiv", money: true },
  { key: "building_value",         label: "Building",       editable: false,  source: "tiv", money: true },
  { key: "contents_value",         label: "Contents",       editable: false,  source: "tiv", money: true },
  { key: "bi_value",               label: "BI",             editable: false,  source: "tiv", money: true },
  { key: "sprinklered",            label: "Sprinkler",      editable: false,  source: "sprinklered" },
  { key: "perils_csv",             label: "Perils",         editable: false,  source: "perils",
                                                                              transform: (_, row) => (row.perils_covered || []).join(",") },
  { key: "occupancy_narrative",    label: "Broker occupancy text",    editable: true, source: "occupancy" },
  { key: "construction_narrative", label: "Broker construction text", editable: true, source: "construction" },
];

const SOURCE_COLS = [
  { key: "occupancy",       label: "Occ" },
  { key: "construction",    label: "Con" },
  { key: "year_built",      label: "Yr" },
  { key: "tiv",             label: "TIV" },
  { key: "sprinklered",     label: "Spr" },
  { key: "other_modifiers", label: "Mod" },
];

const fmtMoney = (n) => (n == null || n === "" ? "" : "$" + Math.round(n).toLocaleString());

export function renderWorkbench(state) {
  const root = document.getElementById("wb-table");
  if (!state.locations.length) {
    root.innerHTML = `<div style="padding:24px;color:var(--grey)">No locations parsed.</div>`;
    return;
  }

  const html = [];
  html.push("<table><thead><tr>");
  html.push("<th>#</th>");
  for (const c of COLUMNS) html.push(`<th>${c.label}</th>`);
  for (const s of SOURCE_COLS) html.push(`<th class="source-col">${s.label}</th>`);
  html.push(`<th class="audit-col">CERA® AI reasoning</th>`);
  html.push("</tr></thead><tbody>");

  state.locations.forEach((loc, i) => {
    const selected = i === state.selectedIndex ? "is-selected" : "";
    html.push(`<tr class="${selected}" data-row="${i}">`);
    html.push(`<td>${i + 1}</td>`);
    for (const c of COLUMNS) {
      let val = loc[c.key];
      if (c.transform) val = c.transform(val, loc);
      else if (c.money) val = fmtMoney(val);
      else val = val ?? "";
      const src = loc.sources?.[c.source] || "";
      const classes = ["source-" + src];
      if (c.money) classes.push("money");
      if (c.editable) classes.push("editable");
      const editAttr = c.editable ? `contenteditable="true" data-edit-field="${c.key}"` : "";
      const safe = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      html.push(`<td class="${classes.join(" ")}" ${editAttr}>${safe}</td>`);
    }
    for (const s of SOURCE_COLS) {
      const v = loc.sources?.[s.key] || "";
      html.push(`<td class="flag ${v}">${v.slice(0,4)}</td>`);
    }
    const reason = (loc.class_note || "").replace(/</g, "&lt;");
    html.push(`<td class="audit-col" style="max-width:340px;white-space:normal">${reason}</td>`);
    html.push("</tr>");
  });
  html.push("</tbody></table>");
  root.innerHTML = html.join("");

  // Row selection
  root.querySelectorAll("tr[data-row]").forEach((tr) => {
    tr.addEventListener("click", (e) => {
      // Don't change selection when starting to edit a cell.
      if ((e.target).hasAttribute("contenteditable")) return;
      handlers.onRowSelect(Number(tr.dataset.row));
    });
  });

  // Inline edit
  root.querySelectorAll("td[contenteditable=true]").forEach((td) => {
    td.addEventListener("blur", () => {
      const tr = td.closest("tr");
      const rowIndex = Number(tr.dataset.row);
      const field = td.dataset.editField;
      const newVal = td.textContent.trim();
      const raw = state.rawRows[rowIndex];
      if (String(raw[field] ?? "") === newVal) return;
      handlers.onCellEdit(rowIndex, field, newVal);
    });
    td.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); td.blur(); }
      if (e.key === "Escape") { td.textContent = td.dataset.original ?? td.textContent; td.blur(); }
    });
    td.addEventListener("focus", () => { td.dataset.original = td.textContent; });
  });

  renderSidePanel(state);
}

function renderSidePanel(state) {
  const side = document.getElementById("wb-side");
  const loc = state.locations[state.selectedIndex];
  if (!loc) { side.innerHTML = `<div class="side-empty">Select a row.</div>`; return; }

  const rms_occ = RMS_OCC[loc.occ_key] || {};
  const rms_con = RMS_CONSTR[loc.constr_key] || {};
  const cede_occ = AIR_OCC[loc.occ_key] || {};
  const cede_con = AIR_CONSTR[loc.constr_key] || {};

  side.innerHTML = `
    <div class="side-row">
      <div class="side-label">Location ${state.selectedIndex + 1} of ${state.locations.length}</div>
      <div class="side-value"><strong>${esc(loc.location || "—")}</strong></div>
      <div class="side-value" style="color:var(--grey);font-size:12px">${esc(loc.address || "")} ${esc(loc.city || "")} ${esc(loc.state || "")} ${esc(loc.zip || "")}</div>
    </div>
    <div class="side-row">
      <div class="side-label">CERA® AI reasoning</div>
      <div class="side-value">${esc(loc.class_note || "—")}</div>
    </div>
    <div class="side-row">
      <div class="side-label">Occupancy</div>
      <div class="side-vendor">
        <span class="pill rms">RMS</span><span class="v">${rms_occ.code} · ${esc(rms_occ.desc || "")}</span>
        <span class="pill cede">CEDE</span><span class="v">${cede_occ.code} · ${esc(cede_occ.desc || "")}</span>
      </div>
    </div>
    <div class="side-row">
      <div class="side-label">Construction</div>
      <div class="side-vendor">
        <span class="pill rms">RMS</span><span class="v">${rms_con.code} · ${esc(rms_con.desc || "")}</span>
        <span class="pill cede">CEDE</span><span class="v">${cede_con.code} · ${esc(cede_con.desc || "")}</span>
      </div>
    </div>
    <div class="side-row">
      <div class="side-label">TIV (${loc.split_ratio})</div>
      <div class="side-value">
        Building ${fmtMoney(loc.building_value)}<br>
        Contents ${fmtMoney(loc.contents_value)}<br>
        BI ${fmtMoney(loc.bi_value)}<br>
        Other ${fmtMoney(loc.other_value)}<br>
        <strong>Total ${fmtMoney(loc.tiv_total)}</strong>
      </div>
    </div>
    <div class="side-row">
      <div class="side-label">Perils covered (canonical)</div>
      <div class="side-value">${(loc.perils_covered || []).join(", ")}</div>
    </div>
    <div class="btn-row">
      <button class="btn" id="re-row">Re-classify this row with CERA® AI</button>
    </div>
  `;
  side.querySelector("#re-row").addEventListener("click", () => handlers.onReclassifyRow(state.selectedIndex));
}

function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
