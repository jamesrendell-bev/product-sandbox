// src/ui/RoadmapPanel.tsx
// Renders the exact data-flow & build-status chart (public/roadmap.html),
// pixel-identical to the standalone version. Auto-sizes to content height.

import { useRef } from "react";

export function RoadmapPanel() {
  const ref = useRef<HTMLIFrameElement>(null);
  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <iframe
        ref={ref}
        src={`${import.meta.env.BASE_URL}roadmap.html`}
        title="CERA® MGA data flow & build status"
        style={{ width: "100%", height: 2400, border: "none", display: "block", background: "#f5f6f8" }}
        onLoad={() => {
          const f = ref.current;
          const doc = f?.contentWindow?.document;
          if (f && doc) f.style.height = doc.documentElement.scrollHeight + 24 + "px";
        }}
      />
    </div>
  );
}
