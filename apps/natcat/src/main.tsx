import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./theme.css";
import "./bev.css";
import App from "./App";

// When running inside the sandbox shell (an iframe, or with ?embed=1), drop
// our own brand chrome and footer so the shell's rail is the only chrome.
if (typeof window !== "undefined" &&
    (window.self !== window.top || new URLSearchParams(window.location.search).has("embed"))) {
  document.documentElement.setAttribute("data-embed", "1");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
