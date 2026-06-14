// Single-weight line icons, ~1.75px stroke, currentColor — per the BEV icon spec.
import type { ReactNode } from 'react'

type IconProps = { size?: number; children: ReactNode }

function Icon({ size = 18, children }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const IconGrid = (p: { size?: number }) => (
  <Icon size={p.size}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </Icon>
)

// Property NatCat Pricing — building with a pin
export const IconPricing = (p: { size?: number }) => (
  <Icon size={p.size}>
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9h.01M9 12h.01M9 15h.01" />
  </Icon>
)

// Contingency Weather — cloud + drop
export const IconWeather = (p: { size?: number }) => (
  <Icon size={p.size}>
    <path d="M4 14.5A4 4 0 0 1 8 11h.5A5.5 5.5 0 0 1 19 9a3.5 3.5 0 0 1 .5 7H8a4 4 0 0 1-4-1.5Z" />
    <path d="M8 19v2M12 19v2M16 19v2" />
  </Icon>
)

// EDM & CEDE Converter — file transform
export const IconConvert = (p: { size?: number }) => (
  <Icon size={p.size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 13l2-2M9 13l2 2M15 17H9M15 17l-2-2M15 17l-2 2" />
  </Icon>
)

// Exposure Analysis — accumulation pin
export const IconExposure = (p: { size?: number }) => (
  <Icon size={p.size}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
)

export const IconInfo = (p: { size?: number }) => (
  <Icon size={p.size}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Icon>
)

export const IconLogout = (p: { size?: number }) => (
  <Icon size={p.size}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </Icon>
)

export const IconArrow = (p: { size?: number }) => (
  <Icon size={p.size}>
    <line x1="5" x2="19" y1="12" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
)

export const IconLock = (p: { size?: number }) => (
  <Icon size={p.size}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
)
