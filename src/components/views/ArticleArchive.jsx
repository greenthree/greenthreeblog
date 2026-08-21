import { ArrowUpRight, BookOpen, FileText } from 'lucide-react'
import { PanelTitle } from '../common/PanelTitle.jsx'
import { ArticleViewCount } from './ArticleViewCount.jsx'

export function ArticleArchive({ items, onOpen, copy }) {
  return (
    <section id="articles" className="panel article-archive">
      <PanelTitle
        icon={<BookOpen size={14} />}
        title={copy.archive}
        meta={`${String(items.length).padStart(2, '0')} ${copy.articleUnit}`}
        tone="violet"
      />
      <div className="article-list">
        {items.length === 0 && (
          <div className="article-empty">
            <FileText size={18} />
            <span>{copy.emptyArchive}</span>
          </div>
        )}
        {items.map((article, index) => (
          <button
            type="button"
            className="article-row"
            key={article.id}
            onClick={() => onOpen(article)}
          >
            <span className="article-index mono">{String(index + 1).padStart(2, '0')}</span>
            <span className="article-main" lang={article.language}>
              <span className="article-kicker mono">
                <span>{article.category}</span>
                <span>{article.displayDate}</span>
              </span>
              <strong>{article.title}</strong>
              <span className="article-excerpt">{article.excerpt}</span>
            </span>
            <span className="article-side">
              <span className="mono">{article.readTime}</span>
              <ArticleViewCount view={article.view} copy={copy} />
              <ArrowUpRight size={15} />
            </span>
          </button>
        ))}
      </div>
      <div className="article-archive-foot mono">
        <span>{copy.archiveInstruction}</span>
        <span>{copy.hashRoutes}</span>
      </div>
    </section>
  )
}
