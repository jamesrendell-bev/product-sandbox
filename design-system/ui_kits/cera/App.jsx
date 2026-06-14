import React, { useState, useEffect } from "react";
import { Icon } from "./Icons.jsx";
import { CeraNavRail } from "./NavRail.jsx";
import { CeraTopBar } from "./TopBar.jsx";
import { CeraAnalysisPanel } from "./AnalysisPanel.jsx";
import { CeraHazardLayers } from "./HazardLayersPanel.jsx";
import { CeraMapCanvas } from "./MapCanvas.jsx";
import { CERA_LOGO } from "./ceraAssets.jsx";

function Login({ onSignIn }) {
  return (
    <div className="cera-root" style={{ display: "grid", placeItems: "center", background: "radial-gradient(120% 100% at 50% 0%, #0c2d52 0%, #04102a 55%, #000615 100%)" }}>
      <div style={{ width: 360, padding: 34, background: "rgba(7,22,46,0.7)", border: "1px solid var(--cera-line)", borderRadius: 14, backdropFilter: "blur(10px)", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
        <img src={CERA_LOGO} alt="BirdsEyeView" style={{ width: 170, display: "block", margin: "0 auto 4px" }} />
        <div style={{ textAlign: "center", fontSize: 11, letterSpacing: "0.24em", color: "var(--cera-txt-dim)", textTransform: "uppercase", marginBottom: 26 }}>CERA&reg; &middot; Sign in</div>
        <div className="cera-field"><span className="cera-field__ic"><Icon name="user" size={15} /></span><input placeholder="Work email" defaultValue="j.underwriter@kaufman.com" /></div>
        <div className="cera-field" style={{ marginBottom: 18 }}><span className="cera-field__ic"><Icon name="tag" size={15} /></span><input type="password" placeholder="Password" defaultValue="password" /></div>
        <button className="cera-btn cera-btn--block" onClick={onSignIn}>Sign in</button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--cera-txt-faint)" }}>Developed in partnership with ESA</div>
      </div>
    </div>
  );
}

/** CeraApp — full interactive CERA® platform demo (login → hazard analysis). */
export function CeraApp() {
  const [authed, setAuthed] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Live");
  const [mode, setMode] = useState("Future Period Mode");
  const [location, setLocation] = useState({ name: "Greater Blue Mountains, AU", coords: "33.71° S, 150.31° E" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!authed) return <Login onSignIn={() => setAuthed(true)} />;

  const onSearch = () => {
    if (query.trim()) setLocation({ name: query.trim(), coords: "—" });
    setToast({ text: "Running hazard analysis…" });
  };
  const onSave = (risk) => setToast({ text: risk ? `Saved "${risk}" to Results Archive` : "Results saved to archive" });

  return (
    <div className="cera-root">
      <CeraMapCanvas onZoom={() => {}} />
      <CeraNavRail active="analysis" onSelect={() => {}} onLogout={() => setAuthed(false)} />
      <CeraTopBar
        query={query} onQuery={setQuery} onSearch={onSearch}
        mode={mode}
      />
      <CeraAnalysisPanel location={location} onSave={onSave} tab={tab} onTab={setTab} mode={mode} onMode={setMode} />
      <CeraHazardLayers />
      {toast && (
        <div className="cera-toast"><span className="cera-toast__dot" />{toast.text}</div>
      )}
    </div>
  );
}
