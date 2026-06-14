# Punch-List Addendum — App Navigation + Roadmap Page (§11–§12)

*Follows on from `MGA_App_Change_PunchList.md` (§0–§10). Apply after those. Same rules: engine core untouched, suites stay green.*

---

## §11 · Top-level navigation — three sections

Add a persistent menu bar so the user moves between three destinations. The **market profile selector stays global** (visible on all three views — it affects Authority rules and Underwriting alike).

**State in `App.tsx`:**

```tsx
type View = "underwrite" | "authority" | "roadmap";
const [view, setView] = useState<View>("underwrite");
```

**Nav bar** (render directly under the existing `<header>`, above the hero; reuse `pill-btn` styling or a dedicated nav class):

```tsx
<nav className="appnav">
  <button className={view === "underwrite" ? "on" : ""} onClick={() => setView("underwrite")}>
    Underwrite
  </button>
  <button className={view === "authority" ? "on" : ""} onClick={() => setView("authority")}>
    Underwriting Authority
  </button>
  <button className={view === "roadmap" ? "on" : ""} onClick={() => setView("roadmap")}>
    Roadmap &amp; Methodology
  </button>
</nav>
```

**Routing the views:**

- `underwrite` → everything that exists today: the single-location / portfolio mode pills and the staged flow (triage → assessment → terms → price → wording).
- `authority` → the **AuthorityPanel from §8 of the main punch-list**, promoted to its own page (it is no longer a section inside the underwrite flow). The authority rules object lives in `App` state (or a small store) so: (a) edits persist when switching tabs, and (b) the triage in the Underwrite view always reads the current rules.
- `roadmap` → the new `RoadmapPanel` (§12 below).

**Hero copy** should change per view (one line each) so each page explains itself.

**Accept:** three tabs switch without losing state; rules edited in Authority immediately affect triage in Underwrite; market selector visible and effective on all views.

---

## §12 · Roadmap & Methodology page

New file `src/ui/RoadmapPanel.tsx` — the data-flow & build-status diagram, self-contained (inline styles, no new CSS dependencies). Paste the component below verbatim, then adjust only if class names collide.

This page will later also host a methodology summary; for now it is the diagram plus the footer note.

```tsx
// src/ui/RoadmapPanel.tsx
// Data flow & build status — the "what's built / what's coming" diagram.
// Self-contained styling; statuses: live | poc | build.

type Status = "live" | "poc" | "build";

const C: Record<Status, { fg: string; bg: string; border: string; label: string }> = {
  live: { fg: "#11804f", bg: "#e6f7ef", border: "#11804f", label: "BUILT & LIVE" },
  poc: { fg: "#9a6b00", bg: "#fdf3dd", border: "#d9a514", label: "PoC — RESEARCH & CALIBRATION" },
  build: { fg: "#c2186b", bg: "#FFF0F9", border: "#FF66C4", label: "TO BUILD" },
};

interface Stage {
  n: number;
  title: string;
  status: Status;
  desc: string;
  extra?: string;
  noteChip?: string;
}

const STAGES: Stage[] = [
  { n: 1, title: "Location input", status: "live",
    desc: "The underwriter enters a single location (address + TIV + occupancy) or uploads a schedule / bordereau from Excel.",
    extra: "Provided by the user." },
  { n: 2, title: "AI Ingestion Tool", status: "live",
    desc: "Cleans, standardises and geo-locates every row — a messy 10,000-location schedule becomes structured, lat/long-tagged data in minutes.",
    extra: "Built by Raghav · already in production." },
  { n: 3, title: "BirdsEyeView hazard model (CERA® API)", status: "live", noteChip: "Hail & SCS ≈ year-end 2026",
    desc: "For each location, returns the full return-period distribution per peril — not a score, the whole curve.",
    extra: "Perils live: Flood (FATHOM), Tropical Cyclone, Earthquake, US Tornado, Wildfire · Endpoints: lite (fast screen), daily (full curve), batch (whole books)." },
  { n: 4, title: "Vulnerability model", status: "poc",
    desc: "Open-source, peer-reviewed damage curves convert hazard intensity into a damage ratio for the building — tuned by construction, occupancy, year built and roof.",
    extra: "Sources: JRC flood · Emanuel/Eberenz cyclone · GEM earthquake · wildfire conditional-damage. Needs science-team calibration." },
  { n: 5, title: "AAL engine", status: "poc",
    desc: "Hazard curve × damage curve × TIV → per-peril AAL, a total NatCat AAL, and a confidence score reflecting the data supplied.",
    extra: "Output mirrors the policy: Section 1 (Material Damage) + Section 2 (BI) = total. Methodology paper + validated calculator exist." },
  { n: 6, title: "Underwriting layer — authority & triage", status: "build",
    desc: "The risk is checked against underwriting rules set by a super-user — the manager, or the capacity provider under a binding authority (e.g. Hudson).",
    extra: "Rules: max TIV · permitted construction/occupancy · excluded zones · per-peril hazard frequency limits · AAL ceilings · minimum terms · rate floors. Every breach names the rule that fired." },
  { n: 7, title: "Portfolio checks — accumulation", status: "build",
    desc: "The new risk is tested against the in-force book: zone aggregates, PML / tail capital, and whether it pushes a peak zone over the limit.",
    extra: "Cresta-zone aggregation · 1-in-100/250 PML · 1-in-200 TVaR · marginal impact. True event-based PML needs catalogue footprints from data science." },
];

const EXPORT_STAGE: Stage = {
  n: 9, title: "Export for independent modelling", status: "build",
  desc: "Cleaned, bound risks export to RMS EDM or Verisk CEDE format — so the book can be run through the big cat models independently, with zero re-keying.",
  extra: "Capacity providers and reinsurers ask for exactly these formats — a data-cleaning chore becomes a one-click handoff.",
};

function Chip({ s }: { s: Status }) {
  const c = C[s];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`, letterSpacing: ".03em" }}>
      {c.label}
    </span>
  );
}

function Arrow() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <svg width="14" height="22">
        <line x1="7" y1="0" x2="7" y2="14" stroke="#131F3C" strokeWidth="2" />
        <polygon points="2,13 12,13 7,21" fill="#131F3C" />
      </svg>
    </div>
  );
}

function StageCard({ s }: { s: Stage }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ee", borderLeft: `6px solid ${C[s.status].border}`,
      borderRadius: 10, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ background: "#131F3C", color: "#fff", borderRadius: 8, minWidth: 30, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginTop: 2 }}>{s.n}</div>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {s.title} <Chip s={s.status} />
          {s.noteChip && (
            <span style={{ fontSize: 10.5, padding: "3px 10px", borderRadius: 20, background: "#eceef3",
              color: "#5A6178", border: "1px solid #e4e7ee" }}>◌ {s.noteChip}</span>
          )}
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#5A6178" }}>{s.desc}</p>
        {s.extra && <div style={{ fontSize: 11.5, color: "#5A6178", marginTop: 5 }}>{s.extra}</div>}
      </div>
    </div>
  );
}

export function RoadmapPanel() {
  return (
    <div className="panel">
      <h2>How a risk flows through the system — and what's built</h2>
      <div className="sub">One submission's journey from the underwriter's desk to a bound risk or a referral.</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
        <Chip s="live" /> <Chip s="poc" /> <Chip s="build" />
      </div>

      {STAGES.map((s, i) => (
        <div key={s.n}>
          <StageCard s={s} />
          {i < STAGES.length - 1 && <Arrow />}
        </div>
      ))}
      <Arrow />

      {/* 8 — decision */}
      <div style={{ background: "#131F3C", color: "#fff", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>8 · Decision — inside or outside authority?</h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#c3cadc" }}>Everything above resolves to one call, with the reasons listed.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 10 }}>
        <div>
          <div style={{ textAlign: "center", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
            fontWeight: 500, padding: "5px 0", color: "#11804f" }}>▼ Inside authority — bind</div>
          <div style={{ background: "#fff", border: "1px solid #e4e7ee", borderLeft: "6px solid #FF66C4", borderRadius: 10, padding: "12px 16px" }}>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 500, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              Auto-underwrite with guided terms <Chip s="build" />
            </h4>
            <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#5A6178" }}>
              Proposes deductibles, sublimits and layers within the rules, prices a capital-aware technical premium, and assembles the wording schedule.
            </p>
          </div>
        </div>
        <div>
          <div style={{ textAlign: "center", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
            fontWeight: 500, padding: "5px 0", color: "#c2186b" }}>▼ Outside authority — refer</div>
          <div style={{ background: "#fff", border: "1px solid #e4e7ee", borderLeft: "6px solid #FF66C4", borderRadius: 10, padding: "12px 16px" }}>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 500, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              One-click referral report <Chip s="build" />
            </h4>
            <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#5A6178" }}>
              A branded placement document — risk summary, the rule that fired, hazard &amp; AAL detail, proposed terms, price — goes straight to the capacity provider.
            </p>
          </div>
        </div>
      </div>

      <Arrow />
      <StageCard s={EXPORT_STAGE} />

      <div className="note" style={{ marginTop: 18 }}>
        Colour code: green = built &amp; live · amber = PoC built, research/calibration needed · pink = to build.
        Stages 4–5 have working proof-of-concepts (validated maths, methodology paper); stages 6–9 are specified in the build plan.
      </div>
    </div>
  );
}
```

**Accept:** "Roadmap & Methodology" tab renders the full diagram with the decision branch and colour coding; no console errors; print (Cmd+P) looks clean.

---

*Note for later: this page is also where the methodology summary (from `MGA_AAL_Engine_Approach_and_Methodology.md`) can live as a second tab-within-the-page when wanted.*
