'use client'

import { useEffect, useState, type ReactNode, type TransitionEvent } from 'react'


type CollapseProps = {
  isOpen: boolean,
  children: ReactNode,
}

/**
 * Smoothly expands and collapses its content using the CSS grid-template-rows
 * 0fr <-> 1fr trick - no height measuring and no animation library, it
 * animates straight to the natural (auto) height. Children stay mounted
 * through the exit transition (so the envelope review collapses out with its
 * content visible, the same way it expanded in) and unmount when the close
 * finishes. Honors prefers-reduced-motion via the .tx-collapse CSS in
 * globals.css.
 */
export const Collapse = (props: CollapseProps) => {
  const { isOpen, children } = props
  // data-open lags isOpen by one frame on open so the 0fr -> 1fr transition
  // runs even when the component mounts already open.
  const [ isExpanded, setIsExpanded ] = useState(false)
  // Children stay rendered while the exit transition plays out.
  const [ isExiting, setIsExiting ] = useState(false)
  const [ wasOpen, setWasOpen ] = useState(isOpen)

  // React-sanctioned render-phase adjustment: the moment isOpen flips false,
  // hold the children for the exit transition without an extra effect pass.
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (!isOpen) {
      setIsExiting(true)
    }
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsExpanded(isOpen))

    return () => cancelAnimationFrame(frame)
  }, [ isOpen ])

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    const isOwnTransition = event.target === event.currentTarget
    if (isOwnTransition && !isOpen) {
      setIsExiting(false)
    }
  }

  const shouldRenderChildren = isOpen || isExiting

  return (
    <div className="tx-collapse" data-open={isExpanded} onTransitionEnd={handleTransitionEnd}>
      <div className="tx-collapse-inner">
        {shouldRenderChildren ? children : null}
      </div>
    </div>
  )
}
