// Helpers shared by both EDM and CEDE exporters.

import { PALETTE, headerStyle, dataStyle, moneyStyle, applyStyle } from "./palette.mjs";

export function writeReadMe(ws, title, subtitle, rows) {
  ws.views = [{ showGridLines: false }];
  const t = ws.getCell("B2"); t.value = title;
  t.font = { name: "Aptos", size: 18, bold: true, color: { argb: PALETTE.ink } };
  const s = ws.getCell("B3"); s.value = subtitle;
  s.font = { name: "Aptos", size: 11, color: { argb: PALETTE.navy } };
  const g = ws.getCell("B4"); g.value = `Generated ${new Date().toISOString().slice(0, 10)} by CERA® AI — EDM & CEDE Converter`;
  g.font = { name: "Aptos", size: 10, color: { argb: PALETTE.grey } };
  const div = ws.getCell("B5");
  div.border = { bottom: { style: "thick", color: { argb: PALETTE.pink } } };

  rows.forEach(([k, v], i) => {
    const r = 7 + i;
    const kc = ws.getCell(`B${r}`); kc.value = k;
    kc.font = { name: "Aptos", size: 10, bold: true, color: { argb: PALETTE.navy } };
    const vc = ws.getCell(`C${r}`); vc.value = v;
    vc.font = { name: "Aptos", size: 10, color: { argb: PALETTE.ink } };
    vc.alignment = { wrapText: true, vertical: "top" };
    ws.getRow(r).height = 32;
  });
  ws.getColumn("A").width = 2;
  ws.getColumn("B").width = 36;
  ws.getColumn("C").width = 90;
}

export function writeSheet(ws, headers, dataRows, opts = {}) {
  ws.views = [{ showGridLines: false, state: "frozen", ySplit: 1, xSplit: opts.xSplit || 0 }];

  headers.forEach((h, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value = h.label;
    applyStyle(cell, headerStyle(h.headerFill || PALETTE.navy));
  });

  dataRows.forEach((row, ri) => {
    headers.forEach((h, ci) => {
      const cell = ws.getCell(ri + 2, ci + 1);
      const val = row[h.key];
      cell.value = val == null ? "" : val;
      const source = h.sourceKey ? row.__sources?.[h.sourceKey] : (h.sourceLiteral || null);
      if (h.kind === "money") applyStyle(cell, moneyStyle(source));
      else if (h.kind === "sourceFlag") {
        applyStyle(cell, dataStyle(val in { SUPPLIED:1, ESTIMATED:1, PARTIAL:1, DERIVED:1 } ? val : null, { bold: true }));
        if (val === "SUPPLIED") cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF1A5C3A" } };
        else if (val === "ESTIMATED") cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: PALETTE.pink } };
        else if (val === "PARTIAL") cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFB8860B" } };
      } else applyStyle(cell, dataStyle(source));
    });
  });

  headers.forEach((h, i) => {
    if (h.width) ws.getColumn(i + 1).width = h.width;
  });
}

export function writeDataQuality(ws, locations) {
  ws.views = [{ showGridLines: false }];
  const t = ws.getCell("B2"); t.value = "Data quality coverage";
  t.font = { name: "Aptos", size: 16, bold: true, color: { argb: PALETTE.ink } };
  const s = ws.getCell("B3"); s.value = `${locations.length} location rows processed`;
  s.font = { name: "Aptos", size: 10, color: { argb: PALETTE.grey } };

  const fields = ["address","latlng","occupancy","construction","year_built",
                  "stories","sprinklered","tiv","other_modifiers","perils"];
  const tallies = {};
  for (const f of fields) tallies[f] = { SUPPLIED:0, ESTIMATED:0, PARTIAL:0, DERIVED:0 };
  for (const loc of locations) {
    for (const f of fields) {
      const v = loc.sources?.[f];
      if (v && tallies[f][v] != null) tallies[f][v]++;
    }
  }
  const headers = ["Field", "SUPPLIED", "ESTIMATED", "PARTIAL", "DERIVED", "% Supplied"];
  headers.forEach((h, i) => {
    const cell = ws.getCell(5, i + 2);
    cell.value = h;
    applyStyle(cell, headerStyle());
  });
  fields.forEach((f, i) => {
    const r = 6 + i;
    const t = tallies[f];
    const total = locations.length || 1;
    const pctSup = (t.SUPPLIED + t.PARTIAL) / total * 100;
    const vals = [
      f.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      t.SUPPLIED, t.ESTIMATED, t.PARTIAL, t.DERIVED, `${pctSup.toFixed(0)}%`,
    ];
    vals.forEach((v, j) => {
      const cell = ws.getCell(r, j + 2);
      cell.value = v;
      applyStyle(cell, dataStyle());
      if (j > 0) cell.alignment = { horizontal: "right", vertical: "center" };
    });
  });
  ws.getColumn("A").width = 2;
  ws.getColumn("B").width = 26;
  for (let c = 3; c <= 7; c++) ws.getColumn(c).width = 14;
}
