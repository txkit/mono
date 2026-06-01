'use client'

import { useState } from 'react'


type CopyableValueProps = {
  value: string,
  display: string,
  explorerUrl?: string,
}

/**
 * A monospace value (address / hash) that copies to the clipboard on click
 * and shows a brief "copied" confirmation. An optional explorer link sits
 * alongside. No inline SVG (txKit rule); the link affordance is a text glyph.
 */
export const CopyableValue = (props: CopyableValueProps) => {
  const { value, display, explorerUrl } = props
  const [ isCopied, setCopied ] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copiedNode = isCopied
    ? <span className="text-xs text-[color:var(--color-success)]">copied</span>
    : null
  const linkNode = explorerUrl !== undefined
    ? (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Arbiscan"
        className="text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)] transition-colors"
      >
        ↗
      </a>
    )
    : null

  return (
    <span className="flex items-center justify-end gap-2 min-w-0">
      {copiedNode}
      <button
        type="button"
        onClick={handleCopy}
        title={`Copy ${value}`}
        className="font-mono truncate hover:text-[color:var(--color-accent)] transition-colors"
      >
        {display}
      </button>
      {linkNode}
    </span>
  )
}
