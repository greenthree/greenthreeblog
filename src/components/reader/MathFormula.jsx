import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const katexOptions = {
  output: 'htmlAndMathml',
  strict: false,
  throwOnError: false
}

export function MathFormula({ expression, display = false, className = '' }) {
  const markup = useMemo(
    () => katex.renderToString(String(expression ?? ''), { ...katexOptions, displayMode: display }),
    [expression, display]
  )
  const Tag = display ? 'div' : 'span'
  const classes = ['math-formula', display ? 'math-formula-display' : '', className]
    .filter(Boolean)
    .join(' ')
  return <Tag className={classes} dangerouslySetInnerHTML={{ __html: markup }} />
}
