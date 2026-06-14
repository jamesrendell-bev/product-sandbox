import { useState } from 'react'
import { IconLock, IconArrow } from '../icons'

// Shared passcode gate. Set VITE_SANDBOX_PASSCODE at build time; the default
// below is a placeholder to change before sharing the link.
const PASSCODE = import.meta.env.VITE_SANDBOX_PASSCODE ?? 'birdseye'

export default function Login({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim() === PASSCODE) {
      sessionStorage.setItem('bev.sandbox.unlocked', '1')
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <div className="login-stage">
      {/* Moving earth background. Drop earth.mp4 (and optional earth.jpg poster)
          into public/brand/. Falls back to the navy canvas if absent. */}
      <video
        className="login-bg"
        autoPlay
        muted
        loop
        playsInline
        poster="/brand/earth.jpg"
      >
        <source src="/brand/earth.mp4" type="video/mp4" />
        <source src="/brand/earth.webm" type="video/webm" />
      </video>
      <div className="login-veil" />

      <img
        className="login-esa"
        src="/brand/bev-esa-lockup-dark.png"
        alt="Developed in partnership with the European Space Agency"
      />

      <div className="login-grid">
        <div className="login-hero">
          <img className="login-logo" src="/brand/bev-logo-trim.png" alt="BirdsEyeView" />
          <h1>
            See risk <span className="pink">clearly</span>
          </h1>
          <div className="login-rule" />
        </div>

        <div className="login-panel">
          <form className="login-card" onSubmit={submit}>
            <div className="eyebrow">CERA® Product Sandbox</div>
            <h2>Sign in to continue</h2>
            <p className="sub">Enter your access code to open the suite.</p>
            <div className="field">
              <span style={{ color: 'var(--text-faint)', display: 'grid', placeItems: 'center' }}>
                <IconLock size={18} />
              </span>
              <input
                type="password"
                placeholder="Access code"
                value={value}
                autoFocus
                onChange={(e) => {
                  setValue(e.target.value)
                  if (error) setError(false)
                }}
              />
            </div>
            {error && <div className="login-err">That code is not recognised. Try again.</div>}
            <div style={{ marginTop: 18 }}>
              <button className="btn" type="submit">
                Enter sandbox
                <IconArrow size={16} />
              </button>
            </div>
            <div className="login-foot">
              Access is shared by BirdsEyeView. For a code, contact info@birdseyeview.ai.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
