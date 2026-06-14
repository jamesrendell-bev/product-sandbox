/* @ds-bundle: {"format":3,"namespace":"BirdsEyeViewDesignSystem_e42a1e","components":[{"name":"CeraAnalysisPanel","sourcePath":"ui_kits/cera/AnalysisPanel.jsx"},{"name":"CeraApp","sourcePath":"ui_kits/cera/App.jsx"},{"name":"CeraHazardLayers","sourcePath":"ui_kits/cera/HazardLayersPanel.jsx"},{"name":"Icon","sourcePath":"ui_kits/cera/Icons.jsx"},{"name":"CeraMapCanvas","sourcePath":"ui_kits/cera/MapCanvas.jsx"},{"name":"CeraNavRail","sourcePath":"ui_kits/cera/NavRail.jsx"},{"name":"CeraTopBar","sourcePath":"ui_kits/cera/TopBar.jsx"},{"name":"CERA_LOGO","sourcePath":"ui_kits/cera/ceraAssets.jsx"},{"name":"NAV","sourcePath":"ui_kits/cera/ceraData.jsx"},{"name":"RETURN_PERIODS","sourcePath":"ui_kits/cera/ceraData.jsx"},{"name":"HAZARD_LAYERS","sourcePath":"ui_kits/cera/ceraData.jsx"},{"name":"LAYER_GROUPS","sourcePath":"ui_kits/cera/ceraData.jsx"},{"name":"MARKERS","sourcePath":"ui_kits/cera/ceraData.jsx"}],"sourceHashes":{"ui_kits/cera/AnalysisPanel.jsx":"a54bf9174163","ui_kits/cera/App.jsx":"109ee536a1e0","ui_kits/cera/HazardLayersPanel.jsx":"22802c8b23f3","ui_kits/cera/Icons.jsx":"cccf1be41482","ui_kits/cera/MapCanvas.jsx":"bf4f7920d534","ui_kits/cera/NavRail.jsx":"e18c7d00c662","ui_kits/cera/TopBar.jsx":"c66394419a38","ui_kits/cera/ceraAssets.jsx":"3733816b5310","ui_kits/cera/ceraData.jsx":"66192b3662d3"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BirdsEyeViewDesignSystem_e42a1e = window.BirdsEyeViewDesignSystem_e42a1e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/cera/Icons.jsx
try { (() => {
/* Lucide-style line icons (UI) + BEV peril glyphs, inlined as path markup.
   Single source for every glyph used across the CERA kit. 1.75px stroke,
   round joins, currentColor — matches the brand's line-icon spec. */
const P = {
  // --- UI ---
  dashboard: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "7",
    height: "7",
    x: "3",
    y: "3",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    width: "7",
    height: "7",
    x: "14",
    y: "3",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    width: "7",
    height: "7",
    x: "14",
    y: "14",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    width: "7",
    height: "7",
    x: "3",
    y: "14",
    rx: "1"
  })),
  analysis: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    x2: "12",
    y1: "20",
    y2: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "18",
    x2: "18",
    y1: "20",
    y2: "4"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    x2: "6",
    y1: "20",
    y2: "14"
  })),
  archive: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "8",
    x2: "21",
    y1: "6",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    x2: "21",
    y1: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    x2: "21",
    y1: "18",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3.5",
    x2: "3.51",
    y1: "6",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3.5",
    x2: "3.51",
    y1: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3.5",
    x2: "3.51",
    y1: "18",
    y2: "18"
  })),
  exposure: /*#__PURE__*/React.createElement("path", {
    d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
  }),
  hub: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 3v18"
  })),
  logout: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 17 21 12 16 7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    x2: "9",
    y1: "12",
    y2: "12"
  })),
  collapse: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m11 17-5-5 5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m18 17-5-5 5-5"
  })),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  chevron: /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  })),
  calendar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "4",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    x2: "16",
    y1: "2",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    x2: "8",
    y1: "2",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    x2: "21",
    y1: "10",
    y2: "10"
  })),
  clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 7 12 12 15 14"
  })),
  eye: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  percent: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "19",
    x2: "5",
    y1: "5",
    y2: "19"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6.5",
    cy: "6.5",
    r: "2.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17.5",
    cy: "17.5",
    r: "2.5"
  })),
  user: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  })),
  briefcase: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "20",
    height: "14",
    x: "2",
    y: "7",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
  })),
  tag: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "7.5",
    r: "1"
  })),
  pin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  triangle: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 17h.01"
  })),
  gear: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  layers: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m22 12.5-9.17 4.16a2 2 0 0 1-1.66 0L2 12.5"
  })),
  // --- Perils (BEV set) ---
  earthquake: /*#__PURE__*/React.createElement("path", {
    d: "M2 12h4l2-6 3 12 2-9 2 5h7"
  }),
  cyclone: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 4c5.5.5 5.5 7 0 8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 20c-5.5-.5-5.5-7 0-8"
  })),
  tornado: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 4H3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 8H6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 12H9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 16h-6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 20H9"
  })),
  wildfire: /*#__PURE__*/React.createElement("path", {
    d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
  }),
  flood: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
  })),
  rainfall: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 16v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 18v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 16v4"
  })),
  snowfall: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 16h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 20h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 18h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 22h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 16h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 20h.01"
  })),
  windspeed: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 8h12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12h17"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 16h9"
  })),
  windgust: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12.8 19.6A2 2 0 1 0 14 16H2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17.5 8a2.5 2.5 0 1 1 2 4H2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9.8 4.4A2 2 0 1 1 11 8H2"
  })),
  temperature: /*#__PURE__*/React.createElement("path", {
    d: "M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"
  }),
  lightning: /*#__PURE__*/React.createElement("polygon", {
    points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2"
  })
};

/** Icon — renders any glyph from the CERA set at `size` px, stroke = currentColor. */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  style,
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style,
    className: className,
    "aria-hidden": "true"
  }, P[name] || null);
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/TopBar.jsx
try { (() => {
/** CeraTopBar — breadcrumb + location search across the top of the map. */
function CeraTopBar({
  query,
  onQuery,
  onSearch,
  mode
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "cera-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-crumbs"
  }, /*#__PURE__*/React.createElement("b", null, "Hazard Analysis"), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), /*#__PURE__*/React.createElement("span", null, "Live"), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), /*#__PURE__*/React.createElement("span", null, mode)), /*#__PURE__*/React.createElement("div", {
    className: "cera-search"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-search__box"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--cera-txt-faint)",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16
  })), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => onQuery(e.target.value),
    onKeyDown: e => e.key === "Enter" && onSearch(),
    placeholder: "Search location, coordinates or risk ID"
  })), /*#__PURE__*/React.createElement("button", {
    className: "cera-btn",
    onClick: onSearch
  }, "Search")));
}
Object.assign(__ds_scope, { CeraTopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/ceraAssets.jsx
try { (() => {
/* Self-contained brand imagery for the CERA kit.
   The BEV bird mark + wordmark, embedded as a data URI so the kit renders
   without a live asset server (preview, DS card, Claude Code handoff).
   Source: assets/logos/bev-logo-dark.jpg. The hazard map backdrop is drawn
   with CSS gradients in cera.css (.cera-map) — see README. */
const CERA_LOGO = "data:image/jpeg;base64,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";
Object.assign(__ds_scope, { CERA_LOGO });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/ceraAssets.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/ceraData.jsx
try { (() => {
/* Static seed data for the CERA® kit — nav, return-period perils,
   hazard-layer taxonomy. Mirrors the layer list read from the product. */

const NAV = [{
  id: "dashboard",
  label: "Dashboard",
  icon: "dashboard"
}, {
  id: "analysis",
  label: "Hazard Analysis",
  icon: "analysis"
}, {
  id: "archive",
  label: "Results Archive",
  icon: "archive"
}, {
  id: "exposure",
  label: "Exposure Management",
  icon: "exposure"
}, {
  id: "hub",
  label: "Information Hub",
  icon: "hub"
}];

// Annual Return Period sliders (value = 1-in-N years)
const RETURN_PERIODS = [{
  id: "flood",
  label: "River Flood",
  icon: "flood",
  value: 500,
  max: 1000
}, {
  id: "eq",
  label: "Earthquake",
  icon: "earthquake",
  value: 250,
  max: 1000
}, {
  id: "tc",
  label: "Tropical Cyclone",
  icon: "cyclone",
  value: 500,
  max: 1000
}, {
  id: "wf",
  label: "Wildfire",
  icon: "wildfire",
  value: 100,
  max: 1000
}];

// Right-hand Hazard Layers list
const HAZARD_LAYERS = [{
  id: "eq",
  name: "Earthquake",
  icon: "earthquake"
}, {
  id: "gust",
  name: "Max Wind Gust",
  icon: "windgust"
}, {
  id: "tc",
  name: "Tropical Cyclone",
  icon: "cyclone"
}, {
  id: "tornado",
  name: "US Tornado",
  icon: "tornado"
}, {
  id: "rain",
  name: "Rainfall",
  icon: "rainfall"
}, {
  id: "temp",
  name: "Max Temperature",
  icon: "temperature"
}, {
  id: "light",
  name: "Lightning",
  icon: "lightning"
}, {
  id: "wind",
  name: "Max Wind Speed",
  icon: "windspeed"
}, {
  id: "snow",
  name: "Snowfall",
  icon: "snowfall"
}, {
  id: "wildfire",
  name: "Wildfire",
  icon: "wildfire",
  badge: "LIVE"
}, {
  id: "rflood",
  name: "River Flood",
  icon: "flood"
}, {
  id: "floods",
  name: "Floods",
  icon: "flood"
}, {
  id: "bushfire",
  name: "Australian Bushfire",
  icon: "wildfire",
  on: true
}];
const LAYER_GROUPS = [{
  id: "live",
  label: "Live Layers"
}, {
  id: "live2",
  label: "Live Events"
}, {
  id: "hist",
  label: "Historical Events"
}];

// Map markers (percent positions over the canvas)
const MARKERS = [{
  x: 64,
  y: 40,
  label: "Greater Blue Mountains"
}, {
  x: 30,
  y: 58,
  label: "Wollemi National Park"
}, {
  x: 72,
  y: 70,
  label: "Sydney Basin"
}];
Object.assign(__ds_scope, { NAV, RETURN_PERIODS, HAZARD_LAYERS, LAYER_GROUPS, MARKERS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/ceraData.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/AnalysisPanel.jsx
try { (() => {
const {
  useState,
  useRef
} = React;
function Slider({
  row,
  onChange
}) {
  const ref = useRef(null);
  const pct = Math.round(row.value / row.max * 100);
  const setFromEvent = clientX => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onChange(Math.max(10, Math.round(t * row.max / 10) * 10));
  };
  const onDown = e => {
    setFromEvent(e.clientX);
    const move = ev => setFromEvent(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "cera-rp__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-rp__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: row.icon,
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-rp__track",
    ref: ref,
    onPointerDown: onDown,
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-rp__fill",
    style: {
      width: pct + "%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "cera-rp__knob",
    style: {
      left: pct + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "cera-rp__val"
  }, row.value));
}

/** CeraAnalysisPanel — mode tabs + return-period controls + Create New Risk form. */
function CeraAnalysisPanel({
  location,
  onSave,
  tab,
  onTab,
  mode,
  onMode
}) {
  const [rows, setRows] = useState(__ds_scope.RETURN_PERIODS);
  const [risk, setRisk] = useState("");
  const update = (id, value) => setRows(rs => rs.map(r => r.id === id ? {
    ...r,
    value
  } : r));
  const tabs = ["Live", "In-Depth", "Multi-Entry"];
  const modes = ["Global Relative Mode", "Future Period Mode"];
  return /*#__PURE__*/React.createElement("section", {
    className: "cera-panel cera-analysis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-ptabs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-tabs"
  }, tabs.map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "cera-tab" + (tab === t ? " cera-tab--active" : ""),
    onClick: () => onTab(t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "cera-subtabs"
  }, modes.map(m => /*#__PURE__*/React.createElement("div", {
    key: m,
    className: "cera-subtab" + (mode === m ? " cera-subtab--active" : ""),
    onClick: () => onMode(m)
  }, m)))), /*#__PURE__*/React.createElement("div", {
    className: "cera-loc"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--cera-teal-2)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "pin",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "cera-loc__name"
  }, location.name), /*#__PURE__*/React.createElement("div", {
    className: "cera-loc__sub"
  }, location.coords))), /*#__PURE__*/React.createElement("div", {
    className: "cera-panel__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-section"
  }, /*#__PURE__*/React.createElement("p", {
    className: "cera-section__label"
  }, "Annual Return Period"), /*#__PURE__*/React.createElement("div", {
    className: "cera-rp"
  }, rows.map(r => /*#__PURE__*/React.createElement(Slider, {
    key: r.id,
    row: r,
    onChange: v => update(r.id, v)
  }))), /*#__PURE__*/React.createElement("button", {
    className: "cera-btn cera-btn--ghost cera-btn--block",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 15
  }), " Add Hazard")), /*#__PURE__*/React.createElement("div", {
    className: "cera-section",
    style: {
      borderBottom: "none"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "cera-section__label"
  }, "Create New Risk"), /*#__PURE__*/React.createElement("div", {
    className: "cera-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "tag",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    value: risk,
    onChange: e => setRisk(e.target.value),
    placeholder: "Enter risk name"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-fieldgrid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-field cera-field--row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "calendar",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Start date"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-field cera-field--row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "calendar",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "End date"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "cera-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__prefix"
  }, "GBP"), /*#__PURE__*/React.createElement("input", {
    placeholder: "Enter TIV",
    defaultValue: ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-fieldgrid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-field cera-field--row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "percent",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Line size"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-field cera-field--row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "user",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Broker"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "cera-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "briefcase",
    size: 15
  })), /*#__PURE__*/React.createElement("select", {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Select line of business"), /*#__PURE__*/React.createElement("option", null, "Property \u2014 Commercial"), /*#__PURE__*/React.createElement("option", null, "Property \u2014 Binder"), /*#__PURE__*/React.createElement("option", null, "Marine & Energy"), /*#__PURE__*/React.createElement("option", null, "Agriculture"))), /*#__PURE__*/React.createElement("button", {
    className: "cera-btn cera-btn--block",
    style: {
      marginTop: 6
    },
    onClick: () => onSave(risk)
  }, "Save Results"))));
}
Object.assign(__ds_scope, { CeraAnalysisPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/AnalysisPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/HazardLayersPanel.jsx
try { (() => {
const {
  useState
} = React;
/** CeraHazardLayers — right-hand peril layer list with toggles + collapsible groups. */
function CeraHazardLayers() {
  const [on, setOn] = useState(() => {
    const m = {};
    __ds_scope.HAZARD_LAYERS.forEach(l => m[l.id] = !!l.on);
    return m;
  });
  const [open, setOpen] = useState({
    live: false,
    live2: false,
    hist: false
  });
  const toggle = id => setOn(s => ({
    ...s,
    [id]: !s[id]
  }));
  return /*#__PURE__*/React.createElement("section", {
    className: "cera-panel cera-layers"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-panel__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-panel__title"
  }, "Hazard Layers"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--cera-txt-dim)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron",
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    className: "cera-panel__body"
  }, __ds_scope.HAZARD_LAYERS.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.id,
    className: "cera-layer" + (on[l.id] ? " cera-layer--on" : ""),
    onClick: () => toggle(l.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-layer__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: l.icon,
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    className: "cera-layer__name"
  }, l.name), l.badge && /*#__PURE__*/React.createElement("span", {
    className: "cera-layer__badge"
  }, l.badge), /*#__PURE__*/React.createElement("span", {
    className: "cera-layer__eye"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "eye",
    size: 15
  })))), __ds_scope.LAYER_GROUPS.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    className: "cera-grouphead" + (open[g.id] ? " cera-grouphead--open" : ""),
    onClick: () => setOpen(s => ({
      ...s,
      [g.id]: !s[g.id]
    }))
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-grouphead__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "triangle",
    size: 15
  })), /*#__PURE__*/React.createElement("span", null, g.label), /*#__PURE__*/React.createElement("span", {
    className: "cera-grouphead__chev"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron",
    size: 15
  }))))));
}
Object.assign(__ds_scope, { CeraHazardLayers });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/HazardLayersPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/MapCanvas.jsx
try { (() => {
/** CeraMapCanvas — the satellite hazard heat-map with location markers + zoom controls. */
function CeraMapCanvas({
  onZoom
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "cera-map"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-map__grid"
  }), __ds_scope.MARKERS.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "cera-marker",
    style: {
      left: m.x + "%",
      top: m.y + "%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-marker__dot"
  }), /*#__PURE__*/React.createElement("span", {
    className: "cera-marker__label"
  }, m.label))), /*#__PURE__*/React.createElement("div", {
    className: "cera-mapctl"
  }, /*#__PURE__*/React.createElement("button", {
    className: "cera-iconbtn",
    title: "Map settings"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "gear",
    size: 17
  })), /*#__PURE__*/React.createElement("button", {
    className: "cera-iconbtn",
    title: "Layers"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "layers",
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-mapctl__zoom"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onZoom && onZoom(1),
    title: "Zoom in"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 17
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => onZoom && onZoom(-1),
    title: "Zoom out"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }))))));
}
Object.assign(__ds_scope, { CeraMapCanvas });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/MapCanvas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/NavRail.jsx
try { (() => {
/** CeraNavRail — left icon+label navigation rail with BEV brand + CERA wordmark. */
function CeraNavRail({
  active,
  onSelect,
  onLogout
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "cera-nav"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-nav__brand"
  }, /*#__PURE__*/React.createElement("img", {
    className: "cera-nav__logo",
    src: __ds_scope.CERA_LOGO,
    alt: "BirdsEyeView"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cera-nav__product"
  }, "CERA\xAE")), /*#__PURE__*/React.createElement("div", {
    className: "cera-nav__items"
  }, __ds_scope.NAV.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "cera-navitem" + (active === item.id ? " cera-navitem--active" : ""),
    onClick: () => onSelect && onSelect(item.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-navitem__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: item.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("span", null, item.label)))), /*#__PURE__*/React.createElement("div", {
    className: "cera-nav__spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cera-nav__foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cera-navitem"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-navitem__ic",
    style: {
      color: "var(--cera-teal-2)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "collapse",
    size: 18
  })), /*#__PURE__*/React.createElement("span", null, "Collapse Sidebar")), /*#__PURE__*/React.createElement("div", {
    className: "cera-navitem cera-navitem--logout",
    onClick: onLogout
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-navitem__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "logout",
    size: 18
  })), /*#__PURE__*/React.createElement("span", null, "Logout"))));
}
Object.assign(__ds_scope, { CeraNavRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/NavRail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cera/App.jsx
try { (() => {
const {
  useState,
  useEffect
} = React;
function Login({
  onSignIn
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "cera-root",
    style: {
      display: "grid",
      placeItems: "center",
      background: "radial-gradient(120% 100% at 50% 0%, #0c2d52 0%, #04102a 55%, #000615 100%)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 360,
      padding: 34,
      background: "rgba(7,22,46,0.7)",
      border: "1px solid var(--cera-line)",
      borderRadius: 14,
      backdropFilter: "blur(10px)",
      boxShadow: "0 30px 70px rgba(0,0,0,0.5)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: __ds_scope.CERA_LOGO,
    alt: "BirdsEyeView",
    style: {
      width: 170,
      display: "block",
      margin: "0 auto 4px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 11,
      letterSpacing: "0.24em",
      color: "var(--cera-txt-dim)",
      textTransform: "uppercase",
      marginBottom: 26
    }
  }, "CERA\xAE \xB7 Sign in"), /*#__PURE__*/React.createElement("div", {
    className: "cera-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "user",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Work email",
    defaultValue: "j.underwriter@kaufman.com"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cera-field",
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-field__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "tag",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    type: "password",
    placeholder: "Password",
    defaultValue: "password"
  })), /*#__PURE__*/React.createElement("button", {
    className: "cera-btn cera-btn--block",
    onClick: onSignIn
  }, "Sign in"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 16,
      fontSize: 11,
      color: "var(--cera-txt-faint)"
    }
  }, "Developed in partnership with ESA")));
}

/** CeraApp — full interactive CERA® platform demo (login → hazard analysis). */
function CeraApp() {
  const [authed, setAuthed] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Live");
  const [mode, setMode] = useState("Future Period Mode");
  const [location, setLocation] = useState({
    name: "Greater Blue Mountains, AU",
    coords: "33.71° S, 150.31° E"
  });
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!authed) return /*#__PURE__*/React.createElement(Login, {
    onSignIn: () => setAuthed(true)
  });
  const onSearch = () => {
    if (query.trim()) setLocation({
      name: query.trim(),
      coords: "—"
    });
    setToast({
      text: "Running hazard analysis…"
    });
  };
  const onSave = risk => setToast({
    text: risk ? `Saved "${risk}" to Results Archive` : "Results saved to archive"
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "cera-root"
  }, /*#__PURE__*/React.createElement(__ds_scope.CeraMapCanvas, {
    onZoom: () => {}
  }), /*#__PURE__*/React.createElement(__ds_scope.CeraNavRail, {
    active: "analysis",
    onSelect: () => {},
    onLogout: () => setAuthed(false)
  }), /*#__PURE__*/React.createElement(__ds_scope.CeraTopBar, {
    query: query,
    onQuery: setQuery,
    onSearch: onSearch,
    mode: mode
  }), /*#__PURE__*/React.createElement(__ds_scope.CeraAnalysisPanel, {
    location: location,
    onSave: onSave,
    tab: tab,
    onTab: setTab,
    mode: mode,
    onMode: setMode
  }), /*#__PURE__*/React.createElement(__ds_scope.CeraHazardLayers, null), toast && /*#__PURE__*/React.createElement("div", {
    className: "cera-toast"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cera-toast__dot"
  }), toast.text));
}
Object.assign(__ds_scope, { CeraApp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cera/App.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CeraAnalysisPanel = __ds_scope.CeraAnalysisPanel;

__ds_ns.CeraApp = __ds_scope.CeraApp;

__ds_ns.CeraHazardLayers = __ds_scope.CeraHazardLayers;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.CeraMapCanvas = __ds_scope.CeraMapCanvas;

__ds_ns.CeraNavRail = __ds_scope.CeraNavRail;

__ds_ns.CeraTopBar = __ds_scope.CeraTopBar;

__ds_ns.CERA_LOGO = __ds_scope.CERA_LOGO;

__ds_ns.NAV = __ds_scope.NAV;

__ds_ns.RETURN_PERIODS = __ds_scope.RETURN_PERIODS;

__ds_ns.HAZARD_LAYERS = __ds_scope.HAZARD_LAYERS;

__ds_ns.LAYER_GROUPS = __ds_scope.LAYER_GROUPS;

__ds_ns.MARKERS = __ds_scope.MARKERS;

})();
