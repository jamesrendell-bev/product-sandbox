/* Static seed data for the CERA® kit — nav, return-period perils,
   hazard-layer taxonomy. Mirrors the layer list read from the product. */

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "analysis", label: "Hazard Analysis", icon: "analysis" },
  { id: "archive", label: "Results Archive", icon: "archive" },
  { id: "exposure", label: "Exposure Management", icon: "exposure" },
  { id: "hub", label: "Information Hub", icon: "hub" },
];

// Annual Return Period sliders (value = 1-in-N years)
export const RETURN_PERIODS = [
  { id: "flood", label: "River Flood", icon: "flood", value: 500, max: 1000 },
  { id: "eq", label: "Earthquake", icon: "earthquake", value: 250, max: 1000 },
  { id: "tc", label: "Tropical Cyclone", icon: "cyclone", value: 500, max: 1000 },
  { id: "wf", label: "Wildfire", icon: "wildfire", value: 100, max: 1000 },
];

// Right-hand Hazard Layers list
export const HAZARD_LAYERS = [
  { id: "eq", name: "Earthquake", icon: "earthquake" },
  { id: "gust", name: "Max Wind Gust", icon: "windgust" },
  { id: "tc", name: "Tropical Cyclone", icon: "cyclone" },
  { id: "tornado", name: "US Tornado", icon: "tornado" },
  { id: "rain", name: "Rainfall", icon: "rainfall" },
  { id: "temp", name: "Max Temperature", icon: "temperature" },
  { id: "light", name: "Lightning", icon: "lightning" },
  { id: "wind", name: "Max Wind Speed", icon: "windspeed" },
  { id: "snow", name: "Snowfall", icon: "snowfall" },
  { id: "wildfire", name: "Wildfire", icon: "wildfire", badge: "LIVE" },
  { id: "rflood", name: "River Flood", icon: "flood" },
  { id: "floods", name: "Floods", icon: "flood" },
  { id: "bushfire", name: "Australian Bushfire", icon: "wildfire", on: true },
];

export const LAYER_GROUPS = [
  { id: "live", label: "Live Layers" },
  { id: "live2", label: "Live Events" },
  { id: "hist", label: "Historical Events" },
];

// Map markers (percent positions over the canvas)
export const MARKERS = [
  { x: 64, y: 40, label: "Greater Blue Mountains" },
  { x: 30, y: 58, label: "Wollemi National Park" },
  { x: 72, y: 70, label: "Sydney Basin" },
];
