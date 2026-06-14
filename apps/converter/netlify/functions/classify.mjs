// POST /api/classify
// Body: { rows: [{ id, location, occupancy_narrative, construction_narrative, year_built, insured }], force? }
// Returns: { classifications: [{ id, occ_key, constr_key, occ_source, constr_source, reason }] }
//
// Hybrid: deterministic rules first. Rows where both fields resolve cleanly
// from broker narrative are marked SUPPLIED and skip the Claude call. The
// remainder are batched to Claude with constrained tool-use output. `force:
// true` sends every row to Claude regardless.

import {
  classifyOccupancyFromNarrative, classifyOccupancyFromLocName,
  classifyConstructionFromNarrative, classifyConstructionFromAge,
} from "../../shared/rules-classifier.mjs";
import { classifyBatch } from "../../shared/claude.mjs";

// Big batch size on purpose. With Haiku we can fit 100+ rows in a single
// Claude call (~150 tokens output per row × 100 = 15K, well under max_tokens).
// One big call beats N parallel calls because new (Tier 1) Anthropic accounts
// only allow 1 concurrent message, so "parallel" calls actually queue + retry
// internally, blowing the Netlify 26s budget. When code IS sent as multiple
// batches (>BATCH_SIZE rows), they still go in parallel via Promise.all —
// once your account upgrades to Tier 2+ this gets faster automatically.
const BATCH_SIZE = 100;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const body = JSON.parse(event.body || "{}");
    const rows = body.rows || [];
    const force = !!body.force;

    const out = new Array(rows.length);
    const needsClaude = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (force) {
        needsClaude.push({ i, r });
        continue;
      }
      const occRule = classifyOccupancyFromNarrative(r.occupancy_narrative);
      const conRule = classifyConstructionFromNarrative(r.construction_narrative);
      if (occRule && conRule) {
        out[i] = {
          id: r.id,
          occ_key: occRule,
          constr_key: conRule,
          occ_source: "SUPPLIED",
          constr_source: "SUPPLIED",
          reason: "Both occupancy and construction matched directly from broker narrative (rule-based).",
        };
      } else {
        needsClaude.push({ i, r });
      }
    }

    if (needsClaude.length && !process.env.ANTHROPIC_API_KEY) {
      // No key — fall back to deterministic rules end-to-end.
      for (const { i, r } of needsClaude) {
        const occ = classifyOccupancyFromNarrative(r.occupancy_narrative)
                 || classifyOccupancyFromLocName(r.location, r.insured);
        const con = classifyConstructionFromNarrative(r.construction_narrative)
                 || classifyConstructionFromAge(occ, r.year_built);
        out[i] = {
          id: r.id,
          occ_key: occ,
          constr_key: con,
          occ_source: classifyOccupancyFromNarrative(r.occupancy_narrative) ? "SUPPLIED" : "ESTIMATED",
          constr_source: classifyConstructionFromNarrative(r.construction_narrative) ? "SUPPLIED" : "ESTIMATED",
          reason: "Estimated by deterministic rules (no ANTHROPIC_API_KEY configured).",
        };
      }
    } else if (needsClaude.length) {
      // Split into batches and dispatch all of them to Claude in parallel.
      const batches = [];
      for (let i = 0; i < needsClaude.length; i += BATCH_SIZE) {
        batches.push(needsClaude.slice(i, i + BATCH_SIZE));
      }

      const writeFromClaude = (batch, res) => {
        const byId = Object.fromEntries((res || []).map((c) => [c.id, c]));
        for (const { i: idx, r } of batch) {
          const c = byId[r.id || `row-${idx}`];
          if (!c) {
            const occ = classifyOccupancyFromLocName(r.location, r.insured);
            const con = classifyConstructionFromAge(occ, r.year_built);
            out[idx] = {
              id: r.id, occ_key: occ, constr_key: con,
              occ_source: "ESTIMATED", constr_source: "ESTIMATED",
              reason: "CERA® AI did not return this row; deterministic-rule fallback applied.",
            };
            continue;
          }
          const hadOccNarr = !!classifyOccupancyFromNarrative(r.occupancy_narrative);
          const hadConNarr = !!classifyConstructionFromNarrative(r.construction_narrative);
          out[idx] = {
            id: r.id,
            occ_key: c.occupancy,
            constr_key: c.construction,
            occ_source: hadOccNarr ? "SUPPLIED" : "ESTIMATED",
            constr_source: hadConNarr ? "SUPPLIED" : "ESTIMATED",
            reason: c.reason || "Classified by CERA® AI.",
          };
        }
      };

      const writeFromRulesFallback = (batch, err) => {
        for (const { i: idx, r } of batch) {
          const occ = classifyOccupancyFromLocName(r.location, r.insured);
          const con = classifyConstructionFromAge(occ, r.year_built);
          out[idx] = {
            id: r.id, occ_key: occ, constr_key: con,
            occ_source: "ESTIMATED", constr_source: "ESTIMATED",
            reason: `CERA® AI call failed (${err?.message || err}); rule fallback applied.`,
          };
        }
      };

      await Promise.all(batches.map(async (batch) => {
        const payload = batch.map(({ i: idx, r }) => ({ ...r, id: r.id || `row-${idx}` }));
        try {
          const res = await classifyBatch(payload);
          writeFromClaude(batch, res);
        } catch (err) {
          writeFromRulesFallback(batch, err);
        }
      }));
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classifications: out }),
    };
  } catch (err) {
    return { statusCode: 500, body: `classify error: ${err.message}` };
  }
};
