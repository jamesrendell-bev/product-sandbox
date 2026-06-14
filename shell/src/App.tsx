import { useState } from 'react'
import { APPS } from './apps'
import Login from './components/Login'
import NavRail from './components/NavRail'
import Dashboard from './components/Dashboard'
import AppFrame from './components/AppFrame'

export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('bev.sandbox.unlocked') === '1'
  )
  const [current, setCurrent] = useState('dashboard')

  if (!unlocked) {
    return <Login onUnlock={() => setUnlocked(true)} />
  }

  const activeApp = APPS.find((a) => a.id === current) ?? null
  const hereLabel = current === 'dashboard' ? 'Dashboard' : activeApp?.title ?? ''

  function logout() {
    sessionStorage.removeItem('bev.sandbox.unlocked')
    setUnlocked(false)
    setCurrent('dashboard')
  }

  return (
    <div className="shell">
      <NavRail current={current} onSelect={setCurrent} onLogout={logout} />
      <main className="main">
        <div className="topbar">
          <div className="crumb">
            <span>Product Sandbox</span>
            <span className="sep">&rsaquo;</span>
            <span className="here">{hereLabel}</span>
          </div>
          <div className="user">
            <div className="who">
              <div className="n">BirdsEyeView</div>
              <div className="e">Product Sandbox</div>
            </div>
            <div className="avatar">BEV</div>
          </div>
        </div>

        <div className="content" style={activeApp ? { overflow: 'hidden' } : undefined}>
          {current === 'dashboard' ? (
            <Dashboard onOpen={setCurrent} />
          ) : activeApp ? (
            <AppFrame app={activeApp} />
          ) : null}
        </div>
      </main>
    </div>
  )
}
