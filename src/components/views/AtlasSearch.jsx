import { Search } from 'lucide-react'

export function AtlasSearch({ value, onChange, placeholder, resultLabel, resultCount }) {
  return (
    <section className="atlas-search-panel">
      <label>
        <span className="mono">{placeholder}</span>
        <div>
          <Search size={18} />
          <input
            type="search"
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </div>
      </label>
      <span className="atlas-result-count mono" aria-live="polite" aria-atomic="true">
        {String(resultCount).padStart(2, '0')} / INDEXED
      </span>
    </section>
  )
}
