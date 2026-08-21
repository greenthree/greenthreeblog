import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { ATLAS_COPY } from '../../constants/copy.js'
import { AtlasPage } from './AtlasPage.jsx'
import { AtlasHero } from './AtlasHero.jsx'
import { AtlasSearch } from './AtlasSearch.jsx'
import { ArticleViewCount } from './ArticleViewCount.jsx'

export function ArticleAtlas({ locale, items, onOpen, copy, onLocaleChange, onNavigate }) {
  const atlasCopy = ATLAS_COPY[locale].articles
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = items.filter(
    article =>
      !normalizedQuery ||
      [article.title, article.excerpt, article.category, ...article.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
  )
  const grouped = filtered.reduce((years, article) => {
    const year = article.date.slice(0, 4) || 'UNDATED'
    if (!years[year]) years[year] = []
    years[year].push(article)
    return years
  }, {})

  return (
    <AtlasPage
      locale={locale}
      activeView="articles"
      copy={copy}
      onLocaleChange={onLocaleChange}
      onNavigate={onNavigate}
    >
      <AtlasHero
        eyebrow={atlasCopy.eyebrow}
        title={atlasCopy.title}
        description={atlasCopy.description}
        stats={[
          { value: items.length, label: atlasCopy.count },
          { value: Object.keys(grouped).length, label: locale === 'zh' ? '个年份' : 'YEARS' }
        ]}
      />
      <AtlasSearch
        value={query}
        onChange={setQuery}
        placeholder={atlasCopy.search}
        resultLabel={ATLAS_COPY[locale].result}
        resultCount={filtered.length}
      />
      <div className="chronology">
        {Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([year, yearArticles]) => (
            <section className="chronology-group" key={year}>
              <div className="chronology-year">
                <span>{year}</span>
                <small className="mono">
                  {String(yearArticles.length).padStart(2, '0')} {atlasCopy.count}
                </small>
              </div>
              <div className="atlas-article-list">
                {yearArticles.map(article => (
                  <button
                    type="button"
                    key={article.id}
                    onClick={() => onOpen(article)}
                  >
                    <span className="mono">{article.displayDate}</span>
                    <div lang={article.language}>
                      <small>{article.category}</small>
                      <h2>{article.title}</h2>
                      <p>{article.excerpt}</p>
                      <div className="atlas-tags">
                        {article.tags.slice(0, 4).map(tag => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="atlas-read mono">
                      <span>{article.readTime}</span>
                      <ArticleViewCount view={article.view} copy={copy} />
                      <ArrowUpRight size={16} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        {filtered.length === 0 && <p className="atlas-empty">{atlasCopy.empty}</p>}
      </div>
    </AtlasPage>
  )
}
