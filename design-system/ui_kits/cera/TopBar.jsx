import React from "react";
import { Icon } from "./Icons.jsx";

/** CeraTopBar — breadcrumb + location search across the top of the map. */
export function CeraTopBar({ query, onQuery, onSearch, mode }) {
  return (
    <header className="cera-top">
      <div className="cera-crumbs">
        <b>Hazard Analysis</b>
        <span className="sep">/</span>
        <span>Live</span>
        <span className="sep">/</span>
        <span>{mode}</span>
      </div>
      <div className="cera-search">
        <div className="cera-search__box">
          <span style={{ color: "var(--cera-txt-faint)", display: "grid", placeItems: "center" }}><Icon name="search" size={16} /></span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search location, coordinates or risk ID"
          />
        </div>
        <button className="cera-btn" onClick={onSearch}>Search</button>
      </div>
    </header>
  );
}
