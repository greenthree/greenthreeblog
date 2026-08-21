import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { ATLAS_COPY } from '../../constants/copy.js'
import { AtlasPage } from './AtlasPage.jsx'
import { AtlasHero } from './AtlasHero.jsx'
import { AtlasSearch } from './AtlasSearch.jsx'

export function TopicAtlas({ locale, items, topics, onOpen, copy, onLocaleChange, onNavigate }) {
  const atlasCopy = ATLAS_COPY[locale].topics
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTopics = topics
    .filter(topic => topic.visibleIn[locale])
    .map(topic => ({
      ...topic,
      articles: topic.articleIds
        .map(id => items.find(article => article.id === id))
        .filter(Boolean)
    }))
  const filtered = visibleTopics.filter(
    topic =>
      !normalizedQuery ||
      [topic[locale], ...topic.articles.flatMap(article => [article.title, article.excerpt])]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
  )

  return (
    <AtlasPage
      locale={locale}
      activeView="topics"
      copy={copy}
      onLocaleChange={onLocaleChange}
      onNavigate={onNavigate}
    >
      <AtlasHero
        eyebrow={atlasCopy.eyebrow}
        title={atlasCopy.title}
        description={atlasCopy.description}
        stats={[
          { value: visibleTopics.length, label: atlasCopy.count },
          { value: items.length, label: locale === 'zh' ? '篇文章' : 'ARTICLES' }
        ]}
      />
      <AtlasSearch
        value={query}
        onChange={setQuery}
        placeholder={atlasCopy.search}
        resultLabel={ATLAS_COPY[locale].result}
        resultCount={filtered.length}
      />
      <div className="topic-atlas-grid">
        {filtered.map((topic, index) => (
          <section className="topic-atlas-card" key={topic.id}>
            <header>
              <span className="mono">T.{String(index + 1).padStart(2, '0')}</span>
              <strong>{String(topic.articles.length).padStart(2, '0')}</strong>
            </header>
            <h2>{topic[locale]}</h2>
            <span className="mono topic-related">{atlasCopy.articles}</span>
            <div>
              {topic.articles.map(article => (
                <button
                  type="button"
                  key={article.id}
                  onClick={() => onOpen(article)}
                >
                  <span>{article.title}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {filtered.length === 0 && <p className="atlas-empty">{atlasCopy.empty}</p>}
    </AtlasPage>
  )
}
