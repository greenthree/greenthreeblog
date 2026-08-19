import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Atom,
  BookOpen,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  FileText,
  Hand,
  Languages,
  Menu,
  Search,
  Tag,
  X
} from 'lucide-react'
import { parse as parseYaml } from 'yaml'
import { MarkdownRenderer, MathFormula } from './math.jsx'
import './styles.css'

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
    views: '次点击', viewsLoading: '正在读取点击数', viewsUnavailable: '点击数暂时不可用',
    openMenu: '打开导航', closeMenu: '关闭导航', languageControl: '切换网站语言',
    query: '检索', topicQueued: '该主题来自当前文章索引。打开对应场记，可继续查看相关实验、代码与推导。',
    topicStatus: '已索引 / 当前文章', nominal: '所有系统正常 / 2024—∞', stateOnline: '态矢量在线'
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
    views: 'CLICKS', viewsLoading: 'Loading article clicks', viewsUnavailable: 'Article clicks unavailable',
    openMenu: 'Open navigation', closeMenu: 'Close navigation', languageControl: 'Switch site language',
    query: 'QUERY', topicQueued: 'This topic comes from the live article index. Open a field note to inspect the related experiments, code, and derivations.',
    topicStatus: 'INDEXED / LIVE ARTICLES', nominal: 'ALL SYSTEMS NOMINAL / 2024—∞', stateOnline: 'STATE VECTOR ONLINE'
  }
}

const ATLAS_COPY = {
  zh: {
    articles: { eyebrow: 'NOTEBOOK INDEX', title: '全部文章', description: '按时间倒序排列的全部场记、实验记录与工程笔记。', search: '搜索标题、摘要、分类或标签', count: '篇文章', empty: '没有匹配的文章。' },
    topics: { eyebrow: 'KNOWLEDGE MANIFOLD', title: '主题图谱', description: '从当前文章的分类与标签生成主题索引，并在每个主题下聚合相关文章。', search: '搜索主题或文章', count: '个主题', articles: '篇相关文章', empty: '没有匹配的主题。' },
    resources: { eyebrow: 'RESOURCE ATLAS', title: '资源导航', description: '连接文章、主题与项目入口的精选知识节点。', search: '搜索资源名称、描述或域名', count: '个资源', categories: '个分类', empty: '没有匹配的资源。', open: '打开资源' },
    back: '返回首页', result: '当前结果', clear: '清除搜索'
  },
  en: {
    articles: { eyebrow: 'NOTEBOOK INDEX', title: 'All Articles', description: 'Every field note, experiment log, and engineering journal ordered by date.', search: 'Search titles, summaries, categories, or tags', count: 'ARTICLES', empty: 'No matching articles.' },
    topics: { eyebrow: 'KNOWLEDGE MANIFOLD', title: 'Topic Atlas', description: 'A live index generated from article categories and tags, with related notes grouped under each topic.', search: 'Search topics or articles', count: 'TOPICS', articles: 'RELATED ARTICLES', empty: 'No matching topics.' },
    resources: { eyebrow: 'RESOURCE ATLAS', title: 'Resource Atlas', description: 'Curated knowledge nodes connecting the notebook, topics, and project work.', search: 'Search resource names, descriptions, or domains', count: 'RESOURCES', categories: 'CATEGORIES', empty: 'No matching resources.', open: 'Open resource' },
    back: 'Back home', result: 'CURRENT RESULTS', clear: 'Clear search'
  }
}

const RESOURCE_CATALOG = [
  { category: { zh: '站点索引', en: 'SITE INDEX' }, title: { zh: '全部文章', en: 'All Articles' }, description: { zh: '按时间浏览所有中英文场记与实验记录。', en: 'Browse every bilingual field note and experiment log by date.' }, href: '?view=articles', icon: BookOpen },
  { category: { zh: '站点索引', en: 'SITE INDEX' }, title: { zh: '主题图谱', en: 'Topic Atlas' }, description: { zh: '按分类与标签查看当前文章知识图谱。', en: 'Explore the live knowledge graph by category and tag.' }, href: '?view=topics', icon: Compass },
  { category: { zh: '项目', en: 'PROJECTS' }, title: { zh: 'ProbHub', en: 'ProbHub' }, description: { zh: '可复现、可审计的算法竞赛出题工作流。', en: 'A reproducible and auditable competitive programming workflow.' }, href: 'https://github.com/greenthree/ProbHub-skill', icon: FileText },
  { category: { zh: '项目', en: 'PROJECTS' }, title: { zh: 'greenthree GitHub', en: 'greenthree on GitHub' }, description: { zh: '代码、实验与正在进行的项目。', en: 'Code, experiments, and work in progress.' }, href: 'https://github.com/greenthree', icon: ExternalLink },
  { category: { zh: '学习工具', en: 'LEARNING TOOLS' }, title: { zh: 'DeepTutor', en: 'DeepTutor' }, description: { zh: '开源 AI 学习与研究工作台。', en: 'An open-source AI workbench for learning and research.' }, href: 'https://github.com/HKUDS/DeepTutor', icon: Atom },
  { category: { zh: '开发工具', en: 'DEVELOPER TOOLS' }, title: { zh: 'Firecrawl', en: 'Firecrawl' }, description: { zh: '面向 AI 工作流的网页搜索与内容提取工具。', en: 'Web search and content extraction for AI workflows.' }, href: 'https://www.firecrawl.dev/', icon: Search }
]

const articleModules = import.meta.glob('./content/*.md', { query: '?raw', import: 'default', eager: true })

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
const ARTICLE_VIEWS_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
  }
}

async function fetchArticleViewCounts(articleIds, signal) {
  if (!ARTICLE_VIEWS_ENABLED || articleIds.length === 0) return {}
  const params = new URLSearchParams({
    select: 'article_slug,view_count',
    article_slug: `in.(${articleIds.join(',')})`
  })
  const response = await fetch(`${SUPABASE_URL}/rest/v1/article_views?${params}`, {
    headers: supabaseHeaders(),
    signal
  })
  if (!response.ok) throw new Error(`Article view request failed (${response.status})`)
  const rows = await response.json()
  const counts = Object.fromEntries(articleIds.map(id => [id, 0]))
  rows.forEach(row => { counts[row.article_slug] = Number(row.view_count) || 0 })
  return counts
}

async function incrementArticleViewCount(articleId) {
  if (!ARTICLE_VIEWS_ENABLED) throw new Error('Article views are not configured')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_article_view`, {
    method: 'POST',
    headers: supabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ target_slug: articleId })
  })
  if (!response.ok) throw new Error(`Article view increment failed (${response.status})`)
  const count = Number(await response.json())
  if (!Number.isFinite(count)) throw new Error('Article view increment returned an invalid count')
  return count
}

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

function createTopicCatalog(items) {
  const topics = []
  const seenZh = new Set()
  const seenEn = new Set()
  const addTopic = (zh, en, articleId) => {
    const zhLabel = String(zh || '').trim()
    const enLabel = String(en || '').trim()
    if (!zhLabel && !enLabel) return
    const zhKey = zhLabel.toLowerCase()
    const enKey = enLabel.toLowerCase()
    const zhUnique = Boolean(zhLabel) && !seenZh.has(zhKey)
    const enUnique = Boolean(enLabel) && !seenEn.has(enKey)
    if (!zhUnique && !enUnique) {
      const existing = topics.find(topic => topic.zh.toLowerCase() === zhKey || topic.en.toLowerCase() === enKey)
      if (existing && articleId && !existing.articleIds.includes(articleId)) existing.articleIds.push(articleId)
      return
    }
    if (zhUnique) seenZh.add(zhKey)
    if (enUnique) seenEn.add(enKey)
    topics.push({
      id: `topic-${slugify(zhLabel || enLabel)}-${topics.length + 1}`,
      zh: zhLabel || enLabel,
      en: enLabel || zhLabel,
      visibleIn: { zh: zhUnique, en: enUnique },
      articleIds: articleId ? [articleId] : []
    })
  }
  items.forEach(article => {
    addTopic(article.translations.zh.category, article.translations.en.category, article.id)
    const zhTags = article.translations.zh.tags || []
    const enTags = article.translations.en.tags || []
    const tagCount = Math.max(zhTags.length, enTags.length)
    for (let index = 0; index < tagCount; index += 1) addTopic(zhTags[index], enTags[index], article.id)
  })
  return topics
}

const topicCatalog = createTopicCatalog(articles)

function useArticleViews(articleIds) {
  const initialStatus = ARTICLE_VIEWS_ENABLED ? 'loading' : 'unavailable'
  const [views, setViews] = useState(() => Object.fromEntries(articleIds.map(id => [id, { count: null, status: initialStatus }])))
  const pendingClickIds = useRef(new Set())

  useEffect(() => {
    if (!ARTICLE_VIEWS_ENABLED || articleIds.length === 0) return undefined
    const controller = new AbortController()
    fetchArticleViewCounts(articleIds, controller.signal)
      .then(counts => setViews(current => Object.fromEntries(articleIds.map(id => {
        const currentCount = current[id]?.count
        const fetchedCount = counts[id] ?? 0
        return [id, { count: currentCount == null ? fetchedCount : Math.max(currentCount, fetchedCount), status: 'ready' }]
      }))))
      .catch(error => {
        if (error.name !== 'AbortError') setViews(current => Object.fromEntries(articleIds.map(id => [id, { count: current[id]?.count ?? null, status: 'unavailable' }])))
      })
    return () => controller.abort()
  }, [articleIds])

  const increment = articleId => {
    if (pendingClickIds.current.has(articleId)) return
    pendingClickIds.current.add(articleId)
    incrementArticleViewCount(articleId)
      .then(count => setViews(current => ({
        ...current,
        [articleId]: { count: Math.max(current[articleId]?.count ?? 0, count), status: 'ready' }
      })))
      .catch(() => setViews(current => ({
        ...current,
        [articleId]: { count: current[articleId]?.count ?? null, status: 'unavailable' }
      })))
      .finally(() => pendingClickIds.current.delete(articleId))
  }

  return [views, increment]
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

function ArticleViewCount({ view, copy }) {
  const status = view?.status || 'unavailable'
  const available = status === 'ready' && Number.isFinite(view?.count)
  const value = available ? view.count.toLocaleString('en-US') : status === 'loading' ? '---' : 'N/A'
  const label = available ? `${value} ${copy.views}` : status === 'loading' ? copy.viewsLoading : copy.viewsUnavailable
  return <span className="article-view-count" data-state={status} aria-label={label} aria-busy={status === 'loading'}>
    <Eye size={12} aria-hidden="true" />
    <span className="article-view-value">{value}</span>
    <span className="article-view-label">{copy.views}</span>
  </span>
}

function ArticleArchive({ items, onOpen, copy }) {
  return <section id="articles" className="panel article-archive">
    <PanelTitle icon={<BookOpen size={14} />} title={copy.archive} meta={`${String(items.length).padStart(2, '0')} ${copy.articleUnit}`} tone="violet" />
    <div className="article-list">
      {items.length === 0 && <div className="article-empty"><FileText size={18} /><span>{copy.emptyArchive}</span></div>}
      {items.map((article, index) => <button className="article-row" key={article.id} onClick={() => onOpen(article)}>
        <span className="article-index mono">{String(index + 1).padStart(2, '0')}</span>
        <span className="article-main" lang={article.language}><span className="article-kicker mono"><span>{article.category}</span><span>{article.displayDate}</span></span><strong>{article.title}</strong><span className="article-excerpt">{article.excerpt}</span></span>
        <span className="article-side"><span className="mono">{article.readTime}</span><ArticleViewCount view={article.view} copy={copy} /><ArrowUpRight size={15} /></span>
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
        <span className="article-kicker mono"><span>{article.category}</span><span>{article.displayDate}</span><span>{article.readTime}</span><ArticleViewCount view={article.view} copy={copy} /></span>
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

function atlasHref(view) {
  return view ? `?view=${view}` : './'
}

function AtlasHeader({ locale, onLocaleChange, copy, activeView }) {
  return <header className="topbar atlas-topbar">
    <a className="brand" href="./"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em><small>// QUANTUM_CORE</small></a>
    <nav className="main-nav">
      <a href="./#quantum">{copy.nav.quantum}</a>
      <a className={activeView === 'articles' ? 'active' : ''} href={atlasHref('articles')} target="_blank" rel="noreferrer">{copy.nav.notebook}</a>
      <a className={activeView === 'topics' ? 'active' : ''} href={atlasHref('topics')} target="_blank" rel="noreferrer">{copy.nav.topics}</a>
      <a className={activeView === 'resources' ? 'active' : ''} href={atlasHref('resources')} target="_blank" rel="noreferrer">{copy.nav.resources}</a>
    </nav>
    <div className="top-actions"><LanguageSwitch locale={locale} onChange={onLocaleChange} label={copy.languageControl} /><a className="icon-button" href="./" aria-label={ATLAS_COPY[locale].back}><ArrowLeft size={16} /></a></div>
  </header>
}

function AtlasHero({ eyebrow, title, description, stats }) {
  return <section className="atlas-hero">
    <div><span className="mono atlas-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
    <div className="atlas-stats">{stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
  </section>
}

function AtlasSearch({ value, onChange, placeholder, resultLabel, resultCount }) {
  return <section className="atlas-search-panel">
    <label><span className="mono">{resultLabel}</span><div><Search size={18} /><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></div></label>
    <span className="atlas-result-count mono">{String(resultCount).padStart(2, '0')} / INDEXED</span>
  </section>
}

function ArticleAtlas({ locale, items, onOpen, copy, onLocaleChange }) {
  const atlasCopy = ATLAS_COPY[locale].articles
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = items.filter(article => !normalizedQuery || [article.title, article.excerpt, article.category, ...article.tags].join(' ').toLowerCase().includes(normalizedQuery))
  const grouped = filtered.reduce((years, article) => {
    const year = article.date.slice(0, 4) || 'UNDATED'
    if (!years[year]) years[year] = []
    years[year].push(article)
    return years
  }, {})
  return <AtlasPage locale={locale} activeView="articles" copy={copy} onLocaleChange={onLocaleChange}>
    <AtlasHero eyebrow={atlasCopy.eyebrow} title={atlasCopy.title} description={atlasCopy.description} stats={[{ value: items.length, label: atlasCopy.count }, { value: Object.keys(grouped).length, label: locale === 'zh' ? '个年份' : 'YEARS' }]} />
    <AtlasSearch value={query} onChange={setQuery} placeholder={atlasCopy.search} resultLabel={ATLAS_COPY[locale].result} resultCount={filtered.length} />
    <div className="chronology">
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([year, yearArticles]) => <section className="chronology-group" key={year}><div className="chronology-year"><span>{year}</span><small className="mono">{String(yearArticles.length).padStart(2, '0')} {atlasCopy.count}</small></div><div className="atlas-article-list">{yearArticles.map(article => <button key={article.id} onClick={() => onOpen(article)}><span className="mono">{article.displayDate}</span><div lang={article.language}><small>{article.category}</small><h2>{article.title}</h2><p>{article.excerpt}</p><div className="atlas-tags">{article.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div></div><span className="atlas-read mono"><span>{article.readTime}</span><ArticleViewCount view={article.view} copy={copy} /><ArrowUpRight size={16} /></span></button>)}</div></section>)}
      {filtered.length === 0 && <p className="atlas-empty">{atlasCopy.empty}</p>}
    </div>
  </AtlasPage>
}

function TopicAtlas({ locale, items, topics, onOpen, copy, onLocaleChange }) {
  const atlasCopy = ATLAS_COPY[locale].topics
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTopics = topics.filter(topic => topic.visibleIn[locale]).map(topic => ({ ...topic, articles: topic.articleIds.map(id => items.find(article => article.id === id)).filter(Boolean) }))
  const filtered = visibleTopics.filter(topic => !normalizedQuery || [topic[locale], ...topic.articles.flatMap(article => [article.title, article.excerpt])].join(' ').toLowerCase().includes(normalizedQuery))
  return <AtlasPage locale={locale} activeView="topics" copy={copy} onLocaleChange={onLocaleChange}>
    <AtlasHero eyebrow={atlasCopy.eyebrow} title={atlasCopy.title} description={atlasCopy.description} stats={[{ value: visibleTopics.length, label: atlasCopy.count }, { value: items.length, label: locale === 'zh' ? '篇文章' : 'ARTICLES' }]} />
    <AtlasSearch value={query} onChange={setQuery} placeholder={atlasCopy.search} resultLabel={ATLAS_COPY[locale].result} resultCount={filtered.length} />
    <div className="topic-atlas-grid">{filtered.map((topic, index) => <section className="topic-atlas-card" key={topic.id}><header><span className="mono">T.{String(index + 1).padStart(2, '0')}</span><strong>{String(topic.articles.length).padStart(2, '0')}</strong></header><h2>{topic[locale]}</h2><span className="mono topic-related">{atlasCopy.articles}</span><div>{topic.articles.map(article => <button key={article.id} onClick={() => onOpen(article)}><span>{article.title}</span><ChevronRight size={14} /></button>)}</div></section>)}</div>
    {filtered.length === 0 && <p className="atlas-empty">{atlasCopy.empty}</p>}
  </AtlasPage>
}

function ResourceAtlas({ locale, copy, onLocaleChange }) {
  const atlasCopy = ATLAS_COPY[locale].resources
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = RESOURCE_CATALOG.filter(resource => !normalizedQuery || [resource.title[locale], resource.description[locale], resource.href, resource.category[locale]].join(' ').toLowerCase().includes(normalizedQuery))
  const groups = filtered.reduce((result, resource) => {
    const category = resource.category[locale]
    if (!result[category]) result[category] = []
    result[category].push(resource)
    return result
  }, {})
  const categoryCount = new Set(RESOURCE_CATALOG.map(resource => resource.category[locale])).size
  return <AtlasPage locale={locale} activeView="resources" copy={copy} onLocaleChange={onLocaleChange}>
    <AtlasHero eyebrow={atlasCopy.eyebrow} title={atlasCopy.title} description={atlasCopy.description} stats={[{ value: RESOURCE_CATALOG.length, label: atlasCopy.count }, { value: categoryCount, label: atlasCopy.categories }]} />
    <AtlasSearch value={query} onChange={setQuery} placeholder={atlasCopy.search} resultLabel={ATLAS_COPY[locale].result} resultCount={filtered.length} />
    <div className="resource-groups">{Object.entries(groups).map(([category, resources]) => <section key={category}><header><h2>{category}</h2><span className="mono">{String(resources.length).padStart(2, '0')} / NODES</span></header><div className="resource-grid">{resources.map(resource => { const Icon = resource.icon; const external = resource.href.startsWith('http'); return <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer"><span className="resource-icon"><Icon size={21} /></span><div><h3>{resource.title[locale]}</h3><span className="mono resource-domain">{external ? new URL(resource.href).hostname : 'greenthree.blog'}</span><p>{resource.description[locale]}</p></div><ExternalLink className="resource-open" size={15} aria-label={atlasCopy.open} /></a> })}</div></section>)}</div>
    {filtered.length === 0 && <p className="atlas-empty">{atlasCopy.empty}</p>}
  </AtlasPage>
}

function AtlasPage({ locale, activeView, copy, onLocaleChange, children }) {
  return <div className={`app-shell atlas-shell locale-${locale}`}><div className="ambient-grid" aria-hidden="true" /><AtlasHeader locale={locale} onLocaleChange={onLocaleChange} copy={copy} activeView={activeView} /><main className="atlas-main">{children}</main><footer className="atlas-footer mono"><span>ψ(x,t) // QUANTUM_CORE</span><span>{copy.nominal}</span></footer></div>
}

function App() {
  const view = new URLSearchParams(window.location.search).get('view')
  const [locale, setLocale] = useState(initialLocale)
  const [phase, setPhase] = useState(42)
  const [representation, setRepresentation] = useState('SCHR')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(() => articleFromHash())
  const articleIds = useMemo(() => articles.map(article => article.id), [])
  const [articleViews, incrementArticleView] = useArticleViews(articleIds)
  const articleMap = useMemo(() => new Map(articles.map(article => [article.id, article])), [])
  const localizedArticles = useMemo(() => articles.map(article => ({ ...localizeArticle(article, locale), view: articleViews[article.id] })), [articleViews, locale])
  const homepageArticles = useMemo(() => localizedArticles
    .map((article, sourceIndex) => ({ article, sourceIndex }))
    .sort((a, b) => {
      const aViews = a.article.view?.status === 'ready' ? a.article.view.count : -1
      const bViews = b.article.view?.status === 'ready' ? b.article.view.count : -1
      return bViews - aViews || a.sourceIndex - b.sourceIndex
    })
    .map(entry => entry.article), [localizedArticles])
  const visibleTopics = useMemo(() => topicCatalog
    .map((topic, sourceIndex) => {
      const topicViews = topic.articleIds.map(articleId => articleViews[articleId])
      const countsReady = topicViews.every(viewState => viewState?.status === 'ready' && Number.isFinite(viewState.count))
      return {
        ...topic,
        sourceIndex,
        totalClicks: countsReady ? topicViews.reduce((sum, viewState) => sum + viewState.count, 0) : null
      }
    })
    .filter(topic => topic.visibleIn[locale])
    .sort((a, b) => (b.totalClicks ?? -1) - (a.totalClicks ?? -1) || a.sourceIndex - b.sourceIndex), [articleViews, locale])
  const localizedSelectedArticle = selectedArticle ? { ...localizeArticle(selectedArticle, locale), view: articleViews[selectedArticle.id] } : null
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
    const atlasTitle = view && ATLAS_COPY[locale][view]?.title
    document.title = atlasTitle ? `${atlasTitle} — greenthree blog` : locale === 'zh' ? 'greenthree blog — 让物理可见' : 'greenthree blog — physics, made visible'
    try { window.localStorage.setItem('greenthree-locale', locale) } catch { /* storage is optional */ }
  }, [locale, view])

  const openArticle = article => {
    setSelectedArticle(articleMap.get(article.id) || article)
    window.location.hash = `article/${encodeURIComponent(article.id)}`
    incrementArticleView(article.id)
  }

  const closeArticle = () => {
    setSelectedArticle(null)
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#articles`)
  }

  const articleReader = localizedSelectedArticle && <ArticleReader article={localizedSelectedArticle} onClose={closeArticle} copy={copy} locale={locale} onLocaleChange={setLocale} />
  if (view === 'articles') return <><ArticleAtlas locale={locale} items={localizedArticles} onOpen={openArticle} copy={copy} onLocaleChange={setLocale} />{articleReader}</>
  if (view === 'topics') return <><TopicAtlas locale={locale} items={localizedArticles} topics={topicCatalog} onOpen={openArticle} copy={copy} onLocaleChange={setLocale} />{articleReader}</>
  if (view === 'resources') return <ResourceAtlas locale={locale} copy={copy} onLocaleChange={setLocale} />

  return <div className={`app-shell locale-${locale} representation-${representation.toLowerCase()}`}>
    <div className="ambient-grid" aria-hidden="true" />
    <header id="top" className="topbar">
      <a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em><small>// QUANTUM_CORE</small></a>
      <nav className="main-nav"><a className="active" href="#quantum">{copy.nav.quantum}</a><a href={atlasHref('articles')} target="_blank" rel="noreferrer">{copy.nav.notebook}</a><a href={atlasHref('topics')} target="_blank" rel="noreferrer">{copy.nav.topics}</a><a href={atlasHref('resources')} target="_blank" rel="noreferrer">{copy.nav.resources}</a></nav>
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
            <a className="primary-button" href={atlasHref('articles')} target="_blank" rel="noreferrer">{copy.explore} <ChevronRight size={15} /></a>
          </div>
        </section>
        <ArticleArchive items={homepageArticles} onOpen={openArticle} copy={copy} />
      </div>
      <aside className="sidebar">
        <section className="panel wave-card"><PanelTitle icon={<Activity size={14} />} title={copy.wave} meta="ψ(x,t)" tone="cyan" /><WaveCanvas ariaLabel={copy.waveLabel} amplitudeLabel={copy.amplitudeLabel} /><div className="wave-formula mono"><MathFormula expression={String.raw`\int \lvert\psi(x, t)\rvert^2\,\mathrm{d}x = 1`} /></div><p>{copy.waveDescription}</p></section>
        <section id="topics" className="panel topics-card"><PanelTitle icon={<Compass size={14} />} title={copy.topics} meta={`${String(visibleTopics.length).padStart(2, '0')} / LIVE`} tone="violet" /><div className="topic-list">{visibleTopics.map(topic => { const ready = topic.totalClicks != null; const clickValue = ready ? topic.totalClicks.toLocaleString('en-US') : '---'; return <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}><span className="topic-name">{topic[locale]}</span><span className="topic-score mono" data-state={ready ? 'ready' : 'loading'} aria-label={ready ? `${clickValue} ${copy.views}` : copy.viewsLoading} aria-busy={!ready}><Eye className="topic-eye" size={11} aria-hidden="true" /><span>{clickValue}</span><ChevronRight className="topic-chevron" size={12} aria-hidden="true" /></span></button> })}</div></section>
        <section id="resources" className="sidebar-footer panel"><div><span className="mono">{copy.footer}</span><p>{copy.about}</p></div><div><span className="mono">{copy.social}</span><a href="https://github.com/greenthree" target="_blank" rel="noreferrer">GitHub <ChevronRight size={12} /></a><a href="mailto:hello@greenthree.blog">{copy.contact} <ChevronRight size={12} /></a></div><div className="footer-atom"><Atom size={34} /></div></section>
      </aside>
    </main>
    <HudDock representation={representation} setRepresentation={setRepresentation} copy={copy} />
    <footer className="bottom-line mono"><span>ψ(x,t) // QUANTUM_CORE</span><span>{copy.nominal}</span></footer>
    {menuOpen && <div className="menu-overlay"><div className="menu-overlay-head"><a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em></a><div className="menu-overlay-actions"><LanguageSwitch locale={locale} onChange={setLocale} label={copy.languageControl} /><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label={copy.closeMenu}><X size={17} /></button></div></div><nav><a href="#quantum" onClick={() => setMenuOpen(false)}>{copy.nav.quantum} <ChevronRight size={20} /></a><a href={atlasHref('articles')} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>{copy.nav.notebook} <ChevronRight size={20} /></a><a href={atlasHref('topics')} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>{copy.nav.topics} <ChevronRight size={20} /></a><a href={atlasHref('resources')} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>{copy.nav.resources} <ChevronRight size={20} /></a></nav><span className="mono menu-overlay-foot">SYS.08 / 24 <span>{copy.stateOnline}</span></span></div>}
    {selectedTopicEntry && <div className="topic-modal" role="dialog" aria-modal="true" aria-label={selectedTopicEntry[locale]}><div className="topic-modal-inner"><button className="icon-button" onClick={() => setSelectedTopic(null)} aria-label={copy.closeTopic}><X size={17} /></button><span className="mono">{copy.query} / {selectedTopicEntry.id.toUpperCase()}</span><h2 lang={locale === 'zh' ? 'zh-CN' : 'en'}>{selectedTopicEntry[locale]}</h2><p>{copy.topicQueued}</p><div className="modal-status"><span className="hud-dot" /> {copy.topicStatus}</div></div></div>}
    {articleReader}
  </div>
}

const rootElement = document.getElementById('root')
const root = rootElement._greenthreeRoot || createRoot(rootElement)
rootElement._greenthreeRoot = root
root.render(<App />)
