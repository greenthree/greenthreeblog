import { Languages } from 'lucide-react'

export function LanguageSwitch({ locale, onChange, label }) {
  return (
    <div className="language-switch" role="group" aria-label={label}>
      <Languages size={13} aria-hidden="true" />
      <button
        type="button"
        className={locale === 'zh' ? 'active' : ''}
        aria-pressed={locale === 'zh'}
        onClick={() => onChange('zh')}
      >
        中
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={locale === 'en' ? 'active' : ''}
        aria-pressed={locale === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
    </div>
  )
}
