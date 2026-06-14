import type { SandboxApp } from '../apps'
import { IconExposure } from '../icons'

export default function AppFrame({ app }: { app: SandboxApp }) {
  if (app.url === '') {
    return (
      <div className="frame-empty">
        <div className="empty-card">
          <span className="ic">
            <IconExposure size={26} />
          </span>
          <h2>{app.title}</h2>
          <p>{app.tagline}</p>
          <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>
            This product is being built. It will open here the moment it is ready.
          </p>
        </div>
      </div>
    )
  }

  // Tell the embedded app to drop its own chrome (belt and braces alongside
  // the app's own iframe detection).
  const src = app.url + (app.url.includes("?") ? "&" : "?") + "embed=1"

  return (
    <div className="frame-wrap">
      <iframe
        className="frame"
        src={src}
        title={app.title}
        allow="clipboard-read; clipboard-write; geolocation"
      />
    </div>
  )
}
