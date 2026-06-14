import { BookOpen } from "lucide-react";
import { ViewHead, PerilIcon } from "../components/ui";
import { DEFAULT_WEATHER_AUTHORITY, THRESHOLD_NOTES } from "../../domain/weatherAuthority";

const ROWS: { icon: string; peril: string; threshold: string; key: string }[] = [
  { icon: "rainfall", peril: "Rainfall", threshold: `≥ ${DEFAULT_WEATHER_AUTHORITY.thresholds.rain} mm in a day`, key: "rain" },
  { icon: "windspeed", peril: "Wind speed (sustained)", threshold: `≥ ${DEFAULT_WEATHER_AUTHORITY.thresholds.windspeed} km/h`, key: "windspeed" },
  { icon: "windgust", peril: "Wind gust (peak)", threshold: `≥ ${DEFAULT_WEATHER_AUTHORITY.thresholds.windgust} km/h`, key: "windgust" },
  { icon: "temperature", peril: "Temperature — heat", threshold: `≥ ${DEFAULT_WEATHER_AUTHORITY.thresholds.heat} °C`, key: "heat" },
  { icon: "temperature", peril: "Temperature — cold", threshold: `≤ ${DEFAULT_WEATHER_AUTHORITY.thresholds.cold} °C`, key: "cold" },
  { icon: "snowfall", peril: "Snowfall — outdoor", threshold: `≥ ${DEFAULT_WEATHER_AUTHORITY.thresholds.snow_outdoor} mm depth`, key: "snow_outdoor" },
  { icon: "snowfall", peril: "Snowfall — indoor", threshold: `≥ ${DEFAULT_WEATHER_AUTHORITY.thresholds.snow_indoor} mm depth`, key: "snow_indoor" },
];

const SOURCES = [
  ["Festival weather contingency & wind discipline", "https://www.ticketfairy.com/blog/weather-safe-festival-structures-and-wind-discipline"],
  ["Outdoor event weather safety — wind, lightning & heat", "https://www.hseblog.com/outdoor-event-weather-safety/"],
  ["Event cancellation insurance — adverse weather (Tysers)", "https://www.tysers.com/event-cancellation-insurance-adverse-weather/"],
  ["Upper thermal thresholds for outdoor sport (WBGT)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC10989705/"],
  ["FEMA P-957 snow-load safety guide", "https://www.fema.gov/sites/default/files/documents/fema957_snowload_guide.pdf"],
];

export function GuidanceView() {
  return (
    <>
      <ViewHead
        eyebrow="Reference · Methodology"
        title="Guidance"
        sub="How the recommended cancellation thresholds were chosen, and how the triage turns weather history into a referral. Every default is editable under Referral thresholds."
      />

      <div className="card">
        <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><BookOpen size={16} /> Where the thresholds come from</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>
          The recommended severity thresholds were selected by reviewing published event-management and safety
          guidance — festival weather-contingency plans, temporary-structure wind ratings, event-safety guides,
          adverse-weather cancellation-insurance triggers, sports heat-stress (WBGT) research, and snow-load codes.
          They represent the level at which each peril, occurring across the event day, would credibly force a
          cancellation or abandonment. They are starting points for an underwriter, not fixed rules.
        </p>

        <table className="table" style={{ marginTop: 14 }}>
          <thead><tr><th>Peril</th><th>Default threshold</th><th>Basis</th></tr></thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.peril}>
                <td className="rowlabel" style={{ display: "flex", alignItems: "center", gap: 8 }}><PerilIcon name={r.icon} /> {r.peril}</td>
                <td>{r.threshold}</td>
                <td style={{ whiteSpace: "normal", fontSize: 13 }}>{THRESHOLD_NOTES[r.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint" style={{ marginTop: 10 }}>
          Data caveats: Meteostat <code>wspd</code> is the daily-average wind (gusts run higher, so the gust test uses <code>wpgt</code>), and <code>snow</code> is snow depth, used as a proxy for snowy conditions.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">How the triage works</div>
          <ul style={{ fontSize: 14, lineHeight: 1.65, paddingLeft: 18, marginTop: 6 }}>
            <li><strong>Indoor vs outdoor.</strong> Indoor events assume wind, rain, heat and cold do not cancel. Only heavy snow (access / roof load) can refer. Outdoor events check all five perils.</li>
            <li><strong>Climatology modelling.</strong> For each peril we take the nearest ground station's history and, for every past year, the worst value across the event window. The chance of breaching the cancellation threshold is a blend of the empirical share of years and a parametric tail fit (Gamma for rain/snow, Gumbel for wind, Normal for temperature).</li>
            <li><strong>Referral bands.</strong> A peril is amber at or above the referral probability ({Math.round(DEFAULT_WEATHER_AUTHORITY.referralProbability * 100)}%) and red at or above the decline probability ({Math.round(DEFAULT_WEATHER_AUTHORITY.declineProbability * 100)}%). The venue's outcome is the worst peril.</li>
            <li><strong>Guidance, not a price.</strong> No premium is produced. This triages whether a risk should be looked at more closely.</li>
          </ul>
        </div>
        <div className="card">
          <div className="card-title">Sources reviewed</div>
          <ol style={{ fontSize: 13.5, lineHeight: 1.8, paddingLeft: 18, marginTop: 6 }}>
            {SOURCES.map(([t, u]) => <li key={u}><a className="src-link" href={u} target="_blank" rel="noreferrer">{t}</a></li>)}
          </ol>
          <p className="hint" style={{ marginTop: 8 }}>Live global-risk watchlist (Further event intel) is a curated snapshot, in production refreshed from FCDO / State Dept advice, ACLED, strike notices and NHC/JTWC tracking.</p>
        </div>
      </div>
    </>
  );
}
