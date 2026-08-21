import { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react'
import {
  Activity,
  Atom,
  ChevronRight,
  Compass,
  Eye,
  Hand,
  LoaderCircle,
  Menu,
  X
} from 'lucide-react'
import { UI_COPY, ATLAS_COPY } from './constants/copy.js'
import {
  buildArticleCatalog,
  createTopicCatalog,
  localizeArticle
} from './utils/markdown.js'
import { formatComplex, decodeHashPart } from './utils/format.js'
import { useArticleViews } from './api/supabase.js'
import { PanelTitle } from './components/common/PanelTitle.jsx'
import { LanguageSwitch } from './components/common/LanguageSwitch.jsx'
import { HudDock } from './components/common/HudDock.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'
import { BlochSphere } from './components/canvas/BlochSphere.jsx'
import { WaveCanvas } from './components/canvas/WaveCanvas.jsx'
import { MathFormula } from './components/reader/MathFormula.jsx'
import { ArticleArchive } from './components/views/ArticleArchive.jsx'
import { ArticleAtlas } from './components/views/ArticleAtlas.jsx'
import { TopicAtlas } from './components/views/TopicAtlas.jsx'
import { ResourceAtlas } from './components/views/ResourceAtlas.jsx'

// Lazy load ArticleReader modal to keep the main bundle lighter
const ArticleReader = lazy(() =>
  import('./components/reader/ArticleReader.jsx').then(module => ({
    default: module.ArticleReader
  }))
)

const articleModules = import.meta.glob('./content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})
const articles = buildArticleCatalog(articleModules)
const topicCatalog = createTopicCatalog(articles)

function initialLocale() {
  try {
    const saved = window.localStorage.getItem('greenthree-locale')
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    // Storage can be unavailable in privacy-restricted contexts
  }
  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function getViewFromUrl() {
  return new URLSearchParams(window.location.search).get('view') || null
}

function articleFromHash() {
  const match = window.location.hash.match(/^#article\/([^/]+)$/)
  if (!match) return null
  return articles.find(article => article.id === decodeHashPart(match[1])) || null
}

function scrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function App() {
  const [view, setView] = useState(getViewFromUrl)
  const [locale, setLocale] = useState(initialLocale)
  const [phase, setPhase] = useState(42)
  const [representation, setRepresentation] = useState('SCHR')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(() => articleFromHash())
  const articleTriggerRef = useRef(null)
  const menuRef = useRef(null)
  const menuCloseRef = useRef(null)
  const menuTriggerRef = useRef(null)
  const topicModalRef = useRef(null)
  const topicCloseRef = useRef(null)
  const topicTriggerRef = useRef(null)

  const articleIds = useMemo(() => articles.map(article => article.id), [])
  const [articleViews, incrementArticleView] = useArticleViews(articleIds)
  const articleMap = useMemo(() => new Map(articles.map(article => [article.id, article])), [])

  const localizedArticles = useMemo(
    () =>
      articles.map(article => ({
        ...localizeArticle(article, locale),
        view: articleViews[article.id]
      })),
    [articleViews, locale]
  )

  const homepageArticles = useMemo(
    () =>
      localizedArticles
        .map((article, sourceIndex) => ({ article, sourceIndex }))
        .sort((a, b) => {
          const aViews = a.article.view?.status === 'ready' ? a.article.view.count : -1
          const bViews = b.article.view?.status === 'ready' ? b.article.view.count : -1
          return bViews - aViews || a.sourceIndex - b.sourceIndex
        })
        .map(entry => entry.article),
    [localizedArticles]
  )

  const visibleTopics = useMemo(
    () =>
      topicCatalog
        .map((topic, sourceIndex) => {
          const topicViews = topic.articleIds.map(articleId => articleViews[articleId])
          const countsReady = topicViews.every(
            viewState => viewState?.status === 'ready' && Number.isFinite(viewState.count)
          )
          return {
            ...topic,
            sourceIndex,
            totalClicks: countsReady
              ? topicViews.reduce((sum, viewState) => sum + viewState.count, 0)
              : null
          }
        })
        .filter(topic => topic.visibleIn[locale])
        .sort((a, b) => (b.totalClicks ?? -1) - (a.totalClicks ?? -1) || a.sourceIndex - b.sourceIndex),
    [articleViews, locale]
  )

  const localizedSelectedArticle = selectedArticle
    ? { ...localizeArticle(selectedArticle, locale), view: articleViews[selectedArticle.id] }
    : null
  const selectedTopicEntry = selectedTopic
    ? topicCatalog.find(topic => topic.id === selectedTopic)
    : null
  const copy = UI_COPY[locale]

  // Count every article opened through the UI, a shared hash, or a refresh.
  // The session-level guard in useArticleViews deduplicates repeated reads.
  useEffect(() => {
    if (selectedArticle?.id) incrementArticleView(selectedArticle.id)
  }, [incrementArticleView, selectedArticle?.id])

  useEffect(() => {
    const active = menuOpen || Boolean(selectedTopic)
    if (!active) return undefined

    const container = menuOpen ? menuRef.current : topicModalRef.current
    const initialFocus = menuOpen ? menuCloseRef.current : topicCloseRef.current
    const restoreTarget = menuOpen ? menuTriggerRef.current : topicTriggerRef.current
    const close = menuOpen ? () => setMenuOpen(false) : () => setSelectedTopic(null)
    const previousOverflow = document.body.style.overflow

    const getFocusable = () => [...(container?.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || [])]
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => initialFocus?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      requestAnimationFrame(() => restoreTarget?.focus({ preventScroll: true }))
    }
  }, [menuOpen, selectedTopic])

  // Listen to browser Back/Forward (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      setView(getViewFromUrl())
      const match = window.location.hash.match(/^#article\/([^/]+)$/)
      setSelectedArticle(match ? articleMap.get(decodeHashPart(match[1])) || null : null)
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [articleMap])

  // Sync document title and html lang
  useEffect(() => {
    const documentLanguage = locale === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.lang = documentLanguage
    document.documentElement.dataset.locale = locale
    const atlasTitle = view && ATLAS_COPY[locale][view]?.title
    const articleTitle = localizedSelectedArticle?.title
    document.title = articleTitle
      ? `${articleTitle} — greenthree blog`
      : atlasTitle
      ? `${atlasTitle} — greenthree blog`
      : locale === 'zh'
      ? 'greenthree blog — 让物理可见'
      : 'greenthree blog — physics, made visible'
    const metaDescription = document.querySelector('meta[name="description"]')
    const shareTitle = document.querySelector('meta[property="og:title"]')
    const shareDescription = document.querySelector('meta[property="og:description"]')
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    const shareUrl = document.querySelector('meta[property="og:url"]')
    const currentTitle = document.title
    const description = localizedSelectedArticle?.excerpt || copy.metaDescription
    metaDescription?.setAttribute('content', description)
    shareTitle?.setAttribute('content', currentTitle)
    shareDescription?.setAttribute('content', description)
    twitterTitle?.setAttribute('content', currentTitle)
    twitterDescription?.setAttribute('content', description)
    shareUrl?.setAttribute('content', window.location.href)
    try {
      window.localStorage.setItem('greenthree-locale', locale)
    } catch {
      /* storage is optional */
    }
  }, [copy, locale, localizedSelectedArticle, view])

  // Navigation handler within SPA
  const handleNavigate = useCallback(targetView => {
    setView(targetView)
    setMenuOpen(false)
    const base = window.location.pathname
    if (targetView) {
      window.history.pushState(null, '', `${base}?view=${targetView}`)
    } else {
      window.history.pushState(null, '', base)
    }
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  }, [])

  const openArticle = useCallback(article => {
    articleTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setSelectedArticle(articleMap.get(article.id) || article)
    window.location.hash = `article/${encodeURIComponent(article.id)}`
  }, [articleMap])

  const closeArticle = useCallback(() => {
    setSelectedArticle(null)
    const newHash = view ? '' : '#articles'
    const newUrl = `${window.location.pathname}${window.location.search}${newHash}`
    window.history.replaceState(null, '', newUrl)
    window.setTimeout(() => {
      articleTriggerRef.current?.focus({ preventScroll: true })
      if (!view) {
        document.getElementById('articles')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
      }
      articleTriggerRef.current = null
    }, 0)
  }, [view])

  const articleReaderModal = localizedSelectedArticle && (
    <Suspense
      fallback={
        <div className="article-modal article-loading" role="status" aria-live="polite">
          <div className="article-loading-card">
            <LoaderCircle size={18} className="article-loading-icon" aria-hidden="true" />
            <span>{copy.loadingArticle}</span>
          </div>
        </div>
      }
    >
      <ArticleReader
        article={localizedSelectedArticle}
        onClose={closeArticle}
        copy={copy}
        locale={locale}
        onLocaleChange={setLocale}
      />
    </Suspense>
  )

  if (view === 'articles') {
    return (
      <ErrorBoundary copy={copy}>
        <ArticleAtlas
          locale={locale}
          items={localizedArticles}
          onOpen={openArticle}
          copy={copy}
          onLocaleChange={setLocale}
          onNavigate={handleNavigate}
        />
        {articleReaderModal}
      </ErrorBoundary>
    )
  }

  if (view === 'topics') {
    return (
      <ErrorBoundary copy={copy}>
        <TopicAtlas
          locale={locale}
          items={localizedArticles}
          topics={topicCatalog}
          onOpen={openArticle}
          copy={copy}
          onLocaleChange={setLocale}
          onNavigate={handleNavigate}
        />
        {articleReaderModal}
      </ErrorBoundary>
    )
  }

  if (view === 'resources') {
    return (
      <ErrorBoundary copy={copy}>
        <ResourceAtlas
          locale={locale}
          copy={copy}
          onLocaleChange={setLocale}
          onNavigate={handleNavigate}
        />
        {articleReaderModal}
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary copy={copy}>
      <div className={`app-shell locale-${locale} representation-${representation.toLowerCase()}`}>
        <div className="ambient-grid" aria-hidden="true" />
        <header id="top" className="topbar">
          <a
            className="brand"
            href="#top"
            onClick={e => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="brand-symbol">ψ</span>
            <span>greenthree</span>
            <em>blog</em>
            <small>// QUANTUM_CORE</small>
          </a>
          <nav className="main-nav">
            <a className="active" href="#quantum">
              {copy.nav.quantum}
            </a>
            <a
              href="?view=articles"
              onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                handleNavigate('articles')
              }}
            >
              {copy.nav.notebook}
            </a>
            <a
              href="?view=topics"
              onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                handleNavigate('topics')
              }}
            >
              {copy.nav.topics}
            </a>
            <a
              href="?view=resources"
              onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                handleNavigate('resources')
              }}
            >
              {copy.nav.resources}
            </a>
          </nav>
          <div className="top-actions">
            <LanguageSwitch locale={locale} onChange={setLocale} label={copy.languageControl} />
            <span className="mono">SYS.08 / 24</span>
            <button
              type="button"
              className="icon-button menu-trigger"
              onClick={event => {
                menuTriggerRef.current = event.currentTarget
                setMenuOpen(true)
              }}
              aria-label={copy.openMenu}
            >
              <Menu size={16} />
            </button>
          </div>
        </header>

        <main className="content-grid">
          <div className="primary-column">
            <section id="quantum" className="hero-grid">
              <div className="panel bloch-card">
                <PanelTitle
                  icon={<Atom size={14} />}
                  title={copy.stateVector}
                  meta={
                    <span className="interactive-meta">
                      <Hand size={11} /> {copy.interactive}
                    </span>
                  }
                  tone="cyan"
                />
                <div className="bloch-stage">
                  <BlochSphere
                    phase={phase}
                    onPhase={setPhase}
                    ariaLabel={copy.blochLabel}
                    paused={Boolean(selectedArticle || menuOpen || selectedTopic)}
                  />
                  <div className="axis-note mono">
                    α ={' '}
                    {formatComplex(
                      Math.cos((phase * Math.PI) / 180),
                      Math.sin((phase * Math.PI) / 180)
                    )}
                  </div>
                </div>
                <div className="state-row">
                  <button type="button" className="state-button">
                    {copy.state} |0⟩
                  </button>
                  <span className="mono">θ {phase}° / φ 0.82π</span>
                  <button type="button" className="state-button">
                    {copy.state} |1⟩
                  </button>
                </div>
              </div>
              <div className="panel hero-copy" lang={locale === 'zh' ? 'zh-CN' : 'en'}>
                <span className="mono eyebrow">{copy.physicsBlog}</span>
                <h1>
                  {copy.hero.line1}
                  <br />
                  <span>{copy.hero.accent}</span> {copy.hero.joiner}
                  <br />
                  {copy.hero.line3}
                  <br />
                  {copy.hero.line4}
                </h1>
                <p>{copy.heroDescription}</p>
                <a
                  className="primary-button"
                  href="?view=articles"
                  onClick={e => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                    e.preventDefault()
                    handleNavigate('articles')
                  }}
                >
                  {copy.explore} <ChevronRight size={15} />
                </a>
              </div>
            </section>
            <ArticleArchive items={homepageArticles} onOpen={openArticle} copy={copy} />
          </div>

          <aside className="sidebar">
            <section className="panel wave-card">
              <PanelTitle
                icon={<Activity size={14} />}
                title={copy.wave}
                meta="ψ(x,t)"
                tone="cyan"
              />
              <WaveCanvas
                ariaLabel={copy.waveLabel}
                amplitudeLabel={copy.amplitudeLabel}
                paused={Boolean(selectedArticle || menuOpen || selectedTopic)}
              />
              <div className="wave-formula mono">
                <MathFormula expression={String.raw`\int \lvert\psi(x, t)\rvert^2\,\mathrm{d}x = 1`} />
              </div>
              <p>{copy.waveDescription}</p>
            </section>

            <section id="topics" className="panel topics-card">
              <PanelTitle
                icon={<Compass size={14} />}
                title={copy.topics}
                meta={`${String(visibleTopics.length).padStart(2, '0')} / LIVE`}
                tone="violet"
              />
              <div className="topic-list">
                {visibleTopics.map(topic => {
                  const ready = topic.totalClicks != null
                  const clickValue = ready ? topic.totalClicks.toLocaleString('en-US') : '---'
                  return (
                    <button
                      type="button"
                      key={topic.id}
                      onClick={event => {
                        topicTriggerRef.current = event.currentTarget
                        setSelectedTopic(topic.id)
                      }}
                    >
                      <span className="topic-name">{topic[locale]}</span>
                      <span
                        className="topic-score mono"
                        data-state={ready ? 'ready' : 'loading'}
                        aria-label={ready ? `${clickValue} ${copy.views}` : copy.viewsLoading}
                        aria-busy={!ready}
                      >
                        <Eye className="topic-eye" size={11} aria-hidden="true" />
                        <span>{clickValue}</span>
                        <ChevronRight className="topic-chevron" size={12} aria-hidden="true" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section id="resources" className="sidebar-footer panel">
              <div>
                <span className="mono">{copy.footer}</span>
                <p>{copy.about}</p>
              </div>
              <div>
                <span className="mono">{copy.social}</span>
                <a href="https://github.com/greenthree" target="_blank" rel="noreferrer">
                  GitHub <ChevronRight size={12} />
                </a>
                <a href="mailto:hello@greenthree.blog">
                  {copy.contact} <ChevronRight size={12} />
                </a>
              </div>
              <div className="footer-atom">
                <Atom size={34} />
              </div>
            </section>
          </aside>
        </main>

        <HudDock
          representation={representation}
          setRepresentation={setRepresentation}
          copy={copy}
        />
        <footer className="bottom-line mono">
          <span>ψ(x,t) // QUANTUM_CORE</span>
          <span>{copy.nominal}</span>
        </footer>

        {menuOpen && (
          <div
            ref={menuRef}
            className="menu-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={copy.openMenu}
          >
            <div className="menu-overlay-head">
              <a
                className="brand"
                href="#top"
                onClick={e => {
                  e.preventDefault()
                  setMenuOpen(false)
                  window.scrollTo({ top: 0, behavior: scrollBehavior() })
                }}
              >
                <span className="brand-symbol">ψ</span>
                <span>greenthree</span>
                <em>blog</em>
              </a>
              <div className="menu-overlay-actions">
                <LanguageSwitch locale={locale} onChange={setLocale} label={copy.languageControl} />
                <button
                  ref={menuCloseRef}
                  type="button"
                  className="icon-button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={copy.closeMenu}
                >
                  <X size={17} />
                </button>
              </div>
            </div>
            <nav>
              <a
                href="#quantum"
                onClick={e => {
                  e.preventDefault()
                  handleNavigate(null)
                }}
              >
                {copy.nav.quantum} <ChevronRight size={20} />
              </a>
              <a
                href="?view=articles"
                onClick={e => {
                  e.preventDefault()
                  handleNavigate('articles')
                }}
              >
                {copy.nav.notebook} <ChevronRight size={20} />
              </a>
              <a
                href="?view=topics"
                onClick={e => {
                  e.preventDefault()
                  handleNavigate('topics')
                }}
              >
                {copy.nav.topics} <ChevronRight size={20} />
              </a>
              <a
                href="?view=resources"
                onClick={e => {
                  e.preventDefault()
                  handleNavigate('resources')
                }}
              >
                {copy.nav.resources} <ChevronRight size={20} />
              </a>
            </nav>
            <span className="mono menu-overlay-foot">
              SYS.08 / 24 <span>{copy.stateOnline}</span>
            </span>
          </div>
        )}

        {selectedTopicEntry && (
          <div
            ref={topicModalRef}
            className="topic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-dialog-title"
            onMouseDown={e => {
              if (e.target === e.currentTarget) setSelectedTopic(null)
            }}
          >
            <div className="topic-modal-inner">
              <button
                ref={topicCloseRef}
                type="button"
                className="icon-button"
                onClick={() => setSelectedTopic(null)}
                aria-label={copy.closeTopic}
              >
                <X size={17} />
              </button>
              <span className="mono">
                {copy.query} / {selectedTopicEntry.id.toUpperCase()}
              </span>
              <h2 id="topic-dialog-title" lang={locale === 'zh' ? 'zh-CN' : 'en'}>
                {selectedTopicEntry[locale]}
              </h2>
              <p>{copy.topicQueued}</p>
              <div className="modal-status">
                <span className="hud-dot" /> {copy.topicStatus}
              </div>
            </div>
          </div>
        )}

        {articleReaderModal}
      </div>
    </ErrorBoundary>
  )
}
