import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Check, Copy } from 'lucide-react'

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Clipboard permissions can be denied even when the API is present;
      // continue with the legacy textarea fallback below.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } finally {
    textarea.remove()
  }
  if (!copied) throw new Error('Clipboard copy failed')
}

function CodeBlock({ node, inline, className, children, copy, ...props }) {
  const [copyState, setCopyState] = useState('idle')
  const resetTimer = useRef(null)
  const match = /language-([\w-]+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  const rawCode = String(children)
  const codeText = rawCode.replace(/\n$/, '')
  const isBlock = !inline && (Boolean(match) || rawCode.includes('\n'))

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const handleCopy = async () => {
    try {
      await copyText(codeText)
      setCopyState('success')
    } catch {
      setCopyState('error')
    }
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopyState('idle'), 2000)
  }

  if (!isBlock) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang mono">{language.toUpperCase()}</span>
        <button
          type="button"
          className="code-copy-btn mono"
          onClick={handleCopy}
          aria-label={copyState === 'success' ? copy.copied : copyState === 'error' ? copy.copyFailed : copy.copyCode}
        >
          {copyState === 'success' ? (
            <>
              <Check size={12} />
              <span>{copy.copied}</span>
            </>
          ) : copyState === 'error' ? (
            <>
              <Copy size={12} />
              <span>{copy.copyFailed}</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>{copy.copyCode}</span>
            </>
          )}
        </button>
      </div>
      <pre className={className}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

const DEFAULT_COPY = {
  copyCode: 'COPY',
  copied: 'COPIED',
  copyFailed: 'COPY FAILED'
}

export function MarkdownRenderer({ children, className = '', copy = DEFAULT_COPY }) {
  const classes = ['markdown-body', className].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          // CodeBlock owns the wrapper and the single <pre>; suppress the
          // renderer's default outer <pre> to keep valid document structure.
          pre: ({ children: preChildren }) => preChildren,
          code: props => <CodeBlock {...props} copy={copy} />
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
