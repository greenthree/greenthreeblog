import { AtlasHeader } from './AtlasHeader.jsx'

export function AtlasPage({ locale, activeView, copy, onLocaleChange, onNavigate, children }) {
  return (
    <div className={`app-shell atlas-shell locale-${locale}`}>
      <div className="ambient-grid" aria-hidden="true" />
      <AtlasHeader
        locale={locale}
        onLocaleChange={onLocaleChange}
        copy={copy}
        activeView={activeView}
        onNavigate={onNavigate}
      />
      <main className="atlas-main">{children}</main>
      <footer className="atlas-footer mono">
        <span>ψ(x,t) // QUANTUM_CORE</span>
        <span>{copy.nominal}</span>
      </footer>
    </div>
  )
}
