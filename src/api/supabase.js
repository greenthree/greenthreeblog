import { useState, useEffect, useRef, useCallback } from 'react'

export const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
export const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
export const ARTICLE_VIEWS_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
  }
}

export async function fetchArticleViewCounts(articleIds, signal) {
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
  rows.forEach(row => {
    counts[row.article_slug] = Number(row.view_count) || 0
  })
  return counts
}

export async function incrementArticleViewCount(articleId) {
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

function getSessionViewedArticles() {
  try {
    const raw = sessionStorage.getItem('greenthree_viewed_articles')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function markArticleAsViewedInSession(articleId) {
  try {
    const viewed = getSessionViewedArticles()
    viewed.add(articleId)
    sessionStorage.setItem('greenthree_viewed_articles', JSON.stringify([...viewed]))
  } catch {
    // SessionStorage may be restricted in private mode
  }
}

export function useArticleViews(articleIds) {
  const initialStatus = ARTICLE_VIEWS_ENABLED ? 'loading' : 'unavailable'
  const [views, setViews] = useState(() =>
    Object.fromEntries(articleIds.map(id => [id, { count: null, status: initialStatus }]))
  )
  const pendingClickIds = useRef(new Set())

  useEffect(() => {
    if (!ARTICLE_VIEWS_ENABLED || articleIds.length === 0) return undefined
    const controller = new AbortController()
    fetchArticleViewCounts(articleIds, controller.signal)
      .then(counts =>
        setViews(current =>
          Object.fromEntries(
            articleIds.map(id => {
              const currentCount = current[id]?.count
              const fetchedCount = counts[id] ?? 0
              return [
                id,
                {
                  count: currentCount == null ? fetchedCount : Math.max(currentCount, fetchedCount),
                  status: 'ready'
                }
              ]
            })
          )
        )
      )
      .catch(error => {
        if (error.name !== 'AbortError') {
          setViews(current =>
            Object.fromEntries(
              articleIds.map(id => [id, { count: current[id]?.count ?? null, status: 'unavailable' }])
            )
          )
        }
      })
    return () => controller.abort()
  }, [articleIds])

  const increment = useCallback(articleId => {
    // Deduplicate within session to avoid inflating counts on repeated reads
    const sessionViewed = getSessionViewedArticles()
    if (sessionViewed.has(articleId)) {
      return
    }

    if (pendingClickIds.current.has(articleId)) return
    pendingClickIds.current.add(articleId)

    incrementArticleViewCount(articleId)
      .then(count => {
        markArticleAsViewedInSession(articleId)
        setViews(current => ({
          ...current,
          [articleId]: { count: Math.max(current[articleId]?.count ?? 0, count), status: 'ready' }
        }))
      })
      .catch(() =>
        setViews(current => ({
          ...current,
          [articleId]: { count: current[articleId]?.count ?? null, status: 'unavailable' }
        }))
      )
      .finally(() => pendingClickIds.current.delete(articleId))
  }, [])

  return [views, increment]
}
