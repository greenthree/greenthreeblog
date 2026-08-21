import { useState } from 'react'
import { Activity, X } from 'lucide-react'

export function HudDock({ representation, setRepresentation, copy }) {
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <button
        type="button"
        className="hud-pill mono"
        onClick={() => setExpanded(true)}
        aria-expanded="false"
        aria-label={copy.openTelemetry}
      >
        <span className="hud-dot" />
        <Activity size={12} aria-hidden="true" />
        <span>60 FPS</span>
      </button>
    )
  }

  return (
    <aside className="hud-dock" aria-label={copy.renderTelemetry}>
      <div className="hud-head">
        <span className="hud-dot" /> {copy.renderCore}
        <button
          type="button"
          className="hud-close"
          onClick={() => setExpanded(false)}
          aria-label={copy.closeTelemetry}
        >
          <X size={10} aria-hidden="true" />
        </button>
      </div>
      <div className="hud-stats">
        <div>
          <span className="mono">FPS</span>
          <strong>60</strong>
        </div>
        <div>
          <span className="mono">GPU</span>
          <strong>42%</strong>
        </div>
        <div>
          <span className="mono">DT</span>
          <strong>0.016</strong>
        </div>
      </div>
      <div className="hud-toggle">
        <span className="mono">{copy.representation}</span>
        <button
          onClick={() => setRepresentation(representation === 'SCHR' ? 'HEIS' : 'SCHR')}
          aria-label={copy.representation}
        >
          <span className={representation === 'SCHR' ? 'active' : ''}>SCHR</span>
          <span className={representation === 'HEIS' ? 'active' : ''}>HEIS</span>
        </button>
      </div>
    </aside>
  )
}
