'use client'

import { Fragment, useState } from 'react'
import { Highlight } from 'prism-react-renderer'

function CopyButton({
  code,
  singleLine,
}: {
  code: string
  singleLine: boolean
}) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      aria-label="Copy code"
      className={`group/button absolute right-4 overflow-hidden rounded-full py-1 pr-3 pl-2 text-2xs font-medium opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100 ${
        singleLine ? 'top-1/2 -translate-y-1/2' : 'top-3.5'
      } ${
        copied
          ? 'bg-emerald-400/10 ring-1 ring-emerald-400/20 ring-inset'
          : 'bg-white/5 hover:bg-white/7.5 dark:bg-white/2.5 dark:hover:bg-white/5'
      }`}
      onClick={() => {
        navigator.clipboard.writeText(code).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
    >
      <span
        aria-hidden={copied}
        className={`pointer-events-none flex items-center gap-0.5 text-slate-400 transition duration-300 ${
          copied ? '-translate-y-1.5 opacity-0' : ''
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5 fill-slate-500/20 stroke-slate-500 transition-colors group-hover/button:stroke-slate-400"
        >
          <path
            strokeWidth="0"
            d="M5.5 13.5v-5a2 2 0 0 1 2-2l.447-.894A2 2 0 0 1 9.737 4.5h.527a2 2 0 0 1 1.789 1.106l.447.894a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2Z"
          />
          <path
            fill="none"
            strokeLinejoin="round"
            d="M12.5 6.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2m5 0-.447-.894a2 2 0 0 0-1.79-1.106h-.527a2 2 0 0 0-1.789 1.106L7.5 6.5m5 0h-5"
          />
        </svg>
        Copy
      </span>
      <span
        aria-hidden={!copied}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-emerald-400 transition duration-300 ${
          copied ? '' : 'translate-y-1.5 opacity-0'
        }`}
      >
        Copied!
      </span>
    </button>
  )
}

export function Fence({
  children,
  language,
}: {
  children: string
  language: string
}) {
  const code = children.trimEnd()

  return (
    <Highlight
      code={code}
      language={language || 'text'}
      theme={{ plain: {}, styles: [] }}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <div className="group relative">
          <pre className={className} style={style}>
            <code>
              {tokens.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {line
                    .filter((token) => !token.empty)
                    .map((token, tokenIndex) => (
                      <span key={tokenIndex} {...getTokenProps({ token })} />
                    ))}
                  {'\n'}
                </Fragment>
              ))}
            </code>
          </pre>
          <CopyButton code={code} singleLine={tokens.length <= 2} />
        </div>
      )}
    </Highlight>
  )
}
