import { useMemo, useState } from "react";
import { MARKET_LIST, MARKET_PROFILES, type MarketId } from "./domain/marketProfiles";
import { damageableTIV, emptySubmission, totalTIV, type Submission } from "./domain/inputModel";
import { assessRisk } from "./domain/aalEngine";
import {
  applyTerms,
  defaultLayers,
  defaultTermsFor,
  priceTower,
  suggestTerms,
  totalNetAAL,
  type Layer,
  type PerilTerms,
} from "./domain/terms";
import { sampleCombinedEP } from "./engine/combined-ep";
import { DEFAULT_PRICING, priceRisk, rateAdequacy, type PricingParams } from "./domain/pricing";
import {
  defaultAuthority,
  loadStoredAuthority,
  saveStoredAuthority,
  clearStoredAuthority,
  triageStage1,
  triageStage2,
  evaluateStage1,
  type Authority,
  type TriageResult,
  type FiredRule,
} from "./domain/authority";
import { generateWording } from "./domain/wording";
import {
  fetchHazardCurvesExt,
  fetchTriageLite,
  isLive,
  type HazardBundleExt,
  type TriageLite,
} from "./engine/cera-client-ext";
import type { ExtPerilId } from "./engine/aal-ext";
import { geocode } from "./domain/geocode";
import {
  assessLocation,
  mapBdxRow,
  marginalCheck,
  nearestZone,
  submissionToPortfolioLocation,
  type LocationAAL,
  type MarginalCheck,
} from "./domain/portfolio";
import { parseBDXFile, loadSampleBDX } from "./data/bdx";

import { TriagePanel } from "./ui/TriagePanel";
import { AssessmentPanel } from "./ui/AssessmentPanel";
import { TermsPanel } from "./ui/TermsPanel";
import { PricePanel } from "./ui/PricePanel";
import { WordingPanel } from "./ui/WordingPanel";
import { AuthorityPanel } from "./ui/AuthorityPanel";
import { ReferralReport } from "./ui/ReferralReport";
import { RoadmapPanel } from "./ui/RoadmapPanel";
import { GlossaryPanel } from "./ui/GlossaryPanel";
import { Stepper, type StepView } from "./ui/Stepper";
import { SandboxHome } from "./ui/SandboxHome";
import { Disclosure } from "./ui/atoms";
import { Menu, ChevronRight, ChevronLeft, ArrowRight, Check } from "lucide-react";
import { MapView, type MapPoint } from "./ui/MapView";
import { PortfolioPanel } from "./ui/PortfolioPanel";
import { money, pct } from "./ui/format";

// Vite only exposes VITE_-prefixed env vars to the browser. (The old un-prefixed
// names silently never activated.) Production must route via a thin server proxy
// — never ship the key to the browser.
const API_KEY = import.meta.env.VITE_BEV_API_KEY ?? "";
const BASE_URL = import.meta.env.VITE_BEV_API_BASE_URL ?? "";

type Mode = "single" | "portfolio";
type View = "home" | "underwrite" | "authority" | "roadmap" | "glossary";

// Running inside the sandbox shell? Then open the product directly and let
// the shell's rail be the chrome (see main.tsx for the matching data-embed).
const EMBEDDED = typeof window !== "undefined" &&
  (window.self !== window.top || new URLSearchParams(window.location.search).has("embed"));

export default function App() {
  const [product, setProduct] = useState<string | null>(EMBEDDED ? "natcat" : null); // null = Sandbox directory
  const [view, setView] = useState<View>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [mode, setMode] = useState<Mode>("single");
  const [market, setMarket] = useState<MarketId>("US");
  const profile = MARKET_PROFILES[market];

  const [submission, setSubmission] = useState<Submission>(() => emptySubmission("US"));
  const [bundle, setBundle] = useState<HazardBundleExt | null>(null);
  const [lite, setLite] = useState<TriageLite | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [continued, setContinued] = useState(false);
  const [loading, setLoading] = useState(false);

  const [terms, setTerms] = useState<Record<string, PerilTerms>>({});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [pricingParams, setPricingParams] = useState<PricingParams>(DEFAULT_PRICING);
  const [lma, setLma] = useState<string[]>([]);

  // §8 — Underwriting Authority (editable rules the triage runs on; saved to browser)
  const [authority, setAuthority] = useState<Authority>(() => loadStoredAuthority() ?? defaultAuthority());
  const [role, setRole] = useState<"underwriter" | "manager">("underwriter");
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(loadStoredAuthority() ?? defaultAuthority()));
  const authorityDirty = JSON.stringify(authority) !== savedSnapshot;
  function saveAuthority() {
    saveStoredAuthority(authority);
    setSavedSnapshot(JSON.stringify(authority));
  }
  function resetAuthority() {
    const def = defaultAuthority();
    setAuthority(def);
    clearStoredAuthority();
    setSavedSnapshot(JSON.stringify(def));
  }

  // §7 — in-force book (shared app-level state, persists across modes)
  const [book, setBook] = useState<LocationAAL[] | null>(null);
  const [bookName, setBookName] = useState("");
  const [bookLoading, setBookLoading] = useState(false);

  function marginalFor(s: Submission): MarginalCheck | null {
    if (!book || !book.length) return null;
    const cresta = s.crestaZone || nearestZone(s.lat, s.lng, book) || "—";
    const portLoc = submissionToPortfolioLocation(s, cresta);
    const newAAL = assessLocation(portLoc, profile);
    return marginalCheck(book, portLoc, newAAL, profile.perils, authority.maxAggregateZoneSharePct / 100);
  }
  const marginal = useMemo<MarginalCheck | null>(() => marginalFor(submission), [book, submission, profile, authority]);

  async function ingestBook(rows: Record<string, unknown>[], name: string) {
    const locs = rows.map((r, i) => mapBdxRow(r, i + 1)).filter((x): x is NonNullable<typeof x> => !!x);
    const assessed = locs.slice(0, 1500).map((l) => assessLocation(l, profile));
    setBook(assessed);
    setBookName(`${name} · ${assessed.length} risks`);
  }
  async function onLoadBookFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBookLoading(true);
    try { await ingestBook(await parseBDXFile(f), f.name); }
    finally { setBookLoading(false); }
  }
  async function onLoadBookSample() {
    setBookLoading(true);
    try { await ingestBook(await loadSampleBDX(), "Sample AU book"); }
    finally { setBookLoading(false); }
  }

  function changeMarket(m: MarketId) {
    setMarket(m);
    setSubmission(emptySubmission(m));
    setBundle(null);
    setLite(null);
    setTriageResult(null);
    setContinued(false);
    setTerms({});
    setLayers([]);
    setLma([]);
  }

  async function runTriage() {
    setLoading(true);
    try {
      // resolve a pin for the map (Nominatim in stub mode if no sample lat/lng)
      let lat = submission.lat;
      let lng = submission.lng;
      if ((lat == null || lng == null) && !API_KEY && submission.address) {
        const g = await geocode(submission.address);
        if (g) { lat = g.lat; lng = g.lng; setSubmission({ ...submission, lat: g.lat, lng: g.lng }); }
      }
      const l = await fetchTriageLite({
        location: submission.address,
        latitude: lat,
        longitude: lng,
        perils: profile.perils,
        apiKey: API_KEY,
        baseUrl: BASE_URL,
      });
      setLite(l);
      const mc = marginalFor({ ...submission, lat, lng });
      setTriageResult(
        triageStage1(authority, {
          tivPerLocation: totalTIV(submission.tiv),
          occupancy: submission.occupancy,
          constructionId: submission.constructionId,
          zone: submission.crestaZone ?? mc?.zone,
          liteScores: l.scores,
          aggregateBreach: mc?.breach,
          aggregateZoneSharePct: mc ? (mc.zoneTIVAfter / (mc.limit / (authority.maxAggregateZoneSharePct / 100))) * 100 : undefined,
        })
      );
      setContinued(false);
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }

  async function continueToAssessment() {
    setLoading(true);
    try {
      const b = await fetchHazardCurvesExt({
        location: submission.address,
        latitude: submission.lat,
        longitude: submission.lng,
        perils: profile.perils,
        apiKey: API_KEY,
        baseUrl: BASE_URL,
      });
      setBundle(b);
      setTerms(defaultTermsFor(profile.perils));
      setLayers(defaultLayers(damageableTIV(submission.tiv)));
      setContinued(true);
    } finally {
      setLoading(false);
    }
  }

  const assessment = useMemo(
    () => (bundle ? assessRisk(submission, profile, bundle) : null),
    [bundle, submission, profile]
  );

  // terms → nets → tower → price
  const derived = useMemo(() => {
    if (!assessment) return null;
    const perilCurves = assessment.perils.map((p) => ({ peril: p.peril as ExtPerilId, curve: p.result.loss_curve }));
    const effTerms = Object.keys(terms).length ? terms : defaultTermsFor(profile.perils);
    const nets = applyTerms(perilCurves, effTerms, assessment.damageableTIV);
    const netCurves = nets.map((n) => n.netCurve).filter((c) => c.length > 0);
    const totalNet = totalNetAAL(nets);
    const netEP = sampleCombinedEP(netCurves, assessment.damageableTIV);
    const tower = priceTower(netCurves, layers);
    const build = priceRisk(netCurves, totalNet, assessment.section2AAL, assessment.totalTIV, assessment.confidence.band, pricingParams);
    const adequacy = submission.chargedRatePct != null ? rateAdequacy(submission.chargedRatePct, build.technicalRate) : null;

    // full triage re-evaluation after terms — runs on the Authority rules (§8)
    const oneIn100 = netEP.reduce((best, p) => (Math.abs(p.rp - 100) < Math.abs(best.rp - 100) ? p : best), netEP[0] ?? { rp: 0, loss: 0 });
    const stage1Fired: FiredRule[] = evaluateStage1(authority, {
      tivPerLocation: assessment.totalTIV,
      occupancy: submission.occupancy,
      constructionId: submission.constructionId,
      zone: submission.crestaZone ?? marginal?.zone,
      liteScores: lite?.scores ?? [],
      aggregateBreach: marginal?.breach,
    });
    const full = triageStage2(
      authority,
      {
        netAALRate: assessment.totalTIV > 0 ? totalNet / assessment.totalTIV : 0,
        confidence: assessment.confidence.score,
        oneIn100NetRate: oneIn100 ? oneIn100.loss / assessment.totalTIV : undefined,
        anyPerilReliabilityLow: assessment.perils.some((p) => p.confidence.reliability < 0.5),
        chargedRate: submission.chargedRatePct,
        technicalRate: build.technicalRate,
      },
      stage1Fired
    );
    return { nets, netCurves, totalNet, netEP, tower, build, adequacy, full, effTerms };
  }, [assessment, terms, layers, pricingParams, submission, profile, marginal, authority, lite]);

  const mapPoints: MapPoint[] = useMemo(() => {
    if (mode !== "single") return [];
    const lat = submission.lat ?? bundle?.resolvedLat ?? lite?.resolvedLat;
    const lng = submission.lng ?? bundle?.resolvedLng ?? lite?.resolvedLng;
    if (lat == null || lng == null) return [];
    const html = assessment
      ? `Total AAL ${money(profile.currencySymbol, assessment.totalAAL)} · ${pct(assessment.aalRate)} TIV`
      : triageResult
      ? `Triage: ${triageResult.decision}`
      : "";
    return [{ lat, lng, label: submission.address || "Risk location", html, weight: 0.8 }];
  }, [mode, submission.lat, submission.lng, bundle, lite, assessment, triageResult, profile]);

  const coveredPerils = useMemo(() => {
    const s = new Set<ExtPerilId>();
    for (const p of profile.perils) if ((derived?.effTerms[p]?.sublimitPct ?? 100) > 0) s.add(p);
    return s;
  }, [profile, derived]);

  const NAV: [View, string][] = [
    ["authority", "Authority"],
    ["underwrite", "Underwrite"],
    ["roadmap", "Methodology"],
    ["glossary", "Glossary"],
  ];
  const STEP_DEFS: { num: string; label: string; sub: string; view: View; anchor?: string }[] = [
    { num: "01", label: "Authority", sub: "Set appetite", view: "authority" },
    { num: "02", label: "Underwrite", sub: "Assess the risk", view: "underwrite" },
    { num: "03", label: "Pricing & output", sub: "Terms, price, referral", view: "underwrite", anchor: "pricing" },
    { num: "04", label: "Methodology", sub: "How it works", view: "roadmap" },
  ];
  function goToStep(target: View, anchor?: string) {
    setView(target);
    setMobileNav(false);
    if (anchor) {
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  const currentStepIndex = view === "authority" ? 0 : view === "underwrite" ? 1 : view === "roadmap" ? 3 : -1;
  const journeySteps: StepView[] = STEP_DEFS.map((s, i) => ({
    num: s.num,
    label: s.label,
    sub: s.sub,
    state: i === currentStepIndex ? "active" : i < currentStepIndex ? "done" : "todo",
    onClick: () => goToStep(s.view, s.anchor),
  }));

  return (
    <>
      <nav className="bevnav">
        <div className="inner">
          <button className="brand" onClick={() => { setProduct(null); setMobileNav(false); }} title="BirdsEyeView Product Sandbox">
            <img src="/brand/bev-logo-nav.svg" alt="BirdsEyeView" />
            <span className="pname">BirdsEyeView<span> · Product Sandbox</span></span>
          </button>
          {product === "natcat" ? (
            <>
              <button className="hamburger" onClick={() => setMobileNav((o) => !o)} aria-label="Menu">
                <Menu size={22} />
              </button>
              <div className={`links ${mobileNav ? "open" : ""}`}>
                <button className="nav-link back" onClick={() => { setProduct(null); setMobileNav(false); }}>
                  <ChevronLeft size={15} /> All products
                </button>
                {NAV.map(([v, label]) => (
                  <button key={v} className={`nav-link ${view === v ? "active" : ""}`} onClick={() => { setView(v); setMobileNav(false); }}>
                    {label}
                  </button>
                ))}
                {isLive(API_KEY) && <span className="badge-env">Live</span>}
              </div>
            </>
          ) : (
            <span className="sandbox-badge" style={{ marginLeft: "auto" }}>Testing with clients</span>
          )}
        </div>
      </nav>

      {product === null && <SandboxHome onEnter={(id) => { setProduct(id); setView("home"); window.scrollTo(0, 0); }} />}

      {product === "natcat" && (
      <>

      {view === "home" && (
        <>
          <header className="bevhero">
            <div className="inner">
              <img className="lockup" src="/brand/bev-esa-lockup-dark.png" alt="Developed in partnership with the European Space Agency" />
              <span className="eyebrow">CERA® · Property NatCat pricing</span>
              <h1 className="h-rule">Price property natural-catastrophe risk in four steps.</h1>
              <p>Take a single address or a whole bordereau. Screen it against your appetite, see the expected loss for every peril, set terms and a capital-aware price, and produce a referral in one click. Built on CERA® hazard and public vulnerability science.</p>
              <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => setView("authority")}>Start here <ArrowRight size={16} /></button>
                <button className="btn btn-ghost" style={{ color: "#fff", borderColor: "var(--line-dark)" }} onClick={() => setView("roadmap")}>See how it works</button>
              </div>
            </div>
          </header>
          <div className="contentwrap">
            <div className="pagehead" style={{ marginTop: 26 }}>
              <span className="eyebrow">The workflow</span>
              <h2 className="h-rule" style={{ fontSize: 22, fontWeight: 600 }}>Four steps, in order</h2>
            </div>
            <div className="steps-grid">
              {STEP_DEFS.map((s) => (
                <button key={s.num} className="bevcard steplink" onClick={() => goToStep(s.view, s.anchor)}>
                  <span className="snum">{s.num}</span>
                  <span className="slbl">{s.label}</span>
                  <span className="ssub">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {(view === "authority" || view === "underwrite") && <Stepper steps={journeySteps} />}

      <div className="contentwrap">
        {view === "underwrite" && (
        <>
        <div className="pagehead" style={{ marginTop: 18 }}>
          <span className="eyebrow">02 / Underwrite</span>
          <h1 className="h-rule">Underwrite a property risk</h1>
          <p className="page-intro">Enter a location and its values, screen it against your authority, then see the per-peril and total expected loss ('AAL'). Work a single risk, or upload a bordereau to score a whole book.</p>
        </div>
        <div className="controls">
          <div className="ctl">
            <label>Market profile</label>
            <select value={market} onChange={(e) => changeMarket(e.target.value as MarketId)}>
              {MARKET_LIST.map((m) => (
                <option key={m.id} value={m.id}>{m.label} — {m.serves}</option>
              ))}
            </select>
          </div>
          <div className="ctl">
            <label>Mode</label>
            <div className="pills">
              <button className={`pill-btn ${mode === "single" ? "on" : ""}`} onClick={() => setMode("single")}>Single location</button>
              <button className={`pill-btn ${mode === "portfolio" ? "on" : ""}`} onClick={() => setMode("portfolio")}>Upload BDX</button>
            </div>
          </div>
          <div className="ctl">
            <label>Currency · perils live</label>
            <div className="poc">{profile.currency} · {profile.perils.length} perils · wording {profile.wordingTemplateId}</div>
          </div>
          <div className="ctl" style={{ marginLeft: "auto" }}>
            <label>In-force book (for accumulation)</label>
            <div className="pills" style={{ alignItems: "center" }}>
              <label className="pill-btn" style={{ cursor: "pointer", margin: 0 }}>
                {bookLoading ? "Loading…" : "Load BDX"}
                <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={onLoadBookFile} />
              </label>
              <button className="pill-btn" onClick={onLoadBookSample} disabled={bookLoading}>Use sample</button>
              {book && <button className="pill-btn" onClick={() => { setBook(null); setBookName(""); }}>Clear</button>}
            </div>
            <div className="poc" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{book ? <><Check size={13} color="var(--rag-write)" /> {bookName}</> : "none loaded — aggregate unchecked"}</div>
          </div>
        </div>

        {mode === "single" ? (
          <>
            <TriagePanel
              profile={profile}
              submission={submission}
              setSubmission={setSubmission}
              onRunTriage={runTriage}
              loading={loading}
              triage={triageResult}
              lite={lite}
              onContinue={continueToAssessment}
              continued={continued}
              marginal={marginal}
              hasBook={!!book}
            />

            {mapPoints.length > 0 && (
              <div className="panel">
                <h2>Location</h2>
                <div className="sub">Dark map · CARTO dark-matter tiles.</div>
                <MapView points={mapPoints} height={360} />
              </div>
            )}

            {assessment && derived && continued && (
              <>
                <AssessmentPanel
                  profile={profile}
                  submission={submission}
                  setSubmission={setSubmission}
                  assessment={assessment}
                  adequacy={derived.adequacy}
                  live={isLive(API_KEY)}
                />

                <Disclosure title="4 · Terms, deductibles, sublimits and layer tower" sub="Suggested terms to a net-AAL target, with an advanced layer tower." open>
                  <TermsPanel
                    profile={profile}
                    terms={derived.effTerms}
                    setTerms={setTerms}
                    layers={layers}
                    setLayers={setLayers}
                    nets={derived.nets}
                    netEP={derived.netEP}
                    maxLoss={assessment.damageableTIV}
                    tower={derived.tower}
                    totalNet={derived.totalNet}
                    onSuggest={() =>
                      setTerms(
                        suggestTerms(
                          assessment.perils.map((p) => ({ peril: p.peril, curve: p.result.loss_curve })),
                          assessment.damageableTIV
                        )
                      )
                    }
                    authority={authority}
                  />
                </Disclosure>

                <div className="note" style={{ borderStyle: "solid", borderColor: "var(--line-dark)", margin: "18px 0 10px" }}>
                  <b>Optional from here.</b> Pricing and wording are optional. Expand them only if you want a capital-aware price or a marked-up wording. The decision and referral above do not depend on them.
                </div>

                <div id="pricing" style={{ scrollMarginTop: 90 }}>
                <Disclosure title="5 · Capital-aware price (optional)" sub="Net AAL plus expenses, cost-of-capital on tail capital and profit. Confidence-gated.">
                  <PricePanel
                    profile={profile}
                    build={derived.build}
                    params={pricingParams}
                    setParams={setPricingParams}
                    confidenceBand={assessment.confidence.band}
                  />
                </Disclosure>
                </div>

                <Disclosure title="6 · Wording and clause selection (optional)" sub="Marked-up schedule against the market's skeleton.">
                  <WordingPanel
                    profile={profile}
                    schedule={generateWording(profile, profile.perils, coveredPerils, derived.effTerms, submission.tiv.bi > 0, lma)}
                    lma={lma}
                    setLma={setLma}
                  />
                </Disclosure>

                <div className="note" style={{ borderStyle: "solid", borderColor: derived.full.decision === "decline" ? "var(--rag-decline)" : derived.full.decision === "refer" ? "var(--rag-refer)" : "var(--line)" }}>
                  <b>Decision (Authority): {derived.full.decision.toUpperCase()}</b>
                  {derived.full.decision !== "write" && <> — refer to {authority.referTo}</>}
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {derived.full.reasons.map((r, i) => <li key={i} style={{ fontSize: 12.5 }}>{r}</li>)}
                  </ul>
                  {derived.full.decision !== "write" && (
                    <ReferralReport
                      data={{
                        profile,
                        submission,
                        assessment,
                        lite,
                        terms: derived.effTerms,
                        nets: derived.nets,
                        tower: derived.tower,
                        build: derived.build,
                        adequacy: derived.adequacy,
                        decision: derived.full.decision,
                        fired: derived.full.fired,
                        authority,
                        live: isLive(API_KEY),
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <PortfolioPanel profile={profile} />
        )}
        </>
        )}

        {view === "authority" && (
          <>
            <div className="crumbs">
              <button onClick={() => setView("underwrite")}>Home</button>
              <ChevronRight size={13} />
              <span className="here">01 · Authority</span>
            </div>
            <div className="pagehead">
              <span className="eyebrow">01 / Authority</span>
              <h1 className="h-rule">Set your underwriting authority</h1>
              <p className="page-intro">Define the appetite your capacity provider lets you write within — the rules every risk is screened against. Anything outside them is flagged for referral. Set these once; the triage runs on them automatically.</p>
            </div>
            <AuthorityPanel authority={authority} setAuthority={setAuthority} role={role} setRole={setRole} profile={profile} dirty={authorityDirty} onSave={saveAuthority} onReset={resetAuthority} />
            <div className="stepnav">
              <span className="spacer" />
              <button className="btn btn-primary" onClick={() => setView("underwrite")}>
                Next: Underwrite a risk <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {view === "roadmap" && <RoadmapPanel />}

        {view === "glossary" && <GlossaryPanel />}
      </div>
      </>
      )}

      <footer className="bevfooter">
        <div className="inner">
          <p>
            Hazard {isLive(API_KEY) ? "from the live CERA® feed" : "modelled on the CERA® response"}. Vulnerability curves from published research (JRC flood, Emanuel/Eberenz tropical cyclone and wildfire, GEM earthquake). CERA® is a registered trademark of BirdsEyeView. © BirdsEyeView.
          </p>
          <img src="/brand/bev-esa-lockup-dark.png" alt="Developed in partnership with the European Space Agency" />
        </div>
      </footer>
    </>
  );
}
