import { APPS } from '../apps'
import { IconArrow } from '../icons'

export default function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="dash scroll">
      <div className="dash-hero">
        <div className="eyebrow">BirdsEyeView Product Sandbox</div>
        <h1>Open and test the latest products in one place.</h1>
        <div className="rule" />
        <p>
          Every BirdsEyeView product, ready to run from a single login. Choose a product
          below or from the rail on the left.
        </p>
      </div>

      <div className="tile-grid">
        {APPS.map((app) => {
          const ready = app.url !== ''
          return (
            <div
              key={app.id}
              className={'tile' + (ready ? '' : ' soon')}
              onClick={() => ready && onOpen(app.id)}
            >
              <div className="tile-glow" />
              <div className="tile-head">
                <span className="tile-ic">{app.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="num">{app.number}</div>
                  <h3>{app.title}</h3>
                </div>
                {!ready && <span className="badge-soon">SOON</span>}
              </div>
              <p>{app.tagline}</p>
              <div className="tile-cta">
                {ready ? (
                  <>
                    Open product
                    <IconArrow size={15} />
                  </>
                ) : (
                  'In build'
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
