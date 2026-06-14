// Deterministic rule-based classifier — mirrors build_rms_from_real_input.py.
// Used as the fallback when no Claude API key is configured, and as the seed
// signal Claude is told to verify or override.

const includesAny = (n, words) => words.some((w) => n.includes(w));

export function classifyOccupancyFromNarrative(narrative) {
  if (!narrative) return null;
  const n = String(narrative).toLowerCase();
  if (includesAny(n, ["vacant", "to be demolished", "demolished"])) return "vacant";
  if (includesAny(n, ["office", "admin"])) return "office";
  if (includesAny(n, ["library", "homestead"])) return "civic";
  if (includesAny(n, ["boiler", "turbine", "power house", "pump", "gas turbine",
                      "waste heat", "utility ops", "turbine generator", "sump pump"])) return "utility";
  if (includesAny(n, ["sugar and confectionary", "cane sugar refining", "sic code 2062",
                      "sugar refining", "filter house", "pan house", "mud house", "mingler",
                      "centrifugal", "syrup blending", "syrup charging", "liquid sugar station",
                      "liquor process", "specialty sugar", "main process", "production center",
                      "granular carbon"])) return "food_proc";
  if (includesAny(n, ["machine shop", "maintenance", "truck wash", "truck maintenance",
                      "wash house", "commissary"])) return "light_mfg";
  if (includesAny(n, ["warehouse", "storage", "shed", "loading", "transfer", "conveyor",
                      "railroad", "packaging material", "spare parts", "bulk sugar",
                      "sugar warehouses"])) return "warehouse";
  if (n.includes("passage")) return "warehouse";
  return null;
}

export function classifyOccupancyFromLocName(locName, insured) {
  const n = String(locName || "").toLowerCase();
  const insLower = String(insured || "").toLowerCase();
  if (includesAny(n, ["vacant", "demolished"])) return "vacant";
  if (n.includes("library")) return "civic";
  if (n.includes("homestead")) return "civic";
  if (n.includes("innovation")) return "office";
  if (includesAny(n, ["office", "admin"])) return "office";
  if (n.includes("distribution")) return "warehouse";
  if (includesAny(n, ["packaging", "processing"])) return "light_mfg";
  if (n.includes("manufacturing")) return "light_mfg";
  if (includesAny(n, ["warehouse", "storage", "shed"])) return "warehouse";
  if (includesAny(n, ["boiler", "power house", "turbine", "pump"])) return "utility";
  if (includesAny(n, ["waste water", "water treatment"])) return "utility";
  if (n.includes("refinery")) return "food_proc";
  if (insLower.includes("sugar")) return "food_proc";
  return "vacant";
}

export function classifyConstructionFromNarrative(narrative) {
  if (!narrative) return null;
  let n = String(narrative).toLowerCase();
  const pcts = [...n.matchAll(/(\d+(?:\.\d+)?)\s*%\s*([a-z][a-z\s\-()\/]+?)(?=\d+%|$|\n|\/)/g)]
    .map((m) => [Number(m[1]), m[2].trim()]);
  if (pcts.length) {
    pcts.sort((a, b) => b[0] - a[0]);
    n = pcts[0][1];
  }
  if (n.includes("high fire resistance") || n.includes("high fire resistive")) return "rc";
  if (n.includes("moderate fire resistance") || n.includes("moderate fire resistive")) return "steel";
  if (n.includes("fire resistive")) return "rc";
  if (n.includes("heavy noncombustible")) return "steel";
  if (n.includes("light noncombustible") || n.includes("metal deck (noncombustible)")) return "light_metal";
  if (n.includes("noncombustible") && !n.includes("heavy")) return "light_metal";
  if (n.includes("metal deck") && n.includes("combustible") && !n.includes("noncombustible")) return "light_metal";
  if (n.includes("frame joist")) return "wood";
  if (n.includes("combustible") && !n.includes("noncombustible")) return "wood";
  if (n.includes("masonry plank")) return "mixed";
  if (n.includes("masonry")) return "urm";
  if (n.includes("metal")) return "light_metal";
  return null;
}

export function classifyConstructionFromAge(occKey, yearBuilt) {
  if (yearBuilt && yearBuilt < 1933) {
    if (["food_proc", "office", "civic"].includes(occKey)) return "urm";
    return "light_metal";
  }
  if (occKey === "vacant") return "unknown";
  if (["office", "food_proc"].includes(occKey)) return "rc";
  if (["utility", "heavy_mfg"].includes(occKey)) return "steel";
  if (occKey === "warehouse") return "light_metal";
  if (occKey === "light_mfg") return "steel";
  if (occKey === "civic") return "urm";
  return "unknown";
}
