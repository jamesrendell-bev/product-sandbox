import type { ReactNode } from 'react'
import { IconPricing, IconWeather, IconConvert, IconExposure } from './icons'

export type SandboxApp = {
  id: string
  label: string // sidebar label
  title: string // dashboard / breadcrumb title
  number: string
  tagline: string
  icon: ReactNode
  /** Live URL the shell embeds. Empty string means not ready yet. */
  url: string
}

// App URLs come from build-time env so the same shell runs locally and in
// production. Locally they point at each app's dev server; in production
// set VITE_URL_* to the deployed address (Netlify or GitLab Pages).
const env = import.meta.env

export const APPS: SandboxApp[] = [
  {
    id: 'natcat',
    label: 'Property NatCat Pricing',
    title: 'Property NatCat Pricing',
    number: '01',
    tagline:
      'Price a property submission end to end across tropical cyclone, flood, wildfire and earthquake. Triage, average annual loss, terms and a capital-aware price in one pass.',
    icon: <IconPricing />,
    url: env.VITE_URL_NATCAT ?? 'http://localhost:5174',
  },
  {
    id: 'contingency',
    label: 'Contingency Weather v2',
    title: 'Contingency Weather',
    number: '02',
    tagline:
      'Weather risk triage for event and conference cancellation. One venue, the event dates and an indoor or outdoor call return the chance each peril breaches its threshold.',
    icon: <IconWeather />,
    url: env.VITE_URL_CONTINGENCY ?? 'http://localhost:5180',
  },
  {
    id: 'edmcede',
    label: 'EDM & CEDE Converter',
    title: 'EDM & CEDE Converter',
    number: '03',
    tagline:
      'Turn a broker exposure schedule into an RMS EDM file and a Verisk CEDE file from one canonical record, with occupancy and construction classified to the CERA® taxonomy.',
    icon: <IconConvert />,
    url: env.VITE_URL_EDMCEDE ?? 'http://localhost:8893',
  },
  {
    id: 'exposure',
    label: 'Exposure Analysis',
    title: 'Exposure Analysis',
    number: '04',
    tagline:
      'Find where insured value concentrates. Set a search radius and reveal the geographic clusters driving accumulation across the portfolio.',
    icon: <IconExposure />,
    url: env.VITE_URL_EXPOSURE ?? '',
  },
]
