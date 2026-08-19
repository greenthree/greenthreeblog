import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const katexOptions = {
  output: 'htmlAndMathml',
  strict: false,
  throwOnError: false
}

// Expressions are authored in repository content, so KaTeX can emit its accessible MathML.
/** Render a trusted mathematical expression with KaTeX typography. */
export function MathFormula({ expression, display = false, className = '' }) {
  const markup = useMemo(
    () => katex.renderToString(String(expression ?? ''), { ...katexOptions, displayMode: display }),
    [expression, display]
  )
  const Tag = display ? 'div' : 'span'
  const classes = ['math-formula', display ? 'math-formula-display' : '', className].filter(Boolean).join(' ')
  return <Tag className={classes} dangerouslySetInnerHTML={{ __html: markup }} />
}

/** Markdown renderer with GFM plus inline and display-math support. */
export function MarkdownRenderer({ children, className = '' }) {
  const classes = ['markdown-body', className].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
