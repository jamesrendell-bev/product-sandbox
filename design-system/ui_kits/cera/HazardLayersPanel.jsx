import React, { useState } from "react";
import { Icon } from "./Icons.jsx";
import { HAZARD_LAYERS, LAYER_GROUPS } from "./ceraData.jsx";

/** CeraHazardLayers — right-hand peril layer list with toggles + collapsible groups. */
export function CeraHazardLayers() {
  const [on, setOn] = useState(() => {
    const m = {};
    HAZARD_LAYERS.forEach((l) => (m[l.id] = !!l.on));
    return m;
  });
  const [open, setOpen] = useState({ live: false, live2: false, hist: false });
  const toggle = (id) => setOn((s) => ({ ...s, [id]: !s[id] }));

  return (
    <section className="cera-panel cera-layers">
      <div className="cera-panel__head">
        <span className="cera-panel__title">Hazard Layers</span>
        <span style={{ color: "var(--cera-txt-dim)" }}><Icon name="chevron" size={16} /></span>
      </div>
      <div className="cera-panel__body">
        {HAZARD_LAYERS.map((l) => (
          <div
            key={l.id}
            className={"cera-layer" + (on[l.id] ? " cera-layer--on" : "")}
            onClick={() => toggle(l.id)}
          >
            <span className="cera-layer__ic"><Icon name={l.icon} size={16} /></span>
            <span className="cera-layer__name">{l.name}</span>
            {l.badge && <span className="cera-layer__badge">{l.badge}</span>}
            <span className="cera-layer__eye"><Icon name="eye" size={15} /></span>
          </div>
        ))}
        {LAYER_GROUPS.map((g) => (
          <div
            key={g.id}
            className={"cera-grouphead" + (open[g.id] ? " cera-grouphead--open" : "")}
            onClick={() => setOpen((s) => ({ ...s, [g.id]: !s[g.id] }))}
          >
            <span className="cera-grouphead__ic"><Icon name="triangle" size={15} /></span>
            <span>{g.label}</span>
            <span className="cera-grouphead__chev"><Icon name="chevron" size={15} /></span>
          </div>
        ))}
      </div>
    </section>
  );
}
