// RMS EDM code dictionaries — illustrative. In production, version per
// Risk Modeler release and per customer instance.

export const RMS_OCC = {
  office:    { code: 322, desc: "General Office" },
  warehouse: { code: 343, desc: "Industrial — Warehouse" },
  light_mfg: { code: 341, desc: "Industrial — Manufacturing (light)" },
  heavy_mfg: { code: 342, desc: "Industrial — Manufacturing (heavy)" },
  food_proc: { code: 344, desc: "Industrial — Food & Drug Processing" },
  utility:   { code: 345, desc: "Industrial — Utility / Power" },
  civic:     { code: 371, desc: "Public / Civic" },
  vacant:    { code: 399, desc: "Vacant / Unknown" },
};

export const RMS_CONSTR = {
  wood:        { code: 101, desc: "Wood Frame" },
  light_metal: { code: 111, desc: "Light Metal" },
  steel:       { code: 112, desc: "Steel Frame (heavy)" },
  rc:          { code: 121, desc: "Reinforced Concrete" },
  urm:         { code: 132, desc: "Unreinforced Masonry" },
  mixed:       { code: 151, desc: "Mixed Construction" },
  unknown:     { code: 199, desc: "Unknown" },
};

// RMS GeoMatchLevel — L0=country up to L7=rooftop. We use the canonical
// 5-tier model from cera_exposure_core and map.
export const RMS_GEO = {
  rooftop:  { code: "L6", desc: "Street / rooftop" },
  postcode: { code: "L4", desc: "Postcode (full)" },
  city:     { code: "L2", desc: "City" },
  admin:    { code: "L1", desc: "Admin1 / state" },
  country:  { code: "L0", desc: "Country (no geocode)" },
};
