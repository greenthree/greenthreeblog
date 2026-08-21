import { readFile } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { normalizeArticleSlug } from '../src/utils/format.js'

const ARTICLE_DIR = join(process.cwd(), 'src', 'content')

function parseFrontmatter(source) {
  const match = String(source).replace(/^\uFEFF/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) return {}
  return parseYaml(match[1]) || {}
}

export async function readArticleSlugs() {
  const files = (await readdir(ARTICLE_DIR))
    .filter(file => file.toLowerCase().endsWith('.md'))
    .sort()
  const seen = new Map()
  const entries = []

  for (const file of files) {
    const fullPath = join(ARTICLE_DIR, file)
    const data = parseFrontmatter(await readFile(fullPath, 'utf8'))
    const fileTitle = basename(file).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
    const titleSeed = data.translations?.zh?.title || data.translations?.en?.title || data.title || fileTitle
    const slug = normalizeArticleSlug(data.slug || titleSeed, `./content/${file}`)
    const previous = seen.get(slug)
    if (previous) {
      throw new Error(`Duplicate article slug "${slug}" in ${previous} and ${file}`)
    }
    seen.set(slug, file)
    entries.push({ article_slug: slug, source: file })
  }

  return entries
}
