// Editable underwriting authority for the weather triage: the cancellation
// threshold per peril check, plus the referral/decline probability bands.
// Defaults are researched (see README / threshold notes).

export interface WeatherAuthority {
  thresholds: {
    rain: number;        // mm, heaviest day in window
    windspeed: number;   // km/h, sustained (daily avg)
    windgust: number;    // km/h, peak gust
    heat: number;        // °C, max temperature
    cold: number;        // °C, min temperature (breach when BELOW)
    snow_outdoor: number; // mm snow depth — outdoor events
    snow_indoor: number;  // mm snow depth — indoor events (access / roof load)
  };
  referralProbability: number; // P(breach) at/above which a peril → Refer
  declineProbability: number;  // P(breach) at/above which a peril → Decline
  lookbackYears: number;
}

export const DEFAULT_WEATHER_AUTHORITY: WeatherAuthority = {
  thresholds: {
    rain: 25,
    windspeed: 40,
    windgust: 60,
    heat: 32,
    cold: -5,
    snow_outdoor: 30,
    snow_indoor: 150,
  },
  referralProbability: 0.2,
  declineProbability: 0.5,
  lookbackYears: 15,
};

// Notes shown in the Authority UI to justify each default.
export const THRESHOLD_NOTES: Record<string, string> = {
  rain: "Heavy rain → waterlogged ground / abandonment. Rain-insurance triggers sit 10–25 mm.",
  windspeed: "Industry 'wind hold' for stages and tents begins ~25 mph (40 km/h) sustained.",
  windgust: "Evacuation / temporary-structure failure gust range 35–50 mph (≈56–80 km/h).",
  heat: "WBGT 28 °C delays sport, 32–33 °C cancels; ~32 °C air temp is the danger band.",
  cold: "Frost / extreme cold — comfort & safety (secondary driver).",
  snow_outdoor: "Even light snow disrupts footing and access for outdoor events.",
  snow_indoor: "Heavy snow can refer an indoor event via transport, access and roof load.",
};

const KEY = "bev.contingency.weatherAuthority.v1";

export function loadWeatherAuthority(): WeatherAuthority {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_WEATHER_AUTHORITY);
    const parsed = JSON.parse(raw) as WeatherAuthority;
    // shallow-merge to tolerate older shapes
    return {
      ...structuredClone(DEFAULT_WEATHER_AUTHORITY),
      ...parsed,
      thresholds: { ...DEFAULT_WEATHER_AUTHORITY.thresholds, ...(parsed.thresholds ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_WEATHER_AUTHORITY);
  }
}
export function saveWeatherAuthority(a: WeatherAuthority) {
  localStorage.setItem(KEY, JSON.stringify(a));
}
export function resetWeatherAuthority(): WeatherAuthority {
  localStorage.removeItem(KEY);
  return structuredClone(DEFAULT_WEATHER_AUTHORITY);
}
