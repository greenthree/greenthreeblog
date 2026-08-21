export function AtlasHero({ eyebrow, title, description, stats }) {
  return (
    <section className="atlas-hero">
      <div>
        <span className="mono atlas-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="atlas-stats">
        {stats.map(stat => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
