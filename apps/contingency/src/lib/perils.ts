// Peril metadata shared across triage (CERA cat perils) and weather lookback.

export interface CatPeril { id: string; label: string; icon: string }
export const CAT_PERILS: CatPeril[] = [
  { id: "TropicalCyclone", label: "Tropical cyclone", icon: "tropical-cyclone" },
  { id: "FloodLivePlus", label: "Flood", icon: "flood" },
  { id: "Wildfire", label: "Wildfire", icon: "wildfire" },
  { id: "Earthquake", label: "Earthquake", icon: "earthquake" },
  { id: "USTornado", label: "US tornado", icon: "us-tornado" },
];
export const catIcon = (perilId: string) =>
  CAT_PERILS.find((p) => p.id === perilId)?.icon ?? "flood";

// Weather perils (Meteostat daily). tail = which side of the threshold is a breach.
export interface WeatherPeril {
  id: string; label: string; column: string; unit: string;
  tail: "upper" | "lower"; icon: string; defaultThreshold: number;
}
export const WEATHER_PERILS: WeatherPeril[] = [
  { id: "rainfall", label: "Rainfall", column: "prcp", unit: "mm", tail: "upper", icon: "rainfall", defaultThreshold: 20 },
  { id: "wspd", label: "Max wind speed", column: "wspd", unit: "km/h", tail: "upper", icon: "windspeed", defaultThreshold: 40 },
  { id: "wpgt", label: "Max wind gust", column: "wpgt", unit: "km/h", tail: "upper", icon: "windgust", defaultThreshold: 60 },
  { id: "tmax", label: "Max temperature", column: "tmax", unit: "°C", tail: "upper", icon: "temperature", defaultThreshold: 30 },
  { id: "tmin", label: "Min temperature", column: "tmin", unit: "°C", tail: "lower", icon: "temperature", defaultThreshold: 0 },
];
