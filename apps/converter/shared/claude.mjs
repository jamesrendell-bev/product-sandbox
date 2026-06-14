// Anthropic SDK wrapper — single classify call that takes a batch of rows and
// returns occ_key + constr_key + reasoning per row, constrained to the
// canonical vocabulary via tool-use schema enforcement.

import Anthropic from "@anthropic-ai/sdk";
import { OCC_KEYS, CONSTR_KEYS } from "./canonical.mjs";

// Haiku is the right pick here: the task is constrained enum classification
// (no open-ended reasoning), so Sonnet/Opus is overkill. Haiku is 3-5x faster
// and 3x cheaper, which matters because new (Tier 1) Anthropic accounts allow
// only 1 concurrent stream — fast per-call latency keeps batches under the
// Netlify 26s limit. Override via CLAUDE_MODEL env var if you want to test
// quality on Sonnet/Opus.
const DEFAULT_MODEL = "claude-haiku-4-5";

let _client = null;
export function getClient() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

const TOOL = {
  name: "classify_locations",
  description: "Return the canonical occupancy and construction key for each location, with a one-sentence reason.",
  input_schema: {
    type: "object",
    properties: {
      classifications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Echo the input id verbatim." },
            occupancy: { type: "string", enum: OCC_KEYS },
            construction: { type: "string", enum: [...CONSTR_KEYS] },
            reason: { type: "string", description: "One sentence: what in the broker text drove these picks." },
          },
          required: ["id", "occupancy", "construction", "reason"],
        },
      },
    },
    required: ["classifications"],
  },
};

const SYSTEM = `You are a catastrophe-modelling exposure analyst classifying insured locations for CERA® AI (BirdsEyeView).

Each row gives you:
  - location: building name / function (e.g. "Sugar Refinery", "Vacant Office")
  - occupancy_narrative: broker-supplied occupancy description (may be blank)
  - construction_narrative: broker-supplied ISO-class or material description (may be blank)
  - year_built: integer or null
  - insured: legal entity name

Return exactly one occupancy_key and one construction_key per row, both drawn from the supplied enums (no free text). Vocabulary:

OCCUPANCY:
  office       — admin / R&D / corporate office buildings
  warehouse    — storage, sheds, conveyors, bulk handling, distribution
  light_mfg    — packaging, maintenance, machine shop, wash, light assembly
  heavy_mfg    — heavy industrial fabrication
  food_proc    — sugar refining, food and drug processing, process buildings (SIC 2062 etc.)
  utility      — boiler, power, turbine, pump, water/waste treatment
  civic        — library, homestead, government, public
  vacant       — vacant, demolished, to-be-demolished

CONSTRUCTION:
  wood         — wood frame, frame joist, combustible
  light_metal  — light noncombustible, metal deck, light metal
  steel        — heavy noncombustible, heavy steel, moderate fire-resistive
  rc           — fire-resistive, reinforced concrete, high fire-resistance
  urm          — unreinforced masonry, pre-1933 brick, "masonry"
  mixed        — clear compound construction ("masonry plank on timber")
  unknown      — genuinely unclassifiable from text and age

If construction_narrative gives a clear ISO-class signal, trust it. If absent, infer from occupancy + year_built (pre-1933 process buildings → urm; modern food_proc → rc; warehouses → light_metal; utility → steel). For compound % descriptions, pick the predominant class. Always return both fields — never null.

Be concise in the reason field: cite the specific words you matched.`;

export async function classifyBatch(rows, opts = {}) {
  if (!rows.length) return [];
  const client = getClient();
  const model = opts.model || process.env.CLAUDE_MODEL || DEFAULT_MODEL;

  const userPayload = rows.map((r) => ({
    id: r.id,
    location: r.location ?? "",
    occupancy_narrative: r.occupancy_narrative ?? "",
    construction_narrative: r.construction_narrative ?? "",
    year_built: r.year_built ?? null,
    insured: r.insured ?? "",
  }));

  const resp = await client.messages.create({
    model,
    max_tokens: 8192,  // Headroom for big batches — each row ~300 output tokens.
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "classify_locations" },
    messages: [
      {
        role: "user",
        content: `Classify the following ${rows.length} locations. Return one classification per row, echoing the id.\n\n` +
                 "```json\n" + JSON.stringify(userPayload, null, 2) + "\n```",
      },
    ],
  });

  const toolUse = resp.content.find((b) => b.type === "tool_use" && b.name === "classify_locations");
  if (!toolUse) throw new Error("Claude did not return a tool_use block");
  return toolUse.input.classifications || [];
}
