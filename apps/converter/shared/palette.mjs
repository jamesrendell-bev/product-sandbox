// BEV palette + ExcelJS style helpers, shared by both EDM and CEDE emitters.

export const PALETTE = {
  navy:        "FF131F3C",
  pink:        "FFFF66C4",
  pink_soft:   "FFFFF0F9",
  green_soft:  "FFEBF7EF",
  yellow_soft: "FFFFF6E0",
  grey:        "FF5A6178",
  grey_row:    "FFF5F6FA",
  border_grey: "FFE2E4EA",
  white:       "FFFFFFFF",
  ink:         "FF020619",
};

export const SOURCE_FILL = {
  SUPPLIED:  PALETTE.green_soft,
  ESTIMATED: PALETTE.pink_soft,
  PARTIAL:   PALETTE.yellow_soft,
  DERIVED:   PALETTE.grey_row,
};

export function headerStyle(fill = PALETTE.navy) {
  return {
    font: { name: "Aptos", size: 9, bold: true, color: { argb: PALETTE.white } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: fill } },
    alignment: { horizontal: "left", vertical: "middle", wrapText: true },
    border: thinBorder(),
  };
}

export function dataStyle(source = null, opts = {}) {
  const fill = source && SOURCE_FILL[source];
  return {
    font: { name: "Aptos", size: 10, bold: !!opts.bold, color: { argb: opts.color || PALETTE.ink } },
    ...(fill ? { fill: { type: "pattern", pattern: "solid", fgColor: { argb: fill } } } : {}),
    alignment: { horizontal: opts.align || "left", vertical: "top", wrapText: false },
    border: thinBorder(),
  };
}

export function moneyStyle(source = null) {
  const fill = source && SOURCE_FILL[source];
  return {
    font: { name: "Aptos", size: 10, color: { argb: PALETTE.ink } },
    numFmt: '"$"#,##0',
    ...(fill ? { fill: { type: "pattern", pattern: "solid", fgColor: { argb: fill } } } : {}),
    alignment: { horizontal: "right", vertical: "top" },
    border: thinBorder(),
  };
}

export function thinBorder() {
  const side = { style: "thin", color: { argb: PALETTE.border_grey } };
  return { top: side, left: side, right: side, bottom: side };
}

export function applyStyle(cell, style) {
  Object.assign(cell, style);
}
