export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-note'
}

export function normalizeArticleSlug(value, fallbackSeed = value) {
  const candidate = slugify(value)
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)) return candidate

  let hash = 2166136261
  for (const character of String(fallbackSeed)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `note-${(hash >>> 0).toString(36).padStart(7, '0')}`
}

export function decodeHashPart(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function formatArticleDate(value, language = 'zh-CN') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || 'UNDATED')
  if (language.toLowerCase().startsWith('zh')) {
    return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`
  }
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(date)
    .toUpperCase()
}

export function normalizeReadTime(value) {
  const match = String(value || '').match(/\d+/)
  const minutes = match ? Math.min(99, Math.max(1, Number.parseInt(match[0], 10))) : 5
  return `${String(minutes).padStart(2, '0')} MIN`
}

export function formatComplex(real, imaginary) {
  const normalize = value => (Math.abs(value) < 0.005 ? 0 : value)
  const formatPart = value => Math.abs(normalize(value)).toFixed(2)
  const realValue = normalize(real)
  const imaginaryValue = normalize(imaginary)
  const realPart = `${realValue < 0 ? '−' : ''}${formatPart(realValue)}`
  const imaginarySign = imaginaryValue < 0 ? '−' : '+'
  return `${realPart} ${imaginarySign} ${formatPart(imaginaryValue)}i`
}

export function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map(String)
    : String(value || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
}
