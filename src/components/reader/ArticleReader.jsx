import { useEffect, useRef } from 'react'
import { ArrowUpRight, Tag, X } from 'lucide-react'
import { LanguageSwitch } from '../common/LanguageSwitch.jsx'
import { ArticleViewCount } from '../views/ArticleViewCount.jsx'
import { MarkdownRenderer } from './MarkdownRenderer.jsx'
import { ErrorBoundary } from '../common/ErrorBoundary.jsx'

export function ArticleReader({ article, onClose, copy, locale, onLocaleChange }) {
  const readerRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = [...(readerRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || [])]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => closeButtonRef.current?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="article-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-dialog-title"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={readerRef}
        className="article-reader"
        role="document"
        tabIndex={-1}
      >
        <div className="article-reader-head">
          <span className="article-kicker mono">
            <span>{article.category}</span>
            <span>{article.displayDate}</span>
            <span>{article.readTime}</span>
            <ArticleViewCount view={article.view} copy={copy} />
          </span>
          <div className="article-reader-actions">
            <LanguageSwitch
              locale={locale}
              onChange={onLocaleChange}
              label={copy.languageControl}
            />
            <button
              ref={closeButtonRef}
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label={copy.closeArticle}
            >
              <X size={17} />
            </button>
          </div>
        </div>
        <article className="article-content" lang={article.language}>
          <h1 id="article-dialog-title">{article.title}</h1>
          <p className="article-lede">{article.excerpt}</p>
          {article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map(tag => (
                <span key={tag}>
                  <Tag size={11} /> {tag}
                </span>
              ))}
            </div>
          )}
          <ErrorBoundary copy={copy}>
            <MarkdownRenderer copy={copy}>{article.content}</MarkdownRenderer>
          </ErrorBoundary>
        </article>
        <div className="article-reader-foot mono">
          <span>
            {copy.endNote} / {article.id}
          </span>
          <button type="button" onClick={onClose}>
            {copy.returnArchive} <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
