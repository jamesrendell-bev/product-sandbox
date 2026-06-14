// src/ui/SandboxHome.tsx
// The BirdsEyeView Product Sandbox directory — the umbrella landing that lists
// the products hosted here. Each product is a self-contained module; the NatCat
// pricing app is the first. Add new products to the SANDBOX_PRODUCTS array.

import { ArrowRight, ShieldCheck, Layers, LineChart, Radar, type LucideIcon } from "lucide-react";

export type ProductStatus = "live" | "dev" | "planned";

export interface SandboxProduct {
  id: string;
  name: string;
  tagline: string;
  status: ProductStatus;
  icon: LucideIcon;
  enterable: boolean;
}

export const SANDBOX_PRODUCTS: SandboxProduct[] = [
  {
    id: "natcat",
    name: "Property NatCat Pricing",
    tagline: "Underwrite a property risk end to end. Triage against appetite, per-peril and total expected loss, terms, a capital-aware price and a referral, for a single risk or a whole bordereau.",
    status: "live",
    icon: ShieldCheck,
    enterable: true,
  },
  {
    id: "exposure",
    name: "Exposure Management",
    tagline: "Aggregate an in-force book by peril and Cresta zone, watch accumulation and PML build, and stress the portfolio against catalogue events.",
    status: "dev",
    icon: Layers,
    enterable: false,
  },
  {
    id: "rate-adequacy",
    name: "Portfolio Rate Adequacy",
    tagline: "Compare charged rates against technical rates across a whole book to surface under-priced segments before renewal.",
    status: "planned",
    icon: LineChart,
    enterable: false,
  },
  {
    id: "event-response",
    name: "Live Event Response",
    tagline: "Track an unfolding NatCat event against your exposure and estimate gross loss in near-real time.",
    status: "planned",
    icon: Radar,
    enterable: false,
  },
];

const STATUS_LABEL: Record<ProductStatus, string> = {
  live: "Live now",
  dev: "In development",
  planned: "Planned",
};
const STATUS_REL: Record<ProductStatus, string> = {
  live: "Excellent",
  dev: "High",
  planned: "Medium",
};

export function SandboxHome({ onEnter }: { onEnter: (id: string) => void }) {
  return (
    <>
      <header className="bevhero">
        <div className="inner">
          <img className="lockup" src={`${import.meta.env.BASE_URL}brand/bev-esa-lockup-dark.png`} alt="Developed in partnership with the European Space Agency" />
          <span className="eyebrow">BirdsEyeView · Product Sandbox</span>
          <h1 className="h-rule">The CERA® tools for pricing and managing catastrophe risk.</h1>
          <p>
            Each product runs on BirdsEyeView hazard data, developed with the European Space Agency. Open one below to run it on your own risks.
          </p>
        </div>
      </header>

      <div className="contentwrap">
        <div className="pagehead" style={{ marginTop: 26 }}>
          <span className="eyebrow">Products</span>
          <h2 className="h-rule" style={{ fontSize: 22, fontWeight: 600 }}>What you can try today</h2>
        </div>

        <div className="product-grid">
          {SANDBOX_PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                className={`bevcard product-card ${p.enterable ? "" : "is-disabled"}`}
                onClick={() => p.enterable && onEnter(p.id)}
                disabled={!p.enterable}
                aria-disabled={!p.enterable}
              >
                <div className="pc-top">
                  <span className="pc-icon"><Icon size={22} strokeWidth={1.75} /></span>
                  <span className={`rel ${STATUS_REL[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="pc-name">{p.name}</div>
                <div className="pc-tag">{p.tagline}</div>
                <div className="pc-cta">
                  {p.enterable ? (
                    <span className="pc-open">Open <ArrowRight size={15} /></span>
                  ) : (
                    <span className="pc-soon">Coming soon</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="note" style={{ marginTop: 8 }}>
          More CERA® products will appear here as they are ready.
        </div>
      </div>
    </>
  );
}
