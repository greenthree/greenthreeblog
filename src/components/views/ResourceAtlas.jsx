import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { ATLAS_COPY } from '../../constants/copy.js'
import { RESOURCE_CATALOG } from '../../constants/resources.js'
import { AtlasPage } from './AtlasPage.jsx'
import { AtlasHero } from './AtlasHero.jsx'
import { AtlasSearch } from './AtlasSearch.jsx'

export function ResourceAtlas({ locale, copy, onLocaleChange, onNavigate }) {
  const atlasCopy = ATLAS_COPY[locale].resources
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = RESOURCE_CATALOG.filter(
    resource =>
      !normalizedQuery ||
      [
        resource.title[locale],
        resource.description[locale],
        resource.href || resource.view,
        resource.category[locale]
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
  )
  const groups = filtered.reduce((result, resource) => {
    const category = resource.category[locale]
    if (!result[category]) result[category] = []
    result[category].push(resource)
    return result
  }, {})
  const categoryCount = new Set(RESOURCE_CATALOG.map(resource => resource.category[locale])).size

  return (
    <AtlasPage
      locale={locale}
      activeView="resources"
      copy={copy}
      onLocaleChange={onLocaleChange}
      onNavigate={onNavigate}
    >
      <AtlasHero
        eyebrow={atlasCopy.eyebrow}
        title={atlasCopy.title}
        description={atlasCopy.description}
        stats={[
          { value: RESOURCE_CATALOG.length, label: atlasCopy.count },
          { value: categoryCount, label: atlasCopy.categories }
        ]}
      />
      <AtlasSearch
        value={query}
        onChange={setQuery}
        placeholder={atlasCopy.search}
        resultLabel={ATLAS_COPY[locale].result}
        resultCount={filtered.length}
      />
      <div className="resource-groups">
        {Object.entries(groups).map(([category, resources]) => (
          <section key={category}>
            <header>
              <h2>{category}</h2>
              <span className="mono">{String(resources.length).padStart(2, '0')} / NODES</span>
            </header>
            <div className="resource-grid">
              {resources.map(resource => {
                const Icon = resource.icon
                const isInternal = Boolean(resource.view)
                const href = isInternal ? `?view=${resource.view}` : resource.href
                const domain = isInternal
                  ? 'greenthree.blog'
                  : new URL(resource.href).hostname

                const handleClick = e => {
                  if (isInternal) {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                    e.preventDefault()
                    onNavigate(resource.view)
                  }
                }

                return (
                  <a
                    key={resource.title.en}
                    href={href}
                    onClick={handleClick}
                    target={isInternal ? undefined : '_blank'}
                    rel={isInternal ? undefined : 'noreferrer'}
                  >
                    <span className="resource-icon">
                      <Icon size={21} />
                    </span>
                    <div>
                      <h3>{resource.title[locale]}</h3>
                      <span className="mono resource-domain">{domain}</span>
                      <p>{resource.description[locale]}</p>
                    </div>
                    <ExternalLink
                      className="resource-open"
                      size={15}
                      aria-label={atlasCopy.open}
                    />
                  </a>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      {filtered.length === 0 && <p className="atlas-empty">{atlasCopy.empty}</p>}
    </AtlasPage>
  )
}
