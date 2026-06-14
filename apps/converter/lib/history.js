// Recent-submissions store backed by localStorage. Auto-saves a snapshot
// of every processed submission so an underwriter can re-open prior work
// without re-uploading or re-classifying.
//
// Design notes:
//   - Single key `cera-history-v1` holds an array of submission snapshots,
//     newest-first. Capped at MAX_ITEMS to stay well within the ~5MB
//     localStorage budget. A single 100-row classified state ≈ 80KB.
//   - Snapshots are NOT immutable — the same submission updates in place
//     when the user edits cells or re-classifies. Each snapshot carries
//     `created_at` (first upload) AND `updated_at` (last interaction).
//   - We persist the post-parse, post-classify state, not the raw xlsx
//     file. The xlsx is too big and re-parsing is slow; the canonical
//     intermediate is what the workbench actually renders.

const STORAGE_KEY  = "cera-history-v1";
const MAX_ITEMS    = 25;

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    return true;
  } catch (err) {
    console.warn("history: localStorage write failed", err);
    return false;
  }
}

function uid() {
  return "sub_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// Derive a meaningful label from the submission. Preference order:
//   1. user-set label
//   2. top insured / division name
//   3. parsed sheet name
function deriveLabel(snap) {
  if (snap.label) return snap.label;
  const counts = {};
  for (const r of snap.raw_rows || []) {
    const ins = (r.insured || r.division || "").trim();
    if (ins) counts[ins] = (counts[ins] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top) return top[0];
  return snap.parse_meta?.picked_sheet || "Untitled submission";
}

function deriveStats(snap, locations) {
  const rows = snap.raw_rows || [];
  const totalTiv = (locations || []).reduce((s, l) => s + (l.tiv_total || 0), 0);
  const accounts = new Set();
  for (const r of rows) {
    const k = (r.division || r.insured || "").trim();
    if (k) accounts.add(k);
  }
  return {
    location_count: rows.length,
    account_count:  accounts.size,
    total_tiv:      totalTiv,
  };
}

export function listHistory() {
  return read().map((s) => ({
    id:             s.id,
    label:          deriveLabel(s),
    location_count: s.location_count ?? 0,
    account_count:  s.account_count ?? 0,
    total_tiv:      s.total_tiv ?? 0,
    created_at:     s.created_at,
    updated_at:     s.updated_at,
  }));
}

export function loadSnapshot(id) {
  return read().find((s) => s.id === id) || null;
}

// Save (insert or update). Returns the snapshot id.
export function saveSnapshot({ id, parse_meta, raw_rows, classifications, locations, label }) {
  const items = read();
  const now = new Date().toISOString();
  const stats = deriveStats({ raw_rows }, locations);

  const newSnap = {
    id: id || uid(),
    created_at: now,
    updated_at: now,
    label,
    ...stats,
    parse_meta,
    raw_rows,
    classifications,
  };

  const existingIdx = id ? items.findIndex((s) => s.id === id) : -1;
  if (existingIdx >= 0) {
    // Preserve original created_at; bump updated_at.
    newSnap.created_at = items[existingIdx].created_at;
    newSnap.label = label ?? items[existingIdx].label;
    items.splice(existingIdx, 1);
  }
  items.unshift(newSnap);
  write(items);
  return newSnap.id;
}

export function renameSnapshot(id, label) {
  const items = read();
  const i = items.findIndex((s) => s.id === id);
  if (i < 0) return false;
  items[i].label = label;
  items[i].updated_at = new Date().toISOString();
  write(items);
  return true;
}

export function deleteSnapshot(id) {
  const items = read().filter((s) => s.id !== id);
  write(items);
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}

// Human-readable relative time ("2 minutes ago", "Yesterday", "3 May").
export function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatMoney(n) {
  if (!n) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000)         return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
