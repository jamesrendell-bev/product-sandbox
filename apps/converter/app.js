// CERA® AI — EDM & CEDE Converter. Orchestrates the three-screen flow:
// upload → workbench → export. Holds the shared canonical state.

import { initUpload } from "./lib/upload.js";
import { renderWorkbench, attachWorkbenchHandlers } from "./lib/workbench.js";
import { renderDiff, downloadExport } from "./lib/exporters.js";
import { buildCanonicalLocation, buildAccountsAndPolicies } from "./shared/canonical-builder.mjs";
import { parseWorkbook } from "./browser/parse.mjs";
import { classifyRows } from "./browser/classify.mjs";
import {
  listHistory, loadSnapshot, saveSnapshot, deleteSnapshot, clearAll,
  renameSnapshot, timeAgo, formatMoney,
} from "./lib/history.js";

const state = {
  submissionId: null,
  parseMeta: null,
  rawRows: [],
  classifications: [],
  locations: [],
  accounts: {},
  policies: [],
  selectedIndex: 0,
};

const $ = (s) => document.querySelector(s);
const screens = document.querySelectorAll(".screen");

function showScreen(name) {
  for (const s of screens) {
    s.hidden = s.dataset.screen !== name;
  }
  for (const st of document.querySelectorAll(".step")) {
    st.classList.toggle("is-active", st.dataset.step === name);
  }
  if (name === "upload") renderHistoryPanel();
}

function setStatus(text, kind = "") {
  const el = $("#status");
  el.className = `status ${kind}`;
  el.textContent = text;
}

function rebuildCanonical() {
  const locs = state.rawRows.map((raw, i) => {
    const cls = state.classifications[i];
    return buildCanonicalLocation(raw, {
      occ_key: cls.occ_key,
      constr_key: cls.constr_key,
      occ_source: cls.occ_source,
      constr_source: cls.constr_source,
      note: cls.reason,
    });
  });
  const { accounts, policies } = buildAccountsAndPolicies(locs);
  state.locations = locs;
  state.accounts = accounts;
  state.policies = policies;
}

// Persist current state to localStorage so the underwriter can return to it.
function persistCurrent() {
  if (!state.rawRows.length) return;
  state.submissionId = saveSnapshot({
    id: state.submissionId,
    parse_meta: state.parseMeta,
    raw_rows: state.rawRows,
    classifications: state.classifications,
    locations: state.locations,
  });
}

// Classification runs entirely in the browser against the CERA taxonomy rules
// engine, so the converter needs no backend (deployable on GitLab Pages).
async function classify(rows) {
  return classifyRows(rows);
}

async function onFileChosen(file) {
  setStatus("Reading schedule…", "working");
  try {
    const buf = await file.arrayBuffer();
    const parsed = await parseWorkbook(buf);
    state.submissionId = null;  // new submission
    state.parseMeta = parsed;
    state.rawRows = parsed.rows;

    setStatus(`Classifying ${parsed.rows.length} locations…`, "working");
    state.classifications = await classify(parsed.rows);

    rebuildCanonical();
    state.selectedIndex = 0;
    persistCurrent();
    renderWorkbench(state);
    updateWorkbenchMeta();  // call AFTER persistCurrent so the new label is in history
    showScreen("workbench");
    setStatus(`${state.locations.length} locations classified`, "ok");
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`, "err");
  }
}

function loadFromHistory(snapshotId) {
  const snap = loadSnapshot(snapshotId);
  if (!snap) {
    setStatus("Could not find that submission", "err");
    return;
  }
  state.submissionId = snap.id;
  state.parseMeta = snap.parse_meta;
  state.rawRows = snap.raw_rows;
  state.classifications = snap.classifications;
  state.selectedIndex = 0;
  rebuildCanonical();
  renderWorkbench(state);
  updateWorkbenchMeta();
  showScreen("workbench");
  setStatus(`Loaded ${snap.label || "submission"}, ${state.locations.length} locations`, "ok");
}

function updateWorkbenchMeta() {
  const sheet = state.parseMeta?.picked_sheet || "—";
  // Re-derive the active submission's label from history so the meta bar
  // shows what the user is currently editing (matches the recents list).
  const item = listHistory().find((i) => i.id === state.submissionId);
  const label = item ? item.label : "Unsaved submission";
  $("#wb-meta").innerHTML =
    `<strong>${esc(label)}</strong> · ${state.locations.length} locations · ${Object.keys(state.accounts).length} accounts · sheet: ${esc(sheet)}`;
}

async function onReclassifyAll() {
  if (!state.rawRows.length) return;
  setStatus("CERA® AI re-classifying all rows…", "working");
  try {
    state.classifications = await classify(state.rawRows, { force: true });
    rebuildCanonical();
    persistCurrent();
    renderWorkbench(state);
    setStatus("Re-classified", "ok");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
}

async function onReclassifyRow(rowIndex) {
  setStatus("CERA® AI re-classifying row…", "working");
  try {
    const single = await classify([state.rawRows[rowIndex]], { force: true });
    state.classifications[rowIndex] = single[0];
    rebuildCanonical();
    state.selectedIndex = rowIndex;
    persistCurrent();
    renderWorkbench(state);
    setStatus("Row re-classified", "ok");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
}

function onCellEdit(rowIndex, field, value) {
  const raw = state.rawRows[rowIndex];
  raw[field] = value === "" ? null : value;
  rebuildCanonical();
  persistCurrent();
  renderWorkbench(state);
}

function onRowSelect(rowIndex) {
  state.selectedIndex = rowIndex;
  renderWorkbench(state);
}

async function onExport(vendor) {
  setStatus(`Generating ${vendor === "edm" ? "RMS EDM" : "Verisk CEDE"}…`, "working");
  try {
    await downloadExport(vendor, state);
    setStatus(`${vendor === "edm" ? "RMS EDM" : "Verisk CEDE"} downloaded`, "ok");
  } catch (err) {
    setStatus(`Export error: ${err.message}`, "err");
  }
}

// ---------- history panel ----------
function renderHistoryPanel() {
  const root = $("#history-panel");
  if (!root) return;
  const items = listHistory();
  if (!items.length) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const rows = items.map((it) => `
    <li class="hist-item" data-id="${it.id}">
      <div class="hist-main">
        <div class="hist-label" title="Click to re-open">${esc(it.label)}</div>
        <div class="hist-meta">
          <span>${it.location_count} locations</span>
          <span>·</span>
          <span>${it.account_count} ${it.account_count === 1 ? "account" : "accounts"}</span>
          <span>·</span>
          <span>${formatMoney(it.total_tiv)} TIV</span>
          <span>·</span>
          <span>${esc(timeAgo(it.updated_at))}</span>
        </div>
      </div>
      <div class="hist-actions">
        <button class="link rename" data-id="${it.id}" title="Rename">Rename</button>
        <button class="link delete" data-id="${it.id}" title="Delete">Delete</button>
      </div>
    </li>
  `).join("");
  root.innerHTML = `
    <div class="hist-head">
      <h3>Recent submissions</h3>
      <button class="link" id="clear-history">Clear all</button>
    </div>
    <ul class="hist-list">${rows}</ul>
  `;

  root.querySelectorAll(".hist-item .hist-main").forEach((el) => {
    el.addEventListener("click", () => loadFromHistory(el.closest(".hist-item").dataset.id));
  });
  root.querySelectorAll(".rename").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = b.dataset.id;
      const current = items.find((i) => i.id === id)?.label || "";
      const next = prompt("Rename submission:", current);
      if (next != null && next.trim() && next !== current) {
        renameSnapshot(id, next.trim());
        renderHistoryPanel();
      }
    });
  });
  root.querySelectorAll(".delete").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = b.dataset.id;
      if (confirm("Delete this submission from your history? This can't be undone.")) {
        deleteSnapshot(id);
        renderHistoryPanel();
      }
    });
  });
  root.querySelector("#clear-history")?.addEventListener("click", () => {
    if (confirm(`Clear all ${items.length} saved submissions? This can't be undone.`)) {
      clearAll();
      renderHistoryPanel();
    }
  });
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- wiring ----------
initUpload($("#dropzone"), $("#fileinput"), $("#browse"), onFileChosen);
attachWorkbenchHandlers({ onCellEdit, onReclassifyRow, onRowSelect });

$("#reclassify-all").addEventListener("click", onReclassifyAll);
$("#goto-export").addEventListener("click", () => {
  renderDiff(state);
  showScreen("export");
});
$("#back-upload").addEventListener("click", () => showScreen("upload"));
$("#back-workbench").addEventListener("click", () => showScreen("workbench"));
$("#dl-edm").addEventListener("click", () => onExport("edm"));
$("#dl-cede").addEventListener("click", () => onExport("cede"));

// Initial screen
showScreen("upload");
setStatus("Drop a broker schedule to start");
