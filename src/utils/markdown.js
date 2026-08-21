import { parse as parseYaml } from 'yaml'
import {
  slugify,
  normalizeArticleSlug,
  formatArticleDate,
  normalizeReadTime,
  normalizeTags
} from './format.js'

export function parseArticle(raw) {
  const source = String(raw).replace(/^\uFEFF/, '')
  const frontmatterMatch = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!frontmatterMatch) return { data: {}, content: source }
  try {
    return { data: parseYaml(frontmatterMatch[1]) || {}, content: frontmatterMatch[2] }
  } catch {
    return { data: {}, content: frontmatterMatch[2] }
  }
}

export function splitLocalizedContent(content) {
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

export function createTranslation(data, localizedContent, locale, fallbackTitle) {
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

export function buildArticleCatalog(articleModules) {
  const articleIds = new Map()
  return Object.entries(articleModules)
    .map(([path, raw]) => {
      const parsed = parseArticle(raw)
      const fallbackTitle = path.split('/').pop().replace(/\.md$/i, '').replace(/[-_]+/g, ' ')
      const localizedContent = splitLocalizedContent(parsed.content)
      const translations = {
        zh: createTranslation(parsed.data, localizedContent, 'zh', fallbackTitle),
        en: createTranslation(parsed.data, localizedContent, 'en', fallbackTitle)
      }
      const baseId = normalizeArticleSlug(
        parsed.data.slug || translations.zh.title || translations.en.title,
        path
      )
      const nextId = (articleIds.get(baseId) || 0) + 1
      articleIds.set(baseId, nextId)
      return {
        id: nextId === 1 ? baseId : `${baseId}-${nextId}`,
        date: String(parsed.data.date || ''),
        translations
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function localizeArticle(article, locale) {
  const translation = article.translations[locale] || article.translations.zh || article.translations.en
  return {
    ...article,
    ...translation,
    displayDate: formatArticleDate(article.date, translation.language)
  }
}

export function createTopicCatalog(items) {
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
      const existing = topics.find(topic =>
        (zhLabel && topic.zh.toLowerCase() === zhKey) ||
        (enLabel && topic.en.toLowerCase() === enKey)
      )
      if (existing && articleId && !existing.articleIds.includes(articleId)) {
        existing.articleIds.push(articleId)
      }
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
    // Tags are independent vocabularies. Never pair by array position: a
    // translation may omit or reorder a tag, which would silently merge two
    // unrelated topics. Each locale keeps its own stable visible topic.
    zhTags.forEach(tag => addTopic(tag, '', article.id))
    enTags.forEach(tag => addTopic('', tag, article.id))
  })
  return topics
}
