import { readArticleSlugs } from './article-slugs.mjs'

const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before syncing article slugs.')
}

const entries = await readArticleSlugs()
const response = await fetch(`${supabaseUrl}/rest/v1/article_slug_registry?on_conflict=article_slug`, {
  method: 'POST',
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal'
  },
  body: JSON.stringify(entries.map(({ article_slug }) => ({ article_slug })))
})

if (!response.ok) {
  throw new Error(`Article slug sync failed (${response.status}): ${await response.text()}`)
}

console.log(`Synced ${entries.length} article slug${entries.length === 1 ? '' : 's'}.`)
