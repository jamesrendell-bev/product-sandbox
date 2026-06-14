// Deterministic seasonality engine: given a venue (lat/lon) and an event date,
// flag whether the date falls inside a relevant hazard season. PoC-grade,
// transparent rules — sourced from published season definitions.

export type SeasonStatus = "in-season" | "shoulder" | "off-season";
export interface SeasonFlag {
  peril: string;        // display label
  icon: string;         // peril icon key
  season: string;       // e.g. "North Atlantic hurricane season (Jun–Nov, peak Aug–Oct)"
  status: SeasonStatus;
  note: string;
}

const inBox = (lat: number, lon: number, b: [number, number, number, number]) =>
  lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3];
// month set helpers
const m = (...months: number[]) => new Set(months);

function statusFor(month: number, peak: Set<number>, shoulder: Set<number>): SeasonStatus {
  if (peak.has(month)) return "in-season";
  if (shoulder.has(month)) return "shoulder";
  return "off-season";
}

export function seasonalFlags(lat: number, lon: number, dateISO: string): SeasonFlag[] {
  if (!dateISO) return [];
  const month = parseInt(dateISO.slice(5, 7), 10);
  if (!month) return [];
  const flags: SeasonFlag[] = [];
  const south = lat < 0;

  // ---- Tropical cyclone (basin-specific) ----
  const tc = (season: string, peak: Set<number>, shoulder: Set<number>) =>
    flags.push({ peril: "Tropical cyclone", icon: "tropical-cyclone", season, status: statusFor(month, peak, shoulder), note: "Cancellation/abandonment risk peaks with named-storm activity." });

  if (inBox(lat, lon, [0, 45, -100, -1]) || inBox(lat, lon, [7, 33, -90, -55])) {
    tc("North Atlantic hurricane season (Jun–Nov, peak Aug–Oct)", m(8, 9, 10), m(6, 7, 11));
  } else if (inBox(lat, lon, [5, 35, -120, -85])) {
    tc("East Pacific hurricane season (May–Nov, peak Jul–Sep)", m(7, 8, 9), m(5, 6, 10, 11));
  } else if (inBox(lat, lon, [0, 45, 100, 180])) {
    tc("NW Pacific typhoon season (year-round, peak Jul–Oct)", m(7, 8, 9, 10), m(5, 6, 11));
  } else if (inBox(lat, lon, [0, 30, 50, 100])) {
    tc("North Indian cyclone season (Apr–Jun & Oct–Dec)", m(5, 10, 11), m(4, 6, 12));
  } else if (inBox(lat, lon, [-40, 0, 30, 220])) {
    tc("Southern Hemisphere cyclone season (Nov–Apr, peak Jan–Mar)", m(1, 2, 3), m(11, 12, 4));
  }

  // ---- Wildfire ----
  if (inBox(lat, lon, [32, 42, -125, -114]) || inBox(lat, lon, [36, 45, -10, 30])) {
    flags.push({ peril: "Wildfire", icon: "wildfire", season: "Northern fire season (Jun–Oct, peak Jul–Sep)", status: statusFor(month, m(7, 8, 9), m(6, 10)), note: "Smoke, air-quality and evacuation drive event cancellation." });
  } else if (inBox(lat, lon, [-44, -28, 138, 154])) {
    flags.push({ peril: "Wildfire", icon: "wildfire", season: "SE Australia bushfire season (Dec–Mar)", status: statusFor(month, m(12, 1, 2), m(11, 3)), note: "Smoke, air-quality and evacuation drive event cancellation." });
  }

  // ---- US tornado / severe convective ----
  if (inBox(lat, lon, [28, 49, -105, -80])) {
    flags.push({ peril: "Severe convective / tornado", icon: "us-tornado", season: "US tornado season (Mar–Jun, peak Apr–May)", status: statusFor(month, m(4, 5), m(3, 6)), note: "Severe storms and tornado warnings can force outdoor-event stoppage." });
  }

  // ---- Monsoon / flood ----
  if (inBox(lat, lon, [5, 35, 60, 100])) {
    flags.push({ peril: "Flood", icon: "flood", season: "South Asia monsoon (Jun–Sep)", status: statusFor(month, m(7, 8), m(6, 9)), note: "Monsoon flooding raises venue-access and abandonment risk." });
  } else if (inBox(lat, lon, [-12, 25, 95, 145])) {
    flags.push({ peril: "Flood", icon: "flood", season: "SE Asia wet season (May–Oct)", status: statusFor(month, m(7, 8, 9), m(5, 6, 10)), note: "Heavy rain raises venue-access and abandonment risk." });
  }

  // ---- Winter weather (high latitudes) ----
  if (Math.abs(lat) >= 40) {
    const peak = south ? m(6, 7, 8) : m(12, 1, 2);
    const shoulder = south ? m(5, 9) : m(11, 3);
    flags.push({ peril: "Winter weather", icon: "snowfall", season: south ? "Austral winter (Jun–Aug)" : "Boreal winter (Dec–Feb)", status: statusFor(month, peak, shoulder), note: "Snow/ice and travel disruption can curtail events." });
  }

  return flags;
}
