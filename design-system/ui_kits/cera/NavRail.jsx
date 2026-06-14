import React from "react";
import { Icon } from "./Icons.jsx";
import { NAV } from "./ceraData.jsx";
import { CERA_LOGO } from "./ceraAssets.jsx";

/** CeraNavRail — left icon+label navigation rail with BEV brand + CERA wordmark. */
export function CeraNavRail({ active, onSelect, onLogout }) {
  return (
    <nav className="cera-nav">
      <div className="cera-nav__brand">
        <img className="cera-nav__logo" src={CERA_LOGO} alt="BirdsEyeView" />
        <div className="cera-nav__product">CERA&reg;</div>
      </div>
      <div className="cera-nav__items">
        {NAV.map((item) => (
          <div
            key={item.id}
            className={"cera-navitem" + (active === item.id ? " cera-navitem--active" : "")}
            onClick={() => onSelect && onSelect(item.id)}
          >
            <span className="cera-navitem__ic"><Icon name={item.icon} size={18} /></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="cera-nav__spacer" />
      <div className="cera-nav__foot">
        <div className="cera-navitem">
          <span className="cera-navitem__ic" style={{ color: "var(--cera-teal-2)" }}><Icon name="collapse" size={18} /></span>
          <span>Collapse Sidebar</span>
        </div>
        <div className="cera-navitem cera-navitem--logout" onClick={onLogout}>
          <span className="cera-navitem__ic"><Icon name="logout" size={18} /></span>
          <span>Logout</span>
        </div>
      </div>
    </nav>
  );
}
