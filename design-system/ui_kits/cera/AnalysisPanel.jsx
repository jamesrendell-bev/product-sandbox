import React, { useState, useRef } from "react";
import { Icon } from "./Icons.jsx";
import { RETURN_PERIODS } from "./ceraData.jsx";

function Slider({ row, onChange }) {
  const ref = useRef(null);
  const pct = Math.round((row.value / row.max) * 100);
  const setFromEvent = (clientX) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onChange(Math.max(10, Math.round((t * row.max) / 10) * 10));
  };
  const onDown = (e) => {
    setFromEvent(e.clientX);
    const move = (ev) => setFromEvent(ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div className="cera-rp__row">
      <span className="cera-rp__ic"><Icon name={row.icon} size={16} /></span>
      <div className="cera-rp__track" ref={ref} onPointerDown={onDown} style={{ cursor: "pointer" }}>
        <div className="cera-rp__fill" style={{ width: pct + "%" }} />
        <div className="cera-rp__knob" style={{ left: pct + "%" }} />
      </div>
      <span className="cera-rp__val">{row.value}</span>
    </div>
  );
}

/** CeraAnalysisPanel — mode tabs + return-period controls + Create New Risk form. */
export function CeraAnalysisPanel({ location, onSave, tab, onTab, mode, onMode }) {
  const [rows, setRows] = useState(RETURN_PERIODS);
  const [risk, setRisk] = useState("");
  const update = (id, value) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, value } : r)));
  const tabs = ["Live", "In-Depth", "Multi-Entry"];
  const modes = ["Global Relative Mode", "Future Period Mode"];

  return (
    <section className="cera-panel cera-analysis">
      <div className="cera-ptabs">
        <div className="cera-tabs">
          {tabs.map((t) => (
            <div key={t} className={"cera-tab" + (tab === t ? " cera-tab--active" : "")} onClick={() => onTab(t)}>{t}</div>
          ))}
        </div>
        <div className="cera-subtabs">
          {modes.map((m) => (
            <div key={m} className={"cera-subtab" + (mode === m ? " cera-subtab--active" : "")} onClick={() => onMode(m)}>{m}</div>
          ))}
        </div>
      </div>
      <div className="cera-loc">
        <span style={{ color: "var(--cera-teal-2)" }}><Icon name="pin" size={18} /></span>
        <div>
          <div className="cera-loc__name">{location.name}</div>
          <div className="cera-loc__sub">{location.coords}</div>
        </div>
      </div>

      <div className="cera-panel__body">
        <div className="cera-section">
          <p className="cera-section__label">Annual Return Period</p>
          <div className="cera-rp">
            {rows.map((r) => <Slider key={r.id} row={r} onChange={(v) => update(r.id, v)} />)}
          </div>
          <button className="cera-btn cera-btn--ghost cera-btn--block" style={{ marginTop: 16 }}>
            <Icon name="plus" size={15} /> Add Hazard
          </button>
        </div>

        <div className="cera-section" style={{ borderBottom: "none" }}>
          <p className="cera-section__label">Create New Risk</p>
          <div className="cera-field">
            <span className="cera-field__ic"><Icon name="tag" size={15} /></span>
            <input value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="Enter risk name" />
          </div>
          <div className="cera-fieldgrid">
            <div className="cera-field cera-field--row">
              <span className="cera-field__ic"><Icon name="calendar" size={15} /></span>
              <input placeholder="Start date" />
            </div>
            <div className="cera-field cera-field--row">
              <span className="cera-field__ic"><Icon name="calendar" size={15} /></span>
              <input placeholder="End date" />
            </div>
          </div>
          <div className="cera-field">
            <span className="cera-field__prefix">GBP</span>
            <input placeholder="Enter TIV" defaultValue="" />
          </div>
          <div className="cera-fieldgrid">
            <div className="cera-field cera-field--row">
              <span className="cera-field__ic"><Icon name="percent" size={15} /></span>
              <input placeholder="Line size" />
            </div>
            <div className="cera-field cera-field--row">
              <span className="cera-field__ic"><Icon name="user" size={15} /></span>
              <input placeholder="Broker" />
            </div>
          </div>
          <div className="cera-field">
            <span className="cera-field__ic"><Icon name="briefcase" size={15} /></span>
            <select defaultValue="">
              <option value="" disabled>Select line of business</option>
              <option>Property — Commercial</option>
              <option>Property — Binder</option>
              <option>Marine &amp; Energy</option>
              <option>Agriculture</option>
            </select>
          </div>
          <button className="cera-btn cera-btn--block" style={{ marginTop: 6 }} onClick={() => onSave(risk)}>
            Save Results
          </button>
        </div>
      </div>
    </section>
  );
}
