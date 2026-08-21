import { readArticleSlugs } from './article-slugs.mjs'

const entries = await readArticleSlugs()
console.log(`Validated ${entries.length} article slug${entries.length === 1 ? '' : 's'}.`)
for (const entry of entries) console.log(`- ${entry.article_slug} <- ${entry.source}`)
