import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./bev.css";

// Inside the sandbox shell (iframe or ?embed=1)? Turn our own left rail into a
// top strip and drop the duplicate brand + footer, so the shell's rail leads.
if (typeof window !== "undefined" &&
    (window.self !== window.top || new URLSearchParams(window.location.search).has("embed"))) {
  document.documentElement.setAttribute("data-embed", "1");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
