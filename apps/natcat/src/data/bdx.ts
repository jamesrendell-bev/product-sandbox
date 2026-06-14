import * as XLSX from "xlsx";

/** Parse a BDX workbook → array of header-keyed rows. Prefers the AI_Output
 *  sheet (carries geocoded lat/long + cleaned fields). */
export function parseWorkbook(buf: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("ai_output")) ??
    wb.SheetNames.find((n) => n.toLowerCase().includes("output")) ??
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

export async function parseBDXFile(file: File): Promise<Record<string, unknown>[]> {
  return parseWorkbook(await file.arrayBuffer());
}

export async function loadSampleBDX(): Promise<Record<string, unknown>[]> {
  const res = await fetch("/sample-bdx.xlsx");
  if (!res.ok) throw new Error("Sample BDX not found");
  return parseWorkbook(await res.arrayBuffer());
}
