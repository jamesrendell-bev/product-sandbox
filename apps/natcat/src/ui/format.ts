export function pct(x: number, dp = 2): string {
  if (!isFinite(x)) return "—";
  return `${(x * 100).toFixed(dp)}%`;
}
export function rpFmt(p: number): string {
  if (p <= 0) return ">1-in-10,000";
  const rp = 1 / p;
  if (rp > 10000) return ">1-in-10,000";
  if (rp < 1.05) return "annual";
  return `1-in-${Math.round(rp)}`;
}
export function money(symbol: string, n: number): string {
  if (!isFinite(n)) return "—";
  const s = symbol;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${s}${(n / 1e9).toFixed(2)}bn`;
  if (abs >= 1e6) return `${s}${(n / 1e6).toFixed(2)}m`;
  if (abs >= 1e3) return `${s}${(n / 1e3).toFixed(0)}k`;
  return `${s}${Math.round(n).toLocaleString("en-US")}`;
}
