import React from "react";
import { Icon } from "./Icons.jsx";
import { MARKERS } from "./ceraData.jsx";

/** CeraMapCanvas — the satellite hazard heat-map with location markers + zoom controls. */
export function CeraMapCanvas({ onZoom }) {
  return (
    <div className="cera-map">
      <div className="cera-map__grid" />
      {MARKERS.map((m, i) => (
        <div key={i} className="cera-marker" style={{ left: m.x + "%", top: m.y + "%" }}>
          <span className="cera-marker__dot" />
          <span className="cera-marker__label">{m.label}</span>
        </div>
      ))}
      <div className="cera-mapctl">
        <button className="cera-iconbtn" title="Map settings"><Icon name="gear" size={17} /></button>
        <button className="cera-iconbtn" title="Layers"><Icon name="layers" size={17} /></button>
        <div className="cera-mapctl__zoom">
          <button onClick={() => onZoom && onZoom(1)} title="Zoom in"><Icon name="plus" size={17} /></button>
          <button onClick={() => onZoom && onZoom(-1)} title="Zoom out">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
