// The 5 weather perils the contingency triage checks, and the underlying
// daily-field "checks". Temperature carries two checks (heat + cold); the others
// carry one. Thresholds live in weatherAuthority — these are the field/stat defs.
import type { Aggregator, Tail, Dist } from "./climatology";

export interface PerilCheck {
  key: string;          // authority threshold key
  column: string;       // Meteostat daily field
  agg: Aggregator;      // how the event window reduces to one value/year
  tail: Tail;
  dist: Dist;
  unit: string;
  label: string;        // e.g. "Heat", "Cold"
  outdoorOnly: boolean; // suppressed for indoor events
}

export interface TriagePeril {
  id: string;
  label: string;
  icon: string;
  checks: PerilCheck[];
}

export const TRIAGE_PERILS: TriagePeril[] = [
  {
    id: "rainfall", label: "Rainfall", icon: "rainfall",
    checks: [{ key: "rain", column: "prcp", agg: "max", tail: "upper", dist: "gamma", unit: "mm", label: "Heaviest day", outdoorOnly: true }],
  },
  {
    id: "wind_speed", label: "Wind speed", icon: "windspeed",
    checks: [{ key: "windspeed", column: "wspd", agg: "max", tail: "upper", dist: "gumbel", unit: "km/h", label: "Sustained", outdoorOnly: true }],
  },
  {
    id: "wind_gust", label: "Wind gust", icon: "windgust",
    checks: [{ key: "windgust", column: "wpgt", agg: "max", tail: "upper", dist: "gumbel", unit: "km/h", label: "Peak gust", outdoorOnly: true }],
  },
  {
    id: "temperature", label: "Temperature", icon: "temperature",
    checks: [
      { key: "heat", column: "tmax", agg: "max", tail: "upper", dist: "normal", unit: "°C", label: "Heat", outdoorOnly: true },
      { key: "cold", column: "tmin", agg: "min", tail: "lower", dist: "normal", unit: "°C", label: "Cold", outdoorOnly: true },
    ],
  },
  {
    id: "snowfall", label: "Snowfall", icon: "snowfall",
    // snowfall is the one peril that can refer an INDOOR event (access / roof load),
    // so its threshold switches indoor↔outdoor — handled in the triage engine.
    checks: [{ key: "snow", column: "snow", agg: "max", tail: "upper", dist: "gamma", unit: "mm", label: "Snow depth", outdoorOnly: false }],
  },
];
