import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { RAG_COLOR, decisionRag, type Decision, type PerilResult } from "../../lib/weatherTriage";

interface StationPt { name: string; latitude: number; longitude: number; distance_km: number; used: boolean }

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function donutSeg(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number) {
  const [x0o, y0o] = polar(cx, cy, rOut, a0);
  const [x1o, y1o] = polar(cx, cy, rOut, a1);
  const [x1i, y1i] = polar(cx, cy, rIn, a1);
  const [x0i, y0i] = polar(cx, cy, rIn, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0o},${y0o} A${rOut},${rOut} 0 ${large} 1 ${x1o},${y1o} L${x1i},${y1i} A${rIn},${rIn} 0 ${large} 0 ${x0i},${y0i} Z`;
}

// venue glyph: risk halo + 5-segment peril ring + decision-coloured core
function venueIcon(perils: PerilResult[], decision: Decision, maxP: number) {
  const S = 96, cx = S / 2, cy = S / 2, rIn = 15, rOut = 23, gap = 3;
  const haloR = 20 + (Number.isFinite(maxP) ? maxP : 0) * 24;
  const n = perils.length;
  const segs = perils.map((pr, i) => {
    const a0 = (360 / n) * i + gap / 2;
    const a1 = (360 / n) * (i + 1) - gap / 2;
    return `<path d="${donutSeg(cx, cy, rIn, rOut, a0, a1)}" fill="${RAG_COLOR[pr.rag]}" opacity="${pr.rag === "neutral" ? 0.3 : 0.95}"/>`;
  }).join("");
  const core = RAG_COLOR[decisionRag[decision]];
  const html =
    `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${cx}" cy="${cy}" r="${haloR}" fill="#FF6CAA" opacity="0.16"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${rOut + 2}" fill="#04102a" opacity="0.65"/>` +
    segs +
    `<circle cx="${cx}" cy="${cy}" r="9" fill="${core}" stroke="#fff" stroke-width="2"/>` +
    `</svg>`;
  return L.divIcon({ html, className: "venue-glyph", iconSize: [S, S], iconAnchor: [cx, cy] });
}

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  if (pts.length === 1) map.setView(pts[0], 8, { animate: false });
  else if (pts.length > 1) {
    const lats = pts.map((p) => p[0]), lons = pts.map((p) => p[1]);
    map.fitBounds([[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]], { padding: [60, 60], maxZoom: 9, animate: false });
  }
  return null;
}

export function PerilRingMap({
  lat, lon, label, decision, perils, stations,
}: { lat: number; lon: number; label: string; decision: Decision; perils: PerilResult[]; stations: StationPt[] }) {
  const maxP = perils.filter((p) => p.applicable).reduce((m, p) => (Number.isFinite(p.p) && p.p > m ? p.p : m), 0);
  const used = stations.filter((s) => s.used);
  const pts: [number, number][] = [[lat, lon], ...used.map((s) => [s.latitude, s.longitude] as [number, number])];

  return (
    <MapContainer center={[lat, lon]} zoom={8} style={{ height: 420, width: "100%" }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
      <Fit pts={pts} />
      {used.map((s, i) => (
        <Polyline key={`l${i}`} positions={[[lat, lon], [s.latitude, s.longitude]]} pathOptions={{ color: "#FF6CAA", weight: 1, opacity: 0.5, dashArray: "4 5" }} />
      ))}
      {stations.map((s, i) => (
        <CircleMarker key={`s${i}`} center={[s.latitude, s.longitude]} radius={s.used ? 5 : 3}
          pathOptions={{ color: s.used ? "#FF6CAA" : "#5A6178", fillColor: s.used ? "#FF6CAA" : "#5A6178", fillOpacity: 0.9, weight: 1 }}>
          <Tooltip>{s.name} · {s.distance_km.toFixed(0)} km{s.used ? " · used" : ""}</Tooltip>
        </CircleMarker>
      ))}
      <Marker position={[lat, lon]} icon={venueIcon(perils, decision, maxP)}>
        <Tooltip direction="top" offset={[0, -24]}>{label.split(",").slice(0, 2).join(",")}</Tooltip>
      </Marker>
    </MapContainer>
  );
}
