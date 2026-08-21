export function PanelTitle({ icon, title, meta, tone = 'cyan' }) {
  return (
    <div className="panel-title">
      <span className={`panel-icon ${tone}`}>{icon}</span>
      <span className="panel-title-text">{title}</span>
      <span className="panel-meta mono">{meta}</span>
    </div>
  )
}
