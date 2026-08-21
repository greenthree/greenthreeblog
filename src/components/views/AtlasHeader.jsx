import { ArrowLeft } from 'lucide-react'
import { ATLAS_COPY } from '../../constants/copy.js'
import { LanguageSwitch } from '../common/LanguageSwitch.jsx'

export function AtlasHeader({ locale, onLocaleChange, copy, activeView, onNavigate }) {
  const handleNavClick = (e, view) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onNavigate(view)
  }

  return (
    <header className="topbar atlas-topbar">
      <a
        className="brand"
        href="./"
        onClick={e => handleNavClick(e, null)}
      >
        <span className="brand-symbol">ψ</span>
        <span>greenthree</span>
        <em>blog</em>
        <small>// QUANTUM_CORE</small>
      </a>
      <nav className="main-nav">
        <a
          href="./#quantum"
          onClick={e => handleNavClick(e, null)}
        >
          {copy.nav.quantum}
        </a>
        <a
          className={activeView === 'articles' ? 'active' : ''}
          href="?view=articles"
          onClick={e => handleNavClick(e, 'articles')}
        >
          {copy.nav.notebook}
        </a>
        <a
          className={activeView === 'topics' ? 'active' : ''}
          href="?view=topics"
          onClick={e => handleNavClick(e, 'topics')}
        >
          {copy.nav.topics}
        </a>
        <a
          className={activeView === 'resources' ? 'active' : ''}
          href="?view=resources"
          onClick={e => handleNavClick(e, 'resources')}
        >
          {copy.nav.resources}
        </a>
      </nav>
      <div className="top-actions">
        <LanguageSwitch
          locale={locale}
          onChange={onLocaleChange}
          label={copy.languageControl}
        />
        <a
          className="icon-button"
          href="./"
          onClick={e => handleNavClick(e, null)}
          aria-label={ATLAS_COPY[locale].back}
        >
          <ArrowLeft size={16} />
        </a>
      </div>
    </header>
  )
}
