import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  html?: string;
  peak?: boolean;
  weight?: number; // 0..1 → marker radius / colour intensity
}

export function MapView({ points, height = 460 }: { points: MapPoint[]; height?: number }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // init once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true }).setView([-25, 134], 4);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // render points
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const pts = points.filter((p) => isFinite(p.lat) && isFinite(p.lng) && (p.lat || p.lng));
    if (!pts.length) return;

    const group: L.LayerGroup =
      pts.length > 1 ? (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 }) : L.layerGroup();

    for (const p of pts) {
      const r = 6 + Math.round((p.weight ?? 0.5) * 8);
      const color = p.peak ? "#b3261e" : "#FF66C4";
      const m = L.circleMarker([p.lat, p.lng], {
        radius: r,
        color: "#fff",
        weight: 1,
        fillColor: color,
        fillOpacity: 0.85,
      });
      m.bindPopup(`<div class="map-popup"><b>${p.label}</b>${p.html ? `<br/>${p.html}` : ""}</div>`);
      group.addLayer(m);
    }
    group.addTo(map);
    layerRef.current = group;

    try {
      const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: pts.length === 1 ? 11 : 9 });
    } catch {
      /* ignore */
    }
  }, [points]);

  return <div className="mapwrap" style={{ height }} ref={elRef} />;
}
