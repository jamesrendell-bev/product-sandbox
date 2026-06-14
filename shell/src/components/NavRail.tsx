import { APPS } from '../apps'
import { IconGrid, IconInfo, IconLogout } from '../icons'

type Props = {
  current: string // 'dashboard' or an app id
  onSelect: (id: string) => void
  onLogout: () => void
}

export default function NavRail({ current, onSelect, onLogout }: Props) {
  return (
    <aside className="rail">
      <div className="rail-logo">
        <img src="/brand/bev-logo-dark.jpg" alt="BirdsEyeView" />
        <div className="eyebrow">C E R A&reg;</div>
      </div>

      <nav className="rail-nav">
        <div
          className={'nav-item' + (current === 'dashboard' ? ' active' : '')}
          onClick={() => onSelect('dashboard')}
        >
          <span className="ic">
            <IconGrid size={18} />
          </span>
          <span className="label">Dashboard</span>
        </div>

        <div className="rail-section">Products</div>
        {APPS.map((app) => {
          const ready = app.url !== ''
          return (
            <div
              key={app.id}
              className={
                'nav-item' +
                (current === app.id ? ' active' : '') +
                (ready ? '' : ' disabled')
              }
              onClick={() => ready && onSelect(app.id)}
            >
              <span className="ic">{app.icon}</span>
              <span className="label">{app.label}</span>
              {!ready && <span className="pill-beta">SOON</span>}
            </div>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div className="rail-foot">
        <div className="foot-item" onClick={() => onSelect('dashboard')}>
          <IconInfo size={18} />
          <span>Information Hub</span>
        </div>
        <div className="foot-item logout" onClick={onLogout}>
          <IconLogout size={18} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  )
}
