import { Eye } from 'lucide-react'

export function ArticleViewCount({ view, copy }) {
  const status = view?.status || 'unavailable'
  const available = status === 'ready' && Number.isFinite(view?.count)
  const value = available ? view.count.toLocaleString('en-US') : status === 'loading' ? '---' : 'N/A'
  const label = available
    ? `${value} ${copy.views}`
    : status === 'loading'
    ? copy.viewsLoading
    : copy.viewsUnavailable

  return (
    <span className="article-view-count" data-state={status} aria-label={label} aria-busy={status === 'loading'}>
      <Eye size={12} aria-hidden="true" />
      <span className="article-view-value">{value}</span>
      <span className="article-view-label">{copy.views}</span>
    </span>
  )
}
