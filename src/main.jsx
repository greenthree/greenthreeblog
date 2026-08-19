import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  ArrowUpRight,
  Atom,
  BookOpen,
  ChevronRight,
  Compass,
  FileText,
  Hand,
  Menu,
  Tag,
  X
} from 'lucide-react'
import { parse as parseYaml } from 'yaml'
import { MarkdownRenderer, MathFormula } from './math.jsx'
import './styles.css'

const topics = ['Qiskit', 'Quantum Advantage', 'Vector Calculus', 'Asymptotics', 'Graph Theory', 'NISQ', 'Simulated Annealing', 'Codeforces']

const articleModules = import.meta.glob('./content/*.md', { query: '?raw', import: 'default', eager: true })

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-note'
}

function decodeHashPart(value) {
  try { return decodeURIComponent(value) } catch { return value }
}

function formatArticleDate(value, language = 'zh-CN') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || 'UNDATED')
  if (language.toLowerCase().startsWith('zh')) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(date)
    .toUpperCase()
}

function normalizeReadTime(value) {
  const match = String(value || '').match(/\d+/)
  const minutes = match ? Math.min(99, Math.max(1, Number.parseInt(match[0], 10))) : 5
  return `${String(minutes).padStart(2, '0')} MIN`
}

function formatComplex(real, imaginary) {
  const normalize = value => Math.abs(value) < 0.005 ? 0 : value
  const formatPart = value => Math.abs(normalize(value)).toFixed(2)
  const realValue = normalize(real)
  const imaginaryValue = normalize(imaginary)
  const realPart = `${realValue < 0 ? '−' : ''}${formatPart(realValue)}`
  const imaginarySign = imaginaryValue < 0 ? '−' : '+'
  return `${realPart} ${imaginarySign} ${formatPart(imaginaryValue)}i`
}

function parseArticle(raw) {
  const source = String(raw).replace(/^\uFEFF/, '')
  const frontmatterMatch = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!frontmatterMatch) return { data: {}, content: source }
  try {
    return { data: parseYaml(frontmatterMatch[1]) || {}, content: frontmatterMatch[2] }
  } catch {
    return { data: {}, content: frontmatterMatch[2] }
  }
}

const articleIds = new Map()
const articles = Object.entries(articleModules)
  .map(([path, raw]) => {
    const parsed = parseArticle(raw)
    const fallbackTitle = path.split('/').pop().replace(/\.md$/i, '').replace(/[-_]+/g, ' ')
    const title = String(parsed.data.title || fallbackTitle)
    const language = String(parsed.data.lang || parsed.data.language || 'zh-CN')
    const baseId = slugify(parsed.data.slug || title)
    const nextId = (articleIds.get(baseId) || 0) + 1
    articleIds.set(baseId, nextId)
    const tags = Array.isArray(parsed.data.tags)
      ? parsed.data.tags.map(String)
      : String(parsed.data.tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
    return {
      id: nextId === 1 ? baseId : `${baseId}-${nextId}`,
      title,
      date: String(parsed.data.date || ''),
      displayDate: formatArticleDate(parsed.data.date, language),
      language,
      category: String(parsed.data.category || 'FIELD NOTE'),
      excerpt: String(parsed.data.excerpt || 'A new note from the quantum core.'),
      readTime: normalizeReadTime(parsed.data.readTime),
      tags,
      content: parsed.content.trim()
    }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

function articleFromHash() {
  const match = window.location.hash.match(/^#article\/([^/]+)$/)
  if (!match) return null
  return articles.find(article => article.id === decodeHashPart(match[1])) || null
}

function BlochSphere({ phase, onPhase }) {
  const canvasRef = useRef(null)
  const pointer = useRef({ x: 0.5, y: 0.38, targetX: 0.5, targetY: 0.38 })
  const phaseState = useRef({ current: phase, target: phase, reported: phase })
  const onPhaseRef = useRef(onPhase)

  useEffect(() => { onPhaseRef.current = onPhase }, [onPhase])
  useEffect(() => { phaseState.current.target = phase }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let tick = 0
    let lastFrame = performance.now()
    const points = Array.from({ length: 120 }, (_, i) => ({
      lat: -Math.PI / 2 + (i % 12) * Math.PI / 11,
      lon: (i / 120) * Math.PI * 2,
      drift: 0.4 + (i % 7) * 0.11
    }))
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const reportPhase = value => {
      const nextPhase = Math.round(Math.max(0, Math.min(1, value)) * 360)
      phaseState.current.target = nextPhase
      if (phaseState.current.reported !== nextPhase) {
        phaseState.current.reported = nextPhase
        onPhaseRef.current(nextPhase)
      }
    }
    const updateTarget = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      pointer.current.targetX = x
      pointer.current.targetY = y
      reportPhase(x)
    }
    const move = event => {
      if (event.pointerType !== 'mouse' && !canvas.hasPointerCapture(event.pointerId)) return
      updateTarget(event.clientX, event.clientY)
    }
    const down = event => {
      canvas.setPointerCapture?.(event.pointerId)
      updateTarget(event.clientX, event.clientY)
    }
    const keyDown = event => {
      const phaseStep = event.shiftKey ? 18 : 6
      const positionStep = event.shiftKey ? 0.12 : 0.04
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const direction = event.key === 'ArrowLeft' ? -1 : 1
        const nextPhase = Math.max(0, Math.min(360, phaseState.current.target + direction * phaseStep))
        pointer.current.targetX = nextPhase / 360
        reportPhase(pointer.current.targetX)
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const direction = event.key === 'ArrowUp' ? -1 : 1
        pointer.current.targetY = Math.max(0, Math.min(1, pointer.current.targetY + direction * positionStep))
      }
    }
    const render = now => {
      const delta = Math.min(40, Math.max(0, now - lastFrame))
      const damping = 1 - Math.exp(-delta * 0.014)
      lastFrame = now
      pointer.current.x += (pointer.current.targetX - pointer.current.x) * damping
      pointer.current.y += (pointer.current.targetY - pointer.current.y) * damping
      phaseState.current.current += (phaseState.current.target - phaseState.current.current) * damping
      const { width, height } = canvas.getBoundingClientRect()
      const cx = width * 0.5
      const cy = height * 0.51
      const radius = Math.min(width, height) * 0.34
      const rot = tick * 0.0013 + pointer.current.x * 0.75
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#0a0c13'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = 'rgba(255,255,255,.11)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx, cy, radius, radius * 0.29, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx, cy, radius * 0.4, radius, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([])
      for (const p of points) {
        const lon = p.lon + rot * p.drift
        const x3 = Math.cos(p.lat) * Math.cos(lon)
        const y3 = Math.sin(p.lat)
        const z3 = Math.cos(p.lat) * Math.sin(lon)
        const x = cx + x3 * radius
        const y = cy - y3 * radius * 0.96
        const alpha = 0.26 + (z3 + 1) * 0.33
        ctx.beginPath()
        ctx.fillStyle = z3 > 0.18 ? `rgba(0,240,255,${alpha})` : `rgba(123,44,191,${alpha})`
        ctx.arc(x, y, z3 > 0.3 ? 1.7 : 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
      const polar = 0.22 + pointer.current.y * (Math.PI - 0.44)
      const azimuth = rot + phaseState.current.current * Math.PI / 180
      const tip = {
        x: cx + Math.sin(polar) * Math.cos(azimuth) * radius * 0.76,
        y: cy - Math.cos(polar) * radius * 0.76
      }
      const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 40)
      glow.addColorStop(0, 'rgba(0,240,255,.75)'); glow.addColorStop(1, 'rgba(0,240,255,0)')
      ctx.fillStyle = glow; ctx.fillRect(tip.x - 40, tip.y - 40, 80, 80)
      ctx.beginPath(); ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.moveTo(cx, cy); ctx.lineTo(tip.x, tip.y); ctx.stroke()
      ctx.beginPath(); ctx.fillStyle = '#00f0ff'; ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.strokeStyle = 'rgba(0,240,255,.6)'; ctx.lineWidth = 1; ctx.arc(tip.x, tip.y, 11 + Math.sin(tick * 0.008) * 3, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '10px JetBrains Mono, monospace'; ctx.fillText('|ψ⟩', tip.x + 12, tip.y - 10)
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '9px JetBrains Mono, monospace'; ctx.fillText('X', cx + radius + 8, cy + 3); ctx.fillText('Z', cx - 3, cy - radius - 12); ctx.fillText('Y', cx - radius - 14, cy + 5)
      tick += delta
      raf = requestAnimationFrame(render)
    }
    resize(); raf = requestAnimationFrame(render)
    window.addEventListener('resize', resize)
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('keydown', keyDown)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('keydown', keyDown)
    }
  }, [])
  return <canvas ref={canvasRef} className="bloch-canvas" aria-label="Interactive Bloch sphere. Use pointer or arrow keys to rotate the state vector." tabIndex={0} />
}

function WaveCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf; let time = 0
    const resize = () => { const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1; canvas.width = rect.width * ratio; canvas.height = rect.height * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#0a0c13'; ctx.fillRect(0, 0, width, height)
      const layers = [{ color: '#00f0ff', offset: 0, amp: 0.24 }, { color: '#7b2cbf', offset: 1.9, amp: 0.19 }, { color: '#ff3366', offset: 3.4, amp: 0.11 }]
      layers.forEach((wave, layer) => {
        ctx.beginPath(); ctx.lineWidth = layer === 0 ? 1.7 : 1; ctx.strokeStyle = wave.color; ctx.globalAlpha = layer === 0 ? .95 : .72
        for (let x = 0; x <= width; x += 2) { const n = x / width; const envelope = Math.exp(-Math.pow((n - .52) / .23, 2)); const y = height * .51 + Math.sin(n * 44 + time * .002 + wave.offset) * height * wave.amp * envelope + Math.sin(n * 12 - time * .0015) * 2; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
        ctx.stroke()
      })
      ctx.globalAlpha = 1; ctx.font = '8px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(0,240,255,.8)'; ctx.fillText('probability amplitude', Math.max(12, width - 120), 18)
      time += 16; raf = requestAnimationFrame(draw)
    }
    resize(); draw(); window.addEventListener('resize', resize); return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="wave-canvas" aria-label="Probability amplitude waveform" />
}

function PanelTitle({ icon, title, meta, tone = 'cyan' }) { return <div className="panel-title"><span className={`panel-icon ${tone}`}>{icon}</span><span className="panel-title-text">{title}</span><span className="panel-meta mono">{meta}</span></div> }

function HudDock({ representation, setRepresentation }) {
  return <aside className="hud-dock" aria-label="Render telemetry"><div className="hud-head"><span className="hud-dot" /> RENDER CORE <span className="hud-close">×</span></div><div className="hud-stats"><div><span className="mono">FPS</span><strong>60</strong></div><div><span className="mono">GPU</span><strong>42%</strong></div><div><span className="mono">DT</span><strong>0.016</strong></div></div><div className="hud-toggle"><span className="mono">REPRESENTATION</span><button onClick={() => setRepresentation(representation === 'SCHR' ? 'HEIS' : 'SCHR')} aria-label="Toggle quantum representation"><span className={representation === 'SCHR' ? 'active' : ''}>SCHR</span><span className={representation === 'HEIS' ? 'active' : ''}>HEIS</span></button></div></aside>
}

function ArticleArchive({ items, onOpen }) {
  return <section id="articles" className="panel article-archive">
    <PanelTitle icon={<BookOpen size={14} />} title="NOTEBOOK ARCHIVE" meta={`${String(items.length).padStart(2, '0')} ARTICLES`} tone="violet" />
    <div className="article-list">
      {items.length === 0 && <div className="article-empty"><FileText size={18} /><span>No field notes indexed yet. Add a Markdown file to <code>src/content/</code>.</span></div>}
      {items.map((article, index) => <button className="article-row" key={article.id} onClick={() => onOpen(article)}>
        <span className="article-index mono">{String(index + 1).padStart(2, '0')}</span>
        <span className="article-main" lang={article.language}><span className="article-kicker mono"><span>{article.category}</span><span>{article.displayDate}</span></span><strong>{article.title}</strong><span className="article-excerpt">{article.excerpt}</span></span>
        <span className="article-side"><span className="mono">{article.readTime}</span><ArrowUpRight size={15} /></span>
      </button>)}
    </div>
    <div className="article-archive-foot mono"><span>DROP A .MD FILE / REBUILD / PUBLISH</span><span>HASH ROUTES ENABLED</span></div>
  </section>
}

function ArticleReader({ article, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = event => { if (event.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKeyDown) }
  }, [onClose])

  return <div className="article-modal" role="dialog" aria-modal="true" aria-label={article.title} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="article-reader">
      <div className="article-reader-head">
        <span className="article-kicker mono"><span>{article.category}</span><span>{article.displayDate}</span><span>{article.readTime}</span></span>
        <button className="icon-button" onClick={onClose} aria-label="Close article"><X size={17} /></button>
      </div>
      <article className="article-content" lang={article.language}>
        <h1>{article.title}</h1>
        <p className="article-lede">{article.excerpt}</p>
        {article.tags.length > 0 && <div className="article-tags">{article.tags.map(tag => <span key={tag}><Tag size={11} /> {tag}</span>)}</div>}
        <MarkdownRenderer>{article.content}</MarkdownRenderer>
      </article>
      <div className="article-reader-foot mono"><span>END OF NOTE / {article.id}</span><button onClick={onClose}>RETURN TO ARCHIVE <ArrowUpRight size={13} /></button></div>
    </div>
  </div>
}

function App() {
  const [phase, setPhase] = useState(42)
  const [representation, setRepresentation] = useState('SCHR')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(() => articleFromHash())
  const articleMap = useMemo(() => new Map(articles.map(article => [article.id, article])), [])

  useEffect(() => {
    const syncArticle = () => {
      const match = window.location.hash.match(/^#article\/([^/]+)$/)
      setSelectedArticle(match ? articleMap.get(decodeHashPart(match[1])) || null : null)
    }
    window.addEventListener('hashchange', syncArticle)
    return () => window.removeEventListener('hashchange', syncArticle)
  }, [articleMap])

  const openArticle = article => {
    setSelectedArticle(article)
    window.location.hash = `article/${encodeURIComponent(article.id)}`
  }

  const closeArticle = () => {
    setSelectedArticle(null)
    window.location.hash = 'articles'
  }

  return <div className={`app-shell representation-${representation.toLowerCase()}`}>
    <div className="ambient-grid" aria-hidden="true" />
    <header id="top" className="topbar"><a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em><small>// QUANTUM_CORE</small></a><nav className="main-nav"><a className="active" href="#quantum">QUANTUM</a><a href="#articles">NOTEBOOK</a><a href="#topics">TOPICS</a><a href="#resources">RESOURCES</a></nav><div className="top-actions"><span className="mono">SYS.08 / 24</span><button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={16} /></button></div></header>
    <main className="content-grid">
      <div className="primary-column">
        <section id="quantum" className="hero-grid"><div className="panel bloch-card"><PanelTitle icon={<Atom size={14} />} title="STATE VECTOR / BLOCH SPHERE" meta={<span className="interactive-meta"><Hand size={11} /> INTERACTIVE</span>} tone="cyan" /><div className="bloch-stage"><BlochSphere phase={phase} onPhase={setPhase} /><div className="axis-note mono">α = {formatComplex(Math.cos(phase * Math.PI / 180), Math.sin(phase * Math.PI / 180))}</div></div><div className="state-row"><button className="state-button">STATE |ψ₀⟩</button><span className="mono">θ {phase}° / φ 0.82π</span><button className="state-button">STATE |ψ₁⟩</button></div></div><div className="panel hero-copy"><span className="mono eyebrow">PHYSICS STUDENT BLOG / 001</span><h1>Quantum<br /><span>frontiers</span> &<br />algorithmic<br />odysseys</h1><p>Notes from the overlap of rigorous physics, elegant algorithms, and the code that lets ideas move.</p><button className="primary-button" onClick={() => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })}>EXPLORE THE NOTEBOOK <ChevronRight size={15} /></button></div></section>
        <ArticleArchive items={articles} onOpen={openArticle} />
      </div>
      <aside className="sidebar"><section className="panel wave-card"><PanelTitle icon={<Activity size={14} />} title="VECTOR WAVE" meta="ψ(x,t)" tone="cyan" /><WaveCanvas /><div className="wave-formula mono"><MathFormula expression={String.raw`\int \lvert\psi(x,t)\rvert^2\,dx = 1`} /></div><p>Visualizing vector wave mechanics. Follow interference patterns and probability amplitudes as they phase through a discrete lattice.</p></section><section id="topics" className="panel topics-card"><PanelTitle icon={<Compass size={14} />} title="TRENDING TOPICS" meta="08 / 24" tone="violet" /><div className="topic-list">{topics.map(topic => <button key={topic} onClick={() => setSelectedTopic(topic)}>{topic}<ChevronRight size={12} /></button>)}</div></section><section id="resources" className="sidebar-footer panel"><div><span className="mono">FOOTER</span><p>Site & lab journal by greenthree. Built from first principles.</p></div><div><span className="mono">SOCIAL</span><a href="https://github.com/greenthree" target="_blank" rel="noreferrer">GitHub <ChevronRight size={12} /></a><a href="mailto:hello@greenthree.blog">Contact <ChevronRight size={12} /></a></div><div className="footer-atom"><Atom size={34} /></div></section></aside>
    </main>
    <HudDock representation={representation} setRepresentation={setRepresentation} />
    <footer className="bottom-line mono"><span>ψ(x,t) // QUANTUM_CORE</span><span>ALL SYSTEMS NOMINAL / 2024—∞</span></footer>
    {menuOpen && <div className="menu-overlay"><div className="menu-overlay-head"><a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em></a><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={17} /></button></div><nav><a href="#quantum" onClick={() => setMenuOpen(false)}>quantum <ChevronRight size={20} /></a><a href="#articles" onClick={() => setMenuOpen(false)}>notebook <ChevronRight size={20} /></a><a href="#topics" onClick={() => setMenuOpen(false)}>topics <ChevronRight size={20} /></a><a href="#resources" onClick={() => setMenuOpen(false)}>resources <ChevronRight size={20} /></a></nav><span className="mono menu-overlay-foot">SYS.08 / 24 <span>STATE VECTOR ONLINE</span></span></div>}
    {selectedTopic && <div className="topic-modal" role="dialog" aria-modal="true" aria-label={selectedTopic}><div className="topic-modal-inner"><button className="icon-button" onClick={() => setSelectedTopic(null)} aria-label="Close topic"><X size={17} /></button><span className="mono">QUERY / {selectedTopic.toUpperCase()}</span><h2>{selectedTopic}</h2><p>This topic is queued in the notebook index. The next field note will connect the notation to a runnable experiment.</p><div className="modal-status"><span className="hud-dot" /> INDEXED / WAITING FOR OBSERVATION</div></div></div>}
    {selectedArticle && <ArticleReader article={selectedArticle} onClose={closeArticle} />}
  </div>
}

const rootElement = document.getElementById('root')
const root = rootElement._greenthreeRoot || createRoot(rootElement)
rootElement._greenthreeRoot = root
root.render(<App />)
