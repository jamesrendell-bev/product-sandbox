# Punch-List Addendum — Glossary / Plain-English Guide (§13)

*Follows `MGA_App_Change_PunchList.md` (§0–§10) and the Navigation addendum (§11–§12). Adds a fourth menu section: a plain-English guide to technical property underwriting for non-underwriters.*

---

## §13a · Nav update — four tabs

In `App.tsx`, extend the `View` type and nav bar from §11:

```tsx
type View = "underwrite" | "authority" | "roadmap" | "glossary";
```

Fourth tab label: **"Glossary"** → renders `<GlossaryPanel />`.

## §13b · The component

New file `src/ui/GlossaryPanel.tsx` — paste verbatim. Data-driven, searchable, self-contained styles. Content is ordered the way a deal actually comes together, not alphabetically, so it reads as a mini-manual top to bottom *and* works as a look-up via the search box.

```tsx
// src/ui/GlossaryPanel.tsx
// Plain-English guide to technical property underwriting — for the
// non-underwriter. Grouped to follow how a deal comes together; searchable.

import { useState } from "react";

interface Term { t: string; d: string }
interface Group { title: string; intro: string; terms: Term[] }

const GROUPS: Group[] = [
  {
    title: "1 · Who's who in the deal",
    intro: "Property risks written under delegated authority involve a small cast. Get these four straight and everything else follows.",
    terms: [
      { t: "MGA / Coverholder", d: "An underwriting business that selects risks, sets prices and issues policies on behalf of an insurer — but the claims are paid from someone else's balance sheet. 'Coverholder' is the Lloyd's word for the same thing." },
      { t: "Capacity provider", d: "The insurer or reinsurer whose capital actually stands behind the policies (e.g. Hudson). They grant the MGA its authority, take most of the premium, and pay the claims." },
      { t: "Binding authority (the 'binder')", d: "The contract that delegates underwriting power to the MGA: what they may write, in which territories, at what terms, up to what limits. Anything outside it must be referred before binding." },
      { t: "Underwriting guidelines / appetite", d: "The written rules inside the binder — max values, permitted construction and occupancy types, banned regions, minimum deductibles. In this app they live in the Underwriting Authority section, and the triage runs on them." },
      { t: "Referral / prior submit", d: "A risk that falls outside the rules, sent to the manager or capacity provider for approval before it can be bound. Our referral report packages everything they need to say yes quickly." },
      { t: "Broker", d: "The intermediary acting for the insured — they bring the submission to the MGA." },
      { t: "Lloyd's syndicate", d: "An underwriting vehicle at Lloyd's of London; often the capacity behind a binder." },
      { t: "Super user", d: "Our app's term for whoever sets the authority rules — the team manager or the capacity provider." },
    ],
  },
  {
    title: "2 · Describing the risk",
    intro: "Before anything is priced, the risk has to be described. These are the facts underwriters collect — and the more of them you have, the sharper the price.",
    terms: [
      { t: "TIV — Total Insured Value", d: "Everything at risk, added up: the building, what's inside it, and the income that stops if it's destroyed. The single most important number on a submission." },
      { t: "TIV split (A / B / C / D)", d: "The standard breakdown: A = Buildings, B = Contents & Stock, C = Other property, D = Business Interruption. Bordereaux and policies are organised around this split." },
      { t: "COPE", d: "Construction, Occupancy, Protection, Exposure — the four classic facts about a property. Underwriters have asked these same four questions for a century." },
      { t: "Occupancy", d: "What the building is used for (home, office, warehouse, factory). It drives both the value mix and how badly damage hurts — a frozen-food warehouse and an office suffer very differently from the same event." },
      { t: "Construction class", d: "What the building is made of. Timber burns and blows away; unreinforced masonry cracks in earthquakes; steel and concrete shrug off wind. The same hazard produces wildly different losses by construction — which is why we ask." },
      { t: "Year built", d: "A proxy for the building code it was built to. A 1975 building pre-dates most modern wind and seismic codes; a 2015 one doesn't. We apply a modest factor for this." },
      { t: "Roof class", d: "For hail and wind, the roof IS most of the claim. Asphalt shingles dent and tear; standing-seam metal mostly doesn't." },
      { t: "ITV — Insurance to Value", d: "Are the declared values realistic? If a building worth $10m is declared at $6m, the premium is wrong and the claim goes badly. Implausibly low values are a red flag." },
      { t: "Schedule / Bordereau (BDX)", d: "The spreadsheet listing every location with its values and details — the standard monthly report an MGA sends its capacity provider. Our AI Ingestion Tool cleans and geo-locates these automatically." },
    ],
  },
  {
    title: "3 · Hazard — what nature might do",
    intro: "Hazard is about the location, not the building: how often does nature do something violent here, and how violent?",
    terms: [
      { t: "Peril", d: "A type of natural event: flood, tropical cyclone, earthquake, tornado, wildfire, hail." },
      { t: "Return period", d: "How often, on average, a given severity is reached. A '1-in-100-year' flood has a 1% chance EVERY year — it's a long-run average, not a calendar. It can happen two years running." },
      { t: "Exceedance probability (AEP)", d: "The same idea as a percentage: 1-in-100 = 1% per year; 1-in-250 = 0.4%." },
      { t: "Hazard curve / EP curve", d: "The full menu: every severity level and how often each occurs at this exact location. This is what CERA® returns — the whole curve, not a single score — and it's the raw material every later step is built from." },
      { t: "Severity threshold", d: "The physical level you're asking about: a Category 3 cyclone, an EF2 tornado, MMI 6 shaking, 1 metre of flood water, a 4cm hailstone." },
      { t: "Cresta zone", d: "Standard industry map zones used to add up exposure by region — the unit everyone uses to answer 'how much do we have in that area?'" },
    ],
  },
  {
    title: "4 · From hazard to loss",
    intro: "Hazard says what nature does. Vulnerability says what that does to the building. Multiply by the values and you get the loss.",
    terms: [
      { t: "Vulnerability curve / damage function", d: "The relationship between severity and damage for a building type: '1 metre of water destroys about 40% of a timber home's value.' We use published, peer-reviewed curves (JRC, GEM, Emanuel/Eberenz) so anyone can check our working." },
      { t: "MDR — Mean Damage Ratio", d: "The expected fraction of value lost at a given severity. 0.4 = expect to lose 40%." },
      { t: "AAL — Average Annual Loss", d: "The headline number: expected claims per year, averaged over the long run. If the AAL is $50k, then over many years this risk costs ~$50k/year in claims — some years zero, occasionally a multi-million-dollar year. The foundation of every technical price." },
      { t: "AAL rate", d: "AAL as a percentage of TIV, so risks of different sizes can be compared. 0.5% is ordinary; 3% is severe." },
      { t: "Section 1 / Section 2", d: "How property policies split cover: Section 1 = Material Damage (the building and contents), Section 2 = Business Interruption (the lost income while it's repaired). Our AAL shows both lines separately." },
      { t: "Business Interruption (BI) & indemnity period", d: "BI covers the income that stops after damage. The indemnity period is the maximum time it pays for (e.g. 12 or 24 months). Rule of thumb in our model: if the building is 40% damaged, roughly 40% of the declared BI value is at risk." },
      { t: "Confidence score", d: "Our honesty meter: how complete the data is × how reliable the model is here. Low confidence means 'treat this number as a range, and consider referring' — never false precision." },
      { t: "Reliability", d: "How good the underlying model is for that peril at that place. Flood with FATHOM data is excellent; hail (pre-launch) is deliberately marked low." },
    ],
  },
  {
    title: "5 · The policy — how terms shape the deal",
    intro: "The policy is a machine for sharing loss between the insured and the insurer. Terms are its levers — and every lever changes the price.",
    terms: [
      { t: "Limit", d: "The most the policy will ever pay." },
      { t: "Sublimit", d: "A lower cap for a specific peril — 'flood covered, but only up to 50% of the TIV.' How underwriters stay in markets they'd otherwise have to leave." },
      { t: "Deductible / excess", d: "What the insured bears before the policy pays. Cat deductibles are often a percentage of TIV (2% cyclone, 5% earthquake), sometimes with a minimum and maximum in dollars." },
      { t: "Layer / attachment / exhaustion", d: "Big risks are cut into slices. A '$5m xs $5m' layer pays losses between $5m (attachment — where it starts) and $10m (exhaustion — where it's used up). You can only price a layer if you know the whole loss curve." },
      { t: "Rate on line (RoL)", d: "A layer's price ÷ its limit. A $500k premium on a $5m layer = 10% RoL. The quick way underwriters compare layers." },
      { t: "Probability of attachment", d: "The chance the layer pays anything in a year — 'this layer attaches at 1-in-80.'" },
      { t: "Wording", d: "The contract text itself. Australia's standard is the ISR Mark V (Industrial Special Risks); the US uses ISO forms (CP 00 10 + CP 10 30) plus manuscript endorsements. Our app marks up the schedule against these skeletons." },
      { t: "All-risks", d: "The modern default: everything is covered unless specifically excluded (rather than listing what's covered). The exclusions are where the action is." },
      { t: "Endorsement / memorandum", d: "A bolt-on clause that changes the standard wording — e.g. 'flood is included, sublimited to $X.'" },
    ],
  },
  {
    title: "6 · Price & capital — turning loss into premium",
    intro: "The AAL is what the risk costs on average. The premium must also pay the people, the capital, and the bad years.",
    terms: [
      { t: "Loss cost / pure premium", d: "Just the expected claims — the AAL. The floor under any sane price." },
      { t: "Technical premium", d: "The full build-up: AAL + expenses + the cost of the capital the risk ties up + profit. What the price SHOULD be, before the market has its say." },
      { t: "Cost of capital", d: "Insurers must hold capital to survive a terrible year, and investors want a return on it (10–15%). Cat risk is capital-hungry because of its tail — so part of every cat premium is rent on that capital." },
      { t: "VaR — Value at Risk", d: "The 1-in-X-year loss. Regulators size capital at the 1-in-200 level: 'hold enough to survive the 0.5% year.'" },
      { t: "TVaR — Tail Value at Risk", d: "The average of all losses BEYOND the 1-in-200 point — what the tail really looks like once you're in it. Preferred for cat because cat tails are fat." },
      { t: "PML — Probable Maximum Loss", d: "The big-event number ('our 1-in-250 is $40m') used for capacity, aggregation and reinsurance decisions — distinct from the AAL, which is the average year." },
      { t: "Rate adequacy", d: "Charged rate vs technical rate. Charging 0.38% where the technical says 0.55% means ~30% underpriced — fine occasionally, fatal as a habit. Bordereaux carry the charged rate, so we can measure this across a whole book." },
    ],
  },
  {
    title: "7 · The portfolio — thinking in books, not risks",
    intro: "A risk can be perfectly priced and still be a bad idea — if it lands where you already have too much. Portfolio thinking is what separates good underwriters from great ones.",
    terms: [
      { t: "Accumulation / aggregation", d: "How much you'd lose if ONE event hit many of your risks at once. A thousand well-priced Brisbane policies are still a problem when the same flood visits all of them." },
      { t: "Peak zone", d: "A region where your exposure is too concentrated. New risks there get declined or referred regardless of price." },
      { t: "Diversification", d: "Spread risks don't all burn at once, so a diverse book's tail is smaller than the sum of its parts. Measurably — and capacity providers reward it." },
      { t: "Occurrence (OEP) basis", d: "Looking at losses per single event (the basis cat layers attach on), rather than added up over the whole year." },
      { t: "Marginal impact", d: "Not 'is this risk good?' but 'what does adding it do to MY book?' A risk that diversifies adds little to the tail and can be written keenly; one in a peak zone adds a lot and should cost more — or be declined." },
      { t: "EDM / CEDE", d: "The exposure-database formats of RMS (EDM) and Verisk (CEDE) — the lingua franca for handing a book to the big cat models. Exporting these means a capacity provider can model your book independently with zero re-keying." },
    ],
  },
];

export function GlossaryPanel() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const groups = needle
    ? GROUPS.map((g) => ({
        ...g,
        terms: g.terms.filter(
          (t) => t.t.toLowerCase().includes(needle) || t.d.toLowerCase().includes(needle)
        ),
      })).filter((g) => g.terms.length > 0)
    : GROUPS;

  return (
    <div className="panel">
      <h2>Glossary — a plain-English guide to property underwriting</h2>
      <div className="sub">
        For the non-underwriter: every term in this app, what it means, and why it matters. Read it top to bottom as a mini-manual, or search for a term.
      </div>
      <input
        type="text"
        placeholder="Search a term… e.g. TVaR, deductible, bordereau"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: "100%", maxWidth: 420, padding: "9px 12px", border: "1px solid #e4e7ee",
          borderRadius: 8, font: "inherit", marginBottom: 20 }}
      />

      {groups.length === 0 && <div className="sub">No terms match "{q}".</div>}

      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 26 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px", color: "#131F3C",
            borderBottom: "2px solid #FF66C4", display: "inline-block", paddingBottom: 2 }}>
            {g.title}
          </h3>
          <p style={{ fontSize: 12.5, color: "#5A6178", margin: "6px 0 12px" }}>{g.intro}</p>
          <div style={{ display: "grid", gap: 8 }}>
            {g.terms.map((t) => (
              <div key={t.t} style={{ background: "#fff", border: "1px solid #e4e7ee",
                borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontWeight: 500, fontSize: 13.5, color: "#131F3C" }}>{t.t}</div>
                <div style={{ fontSize: 12.5, color: "#5A6178", marginTop: 2 }}>{t.d}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="note">
        Plain-English definitions for orientation, not legal or contractual precision — the policy wording always governs. Figures used in examples are illustrative.
      </div>
    </div>
  );
}
```

**Accept:** fourth "Glossary" tab renders all seven groups; the search box filters live (e.g. typing "tvar" shows one card); no console errors.
