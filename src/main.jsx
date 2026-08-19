import { useEffect, useMemo, useRef, useState } from 'react'
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
  Languages,
  Menu,
  Tag,
  X
} from 'lucide-react'
import { parse as parseYaml } from 'yaml'
import { MarkdownRenderer, MathFormula } from './math.jsx'
import './styles.css'

const topicCatalog = [
  { id: 'qiskit', zh: 'Qiskit', en: 'Qiskit' },
  { id: 'quantum-advantage', zh: '量子优势', en: 'Quantum Advantage' },
  { id: 'vector-calculus', zh: '向量分析', en: 'Vector Calculus' },
  { id: 'asymptotics', zh: '渐近分析', en: 'Asymptotics' },
  { id: 'graph-theory', zh: '图论', en: 'Graph Theory' },
  { id: 'nisq', zh: 'NISQ', en: 'NISQ' },
  { id: 'simulated-annealing', zh: '模拟退火', en: 'Simulated Annealing' },
  { id: 'codeforces', zh: 'Codeforces', en: 'Codeforces' }
]

const UI_COPY = {
  zh: {
    nav: { quantum: '量子态', notebook: '文章', topics: '主题', resources: '资源' },
    stateVector: '态矢量 / 布洛赫球', interactive: '可交互',
    blochLabel: '交互式布洛赫球。使用指针或方向键旋转态矢量。',
    physicsBlog: '物理系学生博客 / 001',
    hero: { line1: '量子', accent: '前沿', joiner: '与', line3: '算法', line4: '漫游' },
    heroDescription: '记录严谨物理与优雅算法，也记录让思想运动起来的代码。',
    explore: '浏览文章', archive: '笔记归档', articleUnit: '篇文章',
    emptyArchive: '尚未索引文章。请在 src/content/ 中添加 Markdown 文件。',
    archiveInstruction: '导入 .MD 文件 / 重新构建 / 发布', hashRoutes: '固定链接已启用',
    wave: '波函数演化 // WAVE_FUNCTION', waveDescription: '观察波包干涉、概率振幅与相位如何在离散晶格中演化。',
    waveLabel: '概率振幅波形', amplitudeLabel: '概率振幅', topics: '热门主题',
    footer: '页脚', social: '社交', about: 'greenthree 的网站与实验笔记，从第一性原理开始构建。', contact: '联系',
    renderCore: '性能监控', representation: '表象', renderTelemetry: '渲染遥测', openTelemetry: '展开性能监控', closeTelemetry: '收起性能监控',
    state: '态', closeArticle: '关闭文章', closeTopic: '关闭主题', endNote: '文章结束', returnArchive: '返回归档',
    openMenu: '打开导航', closeMenu: '关闭导航', languageControl: '切换网站语言',
    query: '检索', topicQueued: '该主题已进入笔记索引。下一篇场记将把符号连接到可运行实验。',
    topicStatus: '已索引 / 等待观测', nominal: '所有系统正常 / 2024—∞', stateOnline: '态矢量在线'
  },
  en: {
    nav: { quantum: 'QUANTUM', notebook: 'NOTEBOOK', topics: 'TOPICS', resources: 'RESOURCES' },
    stateVector: 'STATE VECTOR / BLOCH SPHERE', interactive: 'INTERACTIVE',
    blochLabel: 'Interactive Bloch sphere. Use pointer or arrow keys to rotate the state vector.',
    physicsBlog: 'PHYSICS STUDENT BLOG / 001',
    hero: { line1: 'Quantum', accent: 'frontiers', joiner: '&', line3: 'algorithmic', line4: 'odysseys' },
    heroDescription: 'Notes from the overlap of rigorous physics, elegant algorithms, and the code that lets ideas move.',
    explore: 'EXPLORE THE NOTEBOOK', archive: 'NOTEBOOK ARCHIVE', articleUnit: 'ARTICLES',
    emptyArchive: 'No field notes indexed yet. Add a Markdown file to src/content/.',
    archiveInstruction: 'DROP A .MD FILE / REBUILD / PUBLISH', hashRoutes: 'HASH ROUTES ENABLED',
    wave: 'WAVE FUNCTION EVOLUTION', waveDescription: 'Visualizing wave-packet interference, probability amplitudes, and phase evolution across a discrete lattice.',
    waveLabel: 'Probability amplitude waveform', amplitudeLabel: 'probability amplitude', topics: 'TRENDING TOPICS',
    footer: 'FOOTER', social: 'SOCIAL', about: 'Site and lab journal by greenthree. Built from first principles.', contact: 'Contact',
    renderCore: 'RENDER CORE', representation: 'REPRESENTATION', renderTelemetry: 'Render telemetry', openTelemetry: 'Expand performance telemetry', closeTelemetry: 'Collapse performance telemetry',
    state: 'STATE', closeArticle: 'Close article', closeTopic: 'Close topic', endNote: 'END OF NOTE', returnArchive: 'RETURN TO ARCHIVE',
    openMenu: 'Open navigation', closeMenu: 'Close navigation', languageControl: 'Switch site language',
    query: 'QUERY', topicQueued: 'This topic is queued in the notebook index. The next field note will connect the notation to a runnable experiment.',
    topicStatus: 'INDEXED / WAITING FOR OBSERVATION', nominal: 'ALL SYSTEMS NOMINAL / 2024—∞', stateOnline: 'STATE VECTOR ONLINE'
  }
}

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
    return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`
  }
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
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

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map(String)
    : String(value || '').split(',').map(tag => tag.trim()).filter(Boolean)
}

function splitLocalizedContent(content) {
  const source = String(content || '')
  const marker = /<!--\s*lang:(zh|en)\s*-->/gi
  const matches = [...source.matchAll(marker)]
  if (matches.length === 0) return { zh: source.trim(), en: source.trim() }
  return matches.reduce((localized, match, index) => {
    const start = match.index + match[0].length
    const end = matches[index + 1]?.index ?? source.length
    localized[match[1].toLowerCase()] = source.slice(start, end).trim()
    return localized
  }, {})
}

function createTranslation(data, localizedContent, locale, fallbackTitle) {
  const translation = data.translations?.[locale] || {}
  const useLegacy = locale === 'zh' || String(data.lang || data.language || '').toLowerCase().startsWith(locale)
  const language = String(translation.language || (locale === 'zh' ? 'zh-CN' : 'en'))
  return {
    title: String(translation.title || (useLegacy ? data.title : '') || fallbackTitle),
    language,
    category: String(translation.category || (useLegacy ? data.category : '') || (locale === 'zh' ? '场记' : 'FIELD NOTE')),
    excerpt: String(translation.excerpt || (useLegacy ? data.excerpt : '') || (locale === 'zh' ? '来自量子核心的新笔记。' : 'A new note from the quantum core.')),
    readTime: normalizeReadTime(translation.readTime || (useLegacy ? data.readTime : '')),
    tags: normalizeTags(translation.tags || (useLegacy ? data.tags : [])),
    content: localizedContent[locale] || localizedContent.zh || localizedContent.en || ''
  }
}

const articleIds = new Map()
const articles = Object.entries(articleModules)
  .map(([path, raw]) => {
    const parsed = parseArticle(raw)
    const fallbackTitle = path.split('/').pop().replace(/\.md$/i, '').replace(/[-_]+/g, ' ')
    const localizedContent = splitLocalizedContent(parsed.content)
    const translations = {
      zh: createTranslation(parsed.data, localizedContent, 'zh', fallbackTitle),
      en: createTranslation(parsed.data, localizedContent, 'en', fallbackTitle)
    }
    const baseId = slugify(parsed.data.slug || translations.zh.title || translations.en.title)
    const nextId = (articleIds.get(baseId) || 0) + 1
    articleIds.set(baseId, nextId)
    return {
      id: nextId === 1 ? baseId : `${baseId}-${nextId}`,
      date: String(parsed.data.date || ''),
      translations
    }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

function localizeArticle(article, locale) {
  const translation = article.translations[locale] || article.translations.zh || article.translations.en
  return { ...article, ...translation, displayDate: formatArticleDate(article.date, translation.language) }
}

function initialLocale() {
  try {
    const saved = window.localStorage.getItem('greenthree-locale')
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }
  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function articleFromHash() {
  const match = window.location.hash.match(/^#article\/([^/]+)$/)
  if (!match) return null
  return articles.find(article => article.id === decodeHashPart(match[1])) || null
}

function BlochSphere({ phase, onPhase, ariaLabel }) {
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
  return <canvas ref={canvasRef} className="bloch-canvas" aria-label={ariaLabel} tabIndex={0} />
}

function WaveCanvas({ ariaLabel, amplitudeLabel }) {
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
      ctx.globalAlpha = 1; ctx.font = '8px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(0,240,255,.8)'; ctx.fillText(amplitudeLabel, Math.max(12, width - 120), 18)
      time += 16; raf = requestAnimationFrame(draw)
    }
    resize(); draw(); window.addEventListener('resize', resize); return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [amplitudeLabel])
  return <canvas ref={canvasRef} className="wave-canvas" aria-label={ariaLabel} />
}

function PanelTitle({ icon, title, meta, tone = 'cyan' }) { return <div className="panel-title"><span className={`panel-icon ${tone}`}>{icon}</span><span className="panel-title-text">{title}</span><span className="panel-meta mono">{meta}</span></div> }

function LanguageSwitch({ locale, onChange, label }) {
  return <div className="language-switch" role="group" aria-label={label}>
    <Languages size={13} aria-hidden="true" />
    <button type="button" className={locale === 'zh' ? 'active' : ''} aria-pressed={locale === 'zh'} onClick={() => onChange('zh')}>中</button>
    <span aria-hidden="true">/</span>
    <button type="button" className={locale === 'en' ? 'active' : ''} aria-pressed={locale === 'en'} onClick={() => onChange('en')}>EN</button>
  </div>
}

function HudDock({ representation, setRepresentation, copy }) {
  const [expanded, setExpanded] = useState(false)
  if (!expanded) {
    return <button type="button" className="hud-pill mono" onClick={() => setExpanded(true)} aria-expanded="false" aria-label={copy.openTelemetry}><span className="hud-dot" /><Activity size={12} aria-hidden="true" /><span>60 FPS</span></button>
  }
  return <aside className="hud-dock" aria-label={copy.renderTelemetry}><div className="hud-head"><span className="hud-dot" /> {copy.renderCore} <button type="button" className="hud-close" onClick={() => setExpanded(false)} aria-label={copy.closeTelemetry}><X size={10} aria-hidden="true" /></button></div><div className="hud-stats"><div><span className="mono">FPS</span><strong>60</strong></div><div><span className="mono">GPU</span><strong>42%</strong></div><div><span className="mono">DT</span><strong>0.016</strong></div></div><div className="hud-toggle"><span className="mono">{copy.representation}</span><button onClick={() => setRepresentation(representation === 'SCHR' ? 'HEIS' : 'SCHR')} aria-label={copy.representation}><span className={representation === 'SCHR' ? 'active' : ''}>SCHR</span><span className={representation === 'HEIS' ? 'active' : ''}>HEIS</span></button></div></aside>
}

function ArticleArchive({ items, onOpen, copy }) {
  return <section id="articles" className="panel article-archive">
    <PanelTitle icon={<BookOpen size={14} />} title={copy.archive} meta={`${String(items.length).padStart(2, '0')} ${copy.articleUnit}`} tone="violet" />
    <div className="article-list">
      {items.length === 0 && <div className="article-empty"><FileText size={18} /><span>{copy.emptyArchive}</span></div>}
      {items.map((article, index) => <button className="article-row" key={article.id} onClick={() => onOpen(article)}>
        <span className="article-index mono">{String(index + 1).padStart(2, '0')}</span>
        <span className="article-main" lang={article.language}><span className="article-kicker mono"><span>{article.category}</span><span>{article.displayDate}</span></span><strong>{article.title}</strong><span className="article-excerpt">{article.excerpt}</span></span>
        <span className="article-side"><span className="mono">{article.readTime}</span><ArrowUpRight size={15} /></span>
      </button>)}
    </div>
    <div className="article-archive-foot mono"><span>{copy.archiveInstruction}</span><span>{copy.hashRoutes}</span></div>
  </section>
}

function ArticleReader({ article, onClose, copy, locale, onLocaleChange }) {
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
        <div className="article-reader-actions"><LanguageSwitch locale={locale} onChange={onLocaleChange} label={copy.languageControl} /><button className="icon-button" onClick={onClose} aria-label={copy.closeArticle}><X size={17} /></button></div>
      </div>
      <article className="article-content" lang={article.language}>
        <h1>{article.title}</h1>
        <p className="article-lede">{article.excerpt}</p>
        {article.tags.length > 0 && <div className="article-tags">{article.tags.map(tag => <span key={tag}><Tag size={11} /> {tag}</span>)}</div>}
        <MarkdownRenderer>{article.content}</MarkdownRenderer>
      </article>
      <div className="article-reader-foot mono"><span>{copy.endNote} / {article.id}</span><button onClick={onClose}>{copy.returnArchive} <ArrowUpRight size={13} /></button></div>
    </div>
  </div>
}

function App() {
  const [locale, setLocale] = useState(initialLocale)
  const [phase, setPhase] = useState(42)
  const [representation, setRepresentation] = useState('SCHR')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(() => articleFromHash())
  const articleMap = useMemo(() => new Map(articles.map(article => [article.id, article])), [])
  const localizedArticles = useMemo(() => articles.map(article => localizeArticle(article, locale)), [locale])
  const localizedSelectedArticle = selectedArticle ? localizeArticle(selectedArticle, locale) : null
  const selectedTopicEntry = selectedTopic ? topicCatalog.find(topic => topic.id === selectedTopic) : null
  const copy = UI_COPY[locale]

  useEffect(() => {
    const syncArticle = () => {
      const match = window.location.hash.match(/^#article\/([^/]+)$/)
      setSelectedArticle(match ? articleMap.get(decodeHashPart(match[1])) || null : null)
    }
    window.addEventListener('hashchange', syncArticle)
    return () => window.removeEventListener('hashchange', syncArticle)
  }, [articleMap])

  useEffect(() => {
    const documentLanguage = locale === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.lang = documentLanguage
    document.documentElement.dataset.locale = locale
    document.title = locale === 'zh' ? 'greenthree blog — 让物理可见' : 'greenthree blog — physics, made visible'
    try { window.localStorage.setItem('greenthree-locale', locale) } catch { /* storage is optional */ }
  }, [locale])

  const openArticle = article => {
    setSelectedArticle(articleMap.get(article.id) || article)
    window.location.hash = `article/${encodeURIComponent(article.id)}`
  }

  const closeArticle = () => {
    setSelectedArticle(null)
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#articles`)
  }

  return <div className={`app-shell locale-${locale} representation-${representation.toLowerCase()}`}>
    <div className="ambient-grid" aria-hidden="true" />
    <header id="top" className="topbar">
      <a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em><small>// QUANTUM_CORE</small></a>
      <nav className="main-nav"><a className="active" href="#quantum">{copy.nav.quantum}</a><a href="#articles">{copy.nav.notebook}</a><a href="#topics">{copy.nav.topics}</a><a href="#resources">{copy.nav.resources}</a></nav>
      <div className="top-actions"><LanguageSwitch locale={locale} onChange={setLocale} label={copy.languageControl} /><span className="mono">SYS.08 / 24</span><button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label={copy.openMenu}><Menu size={16} /></button></div>
    </header>
    <main className="content-grid">
      <div className="primary-column">
        <section id="quantum" className="hero-grid">
          <div className="panel bloch-card">
            <PanelTitle icon={<Atom size={14} />} title={copy.stateVector} meta={<span className="interactive-meta"><Hand size={11} /> {copy.interactive}</span>} tone="cyan" />
            <div className="bloch-stage"><BlochSphere phase={phase} onPhase={setPhase} ariaLabel={copy.blochLabel} /><div className="axis-note mono">α = {formatComplex(Math.cos(phase * Math.PI / 180), Math.sin(phase * Math.PI / 180))}</div></div>
            <div className="state-row"><button className="state-button">{copy.state} |0⟩</button><span className="mono">θ {phase}° / φ 0.82π</span><button className="state-button">{copy.state} |1⟩</button></div>
          </div>
          <div className="panel hero-copy" lang={locale === 'zh' ? 'zh-CN' : 'en'}>
            <span className="mono eyebrow">{copy.physicsBlog}</span>
            <h1>{copy.hero.line1}<br /><span>{copy.hero.accent}</span> {copy.hero.joiner}<br />{copy.hero.line3}<br />{copy.hero.line4}</h1>
            <p>{copy.heroDescription}</p>
            <button className="primary-button" onClick={() => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })}>{copy.explore} <ChevronRight size={15} /></button>
          </div>
        </section>
        <ArticleArchive items={localizedArticles} onOpen={openArticle} copy={copy} />
      </div>
      <aside className="sidebar">
        <section className="panel wave-card"><PanelTitle icon={<Activity size={14} />} title={copy.wave} meta="ψ(x,t)" tone="cyan" /><WaveCanvas ariaLabel={copy.waveLabel} amplitudeLabel={copy.amplitudeLabel} /><div className="wave-formula mono"><MathFormula expression={String.raw`\int \lvert\psi(x, t)\rvert^2\,\mathrm{d}x = 1`} /></div><p>{copy.waveDescription}</p></section>
        <section id="topics" className="panel topics-card"><PanelTitle icon={<Compass size={14} />} title={copy.topics} meta="08 / 24" tone="violet" /><div className="topic-list">{topicCatalog.map(topic => <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}>{topic[locale]}<ChevronRight size={12} /></button>)}</div></section>
        <section id="resources" className="sidebar-footer panel"><div><span className="mono">{copy.footer}</span><p>{copy.about}</p></div><div><span className="mono">{copy.social}</span><a href="https://github.com/greenthree" target="_blank" rel="noreferrer">GitHub <ChevronRight size={12} /></a><a href="mailto:hello@greenthree.blog">{copy.contact} <ChevronRight size={12} /></a></div><div className="footer-atom"><Atom size={34} /></div></section>
      </aside>
    </main>
    <HudDock representation={representation} setRepresentation={setRepresentation} copy={copy} />
    <footer className="bottom-line mono"><span>ψ(x,t) // QUANTUM_CORE</span><span>{copy.nominal}</span></footer>
    {menuOpen && <div className="menu-overlay"><div className="menu-overlay-head"><a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em></a><div className="menu-overlay-actions"><LanguageSwitch locale={locale} onChange={setLocale} label={copy.languageControl} /><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label={copy.closeMenu}><X size={17} /></button></div></div><nav><a href="#quantum" onClick={() => setMenuOpen(false)}>{copy.nav.quantum} <ChevronRight size={20} /></a><a href="#articles" onClick={() => setMenuOpen(false)}>{copy.nav.notebook} <ChevronRight size={20} /></a><a href="#topics" onClick={() => setMenuOpen(false)}>{copy.nav.topics} <ChevronRight size={20} /></a><a href="#resources" onClick={() => setMenuOpen(false)}>{copy.nav.resources} <ChevronRight size={20} /></a></nav><span className="mono menu-overlay-foot">SYS.08 / 24 <span>{copy.stateOnline}</span></span></div>}
    {selectedTopicEntry && <div className="topic-modal" role="dialog" aria-modal="true" aria-label={selectedTopicEntry[locale]}><div className="topic-modal-inner"><button className="icon-button" onClick={() => setSelectedTopic(null)} aria-label={copy.closeTopic}><X size={17} /></button><span className="mono">{copy.query} / {selectedTopicEntry.id.toUpperCase()}</span><h2 lang={locale === 'zh' ? 'zh-CN' : 'en'}>{selectedTopicEntry[locale]}</h2><p>{copy.topicQueued}</p><div className="modal-status"><span className="hud-dot" /> {copy.topicStatus}</div></div></div>}
    {localizedSelectedArticle && <ArticleReader article={localizedSelectedArticle} onClose={closeArticle} copy={copy} locale={locale} onLocaleChange={setLocale} />}
  </div>
}

const rootElement = document.getElementById('root')
const root = rootElement._greenthreeRoot || createRoot(rootElement)
rootElement._greenthreeRoot = root
root.render(<App />)
