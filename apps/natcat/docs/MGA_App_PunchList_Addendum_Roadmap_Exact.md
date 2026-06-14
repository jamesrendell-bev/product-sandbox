# Punch-List Addendum — §12 REVISED: use the exact roadmap HTML

*Supersedes §12 of `MGA_App_PunchList_Addendum_Navigation.md`. The Roadmap tab must render the original `CERA_MGA_DataFlow_Chart.html` exactly as designed — do not rebuild it as React markup.*

## Steps

1. A file named **`roadmap.html`** has been provided — copy it into **`public/roadmap.html`**. It is fully self-contained (own styles, print-ready). Do not modify its content.
2. Replace the entire contents of `src/ui/RoadmapPanel.tsx` with the iframe wrapper below — it renders the exact HTML and auto-sizes to its height (same-origin, so this is allowed):

```tsx
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
        src="/roadmap.html"
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
```

3. If a React-built version of RoadmapPanel already exists from the earlier §12, delete that markup — this iframe version replaces it entirely.

**Accept:** the Roadmap & Methodology tab shows the chart byte-identical to the standalone `CERA_MGA_DataFlow_Chart.html` (navy header bar, legend chips, nine colour-coded stages, decision branch, footer), with no double scrollbar and no clipping at the bottom.

*Optional, only if James asks later: the embedded copy could have its internal BIRDSEYEVIEW header stripped to avoid doubling with the app's own header — but the default is exact, untouched HTML.*
