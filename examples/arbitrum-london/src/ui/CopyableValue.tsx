'use client'

import { useEffect, useRef, useState } from 'react'


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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    let copiedOk = true
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      copiedOk = false
    }
    if (!copiedOk) {
      return
    }

    setCopied(true)
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const copiedNode = isCopied
    ? <span className="text-xs text-success">copied</span>
    : null
  const linkNode = explorerUrl !== undefined
    ? (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on block explorer"
        className="text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
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
        className="font-mono truncate hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {display}
      </button>
      {linkNode}
    </span>
  )
}
