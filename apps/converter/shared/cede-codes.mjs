// Verisk CEDE / AIR code dictionaries — illustrative.

export const AIR_OCC = {
  office:    { code: 342, desc: "Office" },
  warehouse: { code: 355, desc: "Warehouse / Storage" },
  light_mfg: { code: 352, desc: "Manufacturing — Light" },
  heavy_mfg: { code: 353, desc: "Manufacturing — Heavy" },
  food_proc: { code: 354, desc: "Food and Drug Processing" },
  utility:   { code: 356, desc: "Utilities / Power" },
  civic:     { code: 381, desc: "Government / Civic" },
  vacant:    { code: 399, desc: "Unknown / Unclassified" },
};

export const AIR_CONSTR = {
  wood:        { code: 101, desc: "Wood Frame" },
  light_metal: { code: 102, desc: "Light Metal / Steel" },
  steel:       { code: 103, desc: "Heavy Steel" },
  rc:          { code: 104, desc: "Reinforced Concrete" },
  urm:         { code: 106, desc: "Unreinforced Masonry" },
  mixed:       { code: 199, desc: "Mixed / Unknown" },
  unknown:     { code: 199, desc: "Unknown" },
};

// Verisk GeocodeLevel: 1=street/parcel, 2=postcode, 4=city/admin, 5=country.
export const AIR_GEO = {
  rooftop:  { code: 1, desc: "Street / parcel" },
  postcode: { code: 2, desc: "Postcode" },
  city:     { code: 4, desc: "City / admin" },
  admin:    { code: 4, desc: "City / admin" },
  country:  { code: 5, desc: "Country / CRESTA" },
};
