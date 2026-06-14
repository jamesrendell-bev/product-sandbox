// Build a fully-populated canonical location from a raw broker row + an
// occupancy/construction classification. Keeps per-field source flags so the
// UI and the exporters can colour SUPPLIED vs ESTIMATED.

import {
  RATIOS, NOTIONAL_TIV, DEFAULT_STORIES, DEFAULT_YEAR_BUILT,
  perilsForLocation, defaultModifiers, geomatchCanonical,
} from "./canonical.mjs";

export function buildCanonicalLocation(raw, cls) {
  // cls: { occ_key, constr_key, occ_source, constr_source, note }
  const sources = {};
  const loc = { ...raw };

  // Occupancy + construction (sources set by caller)
  loc.occ_key = cls.occ_key;
  loc.constr_key = cls.constr_key;
  loc.class_note = cls.note || null;
  sources.occupancy = cls.occ_source || "ESTIMATED";
  sources.construction = cls.constr_source || "ESTIMATED";

  // Year built
  if (raw.year_built != null) {
    sources.year_built = "SUPPLIED";
  } else {
    loc.year_built = DEFAULT_YEAR_BUILT[cls.occ_key] ?? null;
    sources.year_built = "ESTIMATED";
  }

  // Stories
  if (raw.stories != null) {
    sources.stories = "SUPPLIED";
  } else {
    loc.stories = DEFAULT_STORIES[cls.occ_key] ?? 1;
    sources.stories = "ESTIMATED";
  }

  // Sprinkler %
  if (raw.sprinkler_pct != null) {
    loc.sprinklered = raw.sprinkler_pct >= 50 ? "Y" : "N";
    sources.sprinklered = "SUPPLIED";
  } else {
    const mods = defaultModifiers(cls.occ_key, cls.constr_key, loc.year_built);
    loc.sprinklered = mods.sprinklered;
    sources.sprinklered = "ESTIMATED";
  }

  // Other secondary modifiers — always estimated unless input contains them.
  const mods = defaultModifiers(cls.occ_key, cls.constr_key, loc.year_built);
  loc.roof_type   = loc.roof_type   ?? mods.roof_type;
  loc.roof_age    = loc.roof_age    ?? mods.roof_age;
  loc.soft_storey = loc.soft_storey ?? mods.soft_storey;
  loc.basement    = loc.basement    ?? mods.basement;
  loc.ext_wall    = loc.ext_wall    ?? mods.ext_wall;
  sources.other_modifiers = "ESTIMATED";

  // TIV — supplied / partial / estimated, following section 6.1 precedence.
  const bldg  = raw.buildings_value ?? null;
  const me    = raw.me_value ?? null;
  const bi    = raw.bi_value ?? null;
  const misc  = raw.misc_value ?? null;
  const totPd = raw.total_pd ?? null;
  const totBi = raw.total_pd_bi ?? null;
  const anySupplied = [bldg, me, bi, misc, totPd, totBi].some((v) => v != null);

  const [rb, rc, rbi, ro] = RATIOS[cls.occ_key] || RATIOS.vacant;

  if (bldg != null && me != null) {
    loc.building_value = bldg;
    loc.contents_value = me;
    loc.other_value    = misc || 0;
    loc.bi_value       = bi != null ? bi : 0;
    loc.tiv_total = loc.building_value + loc.contents_value + loc.bi_value + loc.other_value;
    loc.split_ratio = "as-supplied";
    sources.tiv = "SUPPLIED";
  } else if (anySupplied) {
    let base;
    if (totBi != null) base = totBi;
    else if (totPd != null && bi != null) base = totPd + bi;
    else if (totPd != null) base = (rb + rc + ro) > 0 ? totPd / (rb + rc + ro) : totPd;
    else if (bldg != null) base = rb > 0 ? bldg / rb : bldg;
    else if (me != null) base = rc > 0 ? me / rc : me;
    else base = rbi > 0 ? (bi || 0) / rbi : (bi || 0);
    loc.building_value = bldg != null ? bldg : Math.round(base * rb);
    loc.contents_value = me   != null ? me   : Math.round(base * rc);
    loc.bi_value       = bi   != null ? bi   : Math.round(base * rbi);
    loc.other_value    = misc != null ? misc : Math.round(base * ro);
    loc.tiv_total = loc.building_value + loc.contents_value + loc.bi_value + loc.other_value;
    loc.split_ratio = `${Math.round(rb*100)}/${Math.round(rc*100)}/${Math.round(rbi*100)} (mixed)`;
    sources.tiv = "PARTIAL";
  } else {
    const base = NOTIONAL_TIV[cls.occ_key] ?? 5_000_000;
    loc.building_value = Math.round(base * rb);
    loc.contents_value = Math.round(base * rc);
    loc.bi_value       = Math.round(base * rbi);
    loc.other_value    = Math.round(base * ro);
    loc.tiv_total = base;
    loc.split_ratio = `${Math.round(rb*100)}/${Math.round(rc*100)}/${Math.round(rbi*100)}`;
    sources.tiv = "ESTIMATED";
  }

  // Address: supplied if any address field came through.
  sources.address = (raw.address || raw.city || raw.state || raw.zip) ? "SUPPLIED" : "ESTIMATED";
  sources.latlng  = (raw.lat != null && raw.lng != null) ? "SUPPLIED" : "ESTIMATED";

  // Perils — geographic heuristic for v1.
  loc.perils_covered = perilsForLocation(loc.state, loc.city);
  sources.perils = "DERIVED";

  loc.geo_canonical = geomatchCanonical(loc.lat, loc.lng);

  loc.sources = sources;
  return loc;
}

export function buildAccountsAndPolicies(locations, opts = {}) {
  const incept = opts.inception || "2026-05-01";
  const expiry = opts.expiration || "2027-05-01";

  const accounts = {};
  for (const loc of locations) {
    const key = loc.division || loc.insured || "Unknown Insured";
    if (!accounts[key]) accounts[key] = `ACC${String(Object.keys(accounts).length + 1).padStart(4, "0")}`;
    loc.acc_num = accounts[key];
  }

  const policies = Object.entries(accounts).map(([name, accnum], i) => ({
    policy_number: `POL${String(i + 1).padStart(4, "0")}`,
    account_number: accnum,
    policy_name: `${name} — All-Risks Property`,
    lob: "Industrial Facility",
    inception: incept,
    expiration: expiry,
    blanket_limit: 500_000_000,
    blanket_deductible: 1_000_000,
    hu_deductible_pct: 2.0,
    eq_deductible_pct: 5.0,
    perils_covered: "HU,EQ,FL,ST,WS,WF,FR",
    indemnity_period_m: 18,
    participation_pct: 100,
    currency: "USD",
  }));
  const polByAcc = Object.fromEntries(policies.map((p) => [p.account_number, p]));
  for (const loc of locations) {
    loc.policy_number = polByAcc[loc.acc_num].policy_number;
  }
  return { accounts, policies };
}
