'use client'

import { useEffect, useState, type ReactNode } from 'react'


type CollapseProps = {
  children: ReactNode,
}

/**
 * Smoothly expands its content from zero to full height on mount using the CSS
 * grid-template-rows 0fr -> 1fr trick - no height measuring and no animation
 * library, it animates straight to the natural (auto) height. Used to reveal
 * the prepared-envelope review block once the agent prepares a transaction.
 * Honors prefers-reduced-motion via the .tx-collapse CSS in globals.css.
 */
export const Collapse = (props: CollapseProps) => {
  const { children } = props
  const [ isExpanded, setIsExpanded ] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsExpanded(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="tx-collapse" data-open={isExpanded}>
      <div className="tx-collapse-inner">
        {children}
      </div>
    </div>
  )
}
