import type { MarketId } from "../domain/marketProfiles";
import type { Occupancy } from "../domain/inputModel";

export interface SampleLocation {
  market: MarketId;
  label: string;
  address: string;
  lat: number;
  lng: number;
  occupancy: Occupancy;
  tiv: number;
}

// Pre-geocoded sample single locations across both markets.
export const SAMPLE_LOCATIONS: SampleLocation[] = [
  { market: "US", label: "Miami, FL · coastal commercial", address: "Brickell Ave, Miami, FL", lat: 25.7617, lng: -80.1918, occupancy: "commercial", tiv: 12_000_000 },
  { market: "US", label: "Houston, TX · industrial", address: "Ship Channel, Houston, TX", lat: 29.7604, lng: -95.3698, occupancy: "industrial", tiv: 35_000_000 },
  { market: "US", label: "Sacramento, CA · quake/flood", address: "Capitol Mall, Sacramento, CA", lat: 38.5816, lng: -121.4944, occupancy: "commercial", tiv: 8_000_000 },
  { market: "US", label: "Oklahoma City, OK · tornado", address: "Downtown, Oklahoma City, OK", lat: 35.4676, lng: -97.5164, occupancy: "commercial", tiv: 6_000_000 },
  { market: "AU", label: "Brisbane, QLD · flood/cyclone", address: "Eagle St, Brisbane, QLD", lat: -27.4698, lng: 153.0251, occupancy: "commercial", tiv: 9_000_000 },
  { market: "AU", label: "Cairns, QLD · cyclone", address: "Esplanade, Cairns, QLD", lat: -16.9203, lng: 145.771, occupancy: "commercial", tiv: 5_500_000 },
  { market: "AU", label: "Sydney, NSW · bushfire fringe", address: "Hornsby, Sydney, NSW", lat: -33.7019, lng: 151.0996, occupancy: "residential", tiv: 3_200_000 },
];
