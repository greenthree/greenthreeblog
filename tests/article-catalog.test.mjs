import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { readArticleSlugs } from '../scripts/article-slugs.mjs'
import { buildArticleCatalog, createTopicCatalog, parseArticle } from '../src/utils/markdown.js'
import { formatComplex, normalizeArticleSlug } from '../src/utils/format.js'

test('build and sync tooling derive identical article slugs', async () => {
  const entries = await readArticleSlugs()
  const modules = {}
  for (const entry of entries) {
    const raw = await readFile(join(process.cwd(), 'src', 'content', entry.source), 'utf8')
    modules[`./content/${entry.source}`] = raw
  }

  const catalog = buildArticleCatalog(modules)
  assert.deepEqual(
    catalog.map(article => article.id).sort(),
    entries.map(entry => entry.article_slug).sort()
  )
})

test('Chinese-only slug seeds remain deterministic ASCII identifiers', () => {
  const seed = normalizeArticleSlug('量子态演化', './content/quantum-note.md')
  assert.match(seed, /^note-[a-z0-9]{7,}$/)
  assert.equal(normalizeArticleSlug('量子态演化', './content/quantum-note.md'), seed)
})

test('complex amplitudes use a single normalized imaginary sign', () => {
  assert.equal(formatComplex(-0.86, -0.51), '−0.86 − 0.51i')
  assert.equal(formatComplex(0, 0), '0.00 + 0.00i')
})

test('frontmatter parser preserves bilingual metadata and body markers', () => {
  const parsed = parseArticle(`---\nslug: sample-note\ntranslations:\n  zh:\n    title: 中文标题\n  en:\n    title: English title\n---\n<!-- lang:zh -->\n中文正文\n<!-- lang:en -->\nEnglish body`)
  assert.equal(parsed.data.translations.zh.title, '中文标题')
  assert.match(parsed.content, /lang:en/)
})

test('topic indexing does not pair translated tags by array position', () => {
  const topics = createTopicCatalog([
    {
      id: 'article-1',
      translations: {
        zh: { category: '分类', tags: ['量子', '算法'] },
        en: { category: 'CATEGORY', tags: ['quantum'] }
      }
    }
  ])
  assert.equal(topics.find(topic => topic.zh === '算法')?.en, '算法')
  assert.equal(topics.find(topic => topic.en === 'quantum')?.zh, 'quantum')
})
