import { useState } from "react";
import { CloudLightning, Mountain, BookOpen, SlidersHorizontal } from "lucide-react";
import { loadAuthority, type Authority } from "./domain/authority";
import { loadWeatherAuthority, type WeatherAuthority } from "./domain/weatherAuthority";
import { WeatherTriageView } from "./ui/modules/WeatherTriageView";
import { TriageView as CatastropheView } from "./ui/modules/TriageView";
import { GuidanceView } from "./ui/modules/GuidanceView";
import { AuthorityView } from "./ui/modules/AuthorityView";

export type ViewId = "triage" | "cat" | "guidance" | "authority";
export interface Prefill { location?: string; date?: string; organiser?: string; country?: string }

const NAV: { id: ViewId; label: string; icon: typeof CloudLightning; group: string }[] = [
  { id: "triage", label: "Weather risk triage", icon: CloudLightning, group: "Assess" },
  { id: "cat", label: "Catastrophe exposure", icon: Mountain, group: "Assess" },
  { id: "guidance", label: "Guidance", icon: BookOpen, group: "Reference" },
  { id: "authority", label: "Referral thresholds", icon: SlidersHorizontal, group: "Configure" },
];

export default function App() {
  const [view, setView] = useState<ViewId>("triage");
  const [weatherAuth, setWeatherAuth] = useState<WeatherAuthority>(() => loadWeatherAuthority());
  const [catAuth, setCatAuth] = useState<Authority>(() => loadAuthority());
  const [prefill, setPrefill] = useState<Prefill>({});

  const go = (v: ViewId, p?: Prefill) => { if (p) setPrefill(p); setView(v); };

  let groupSeen = "";
  return (
    <div className="app">
      <nav className="navrail">
        <div className="brand"><span className="wordmark">Birds<b>Eye</b>View</span></div>
        {NAV.map((item) => {
          const header = item.group !== groupSeen ? ((groupSeen = item.group), item.group) : null;
          const Icon = item.icon;
          return (
            <div key={item.id}>
              {header && <div className="nav-section">{header}</div>}
              <button className={`nav-item${view === item.id ? " active" : ""}`} onClick={() => setView(item.id)}>
                <Icon strokeWidth={1.8} /> {item.label}
              </button>
            </div>
          );
        })}
        <div className="navrail-foot">
          <img src="/brand/bev-esa-lockup-dark.png" alt="Developed in partnership with ESA" />
          <div className="mode-pill"><span className="dot stub" /> Contingency weather triage · guidance only</div>
        </div>
      </nav>

      <main className="main">
        <div className="main-inner">
          {view === "triage" && <WeatherTriageView auth={weatherAuth} go={go} />}
          {view === "cat" && <CatastropheView authority={catAuth} go={go} />}
          {view === "guidance" && <GuidanceView />}
          {view === "authority" && <AuthorityView weatherAuth={weatherAuth} setWeatherAuth={setWeatherAuth} catAuth={catAuth} setCatAuth={setCatAuth} />}
        </div>
      </main>
    </div>
  );
}
