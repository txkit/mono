import { useEffect, useRef, useState } from 'react'


type TypedTextProps = {
  text: string,
  onComplete?: () => void,
}

// Reveal speed - milliseconds between characters.
const CHAR_INTERVAL_MS = 16

/**
 * Reveals `text` one character at a time (LLM-streaming feel) with a blinking
 * caret until it is complete. The reveal runs once when the text first mounts; a
 * parent re-render - e.g. the reasoning card flipping from its blue prepared
 * theme to the green executed theme - does not restart it, because the effect
 * only depends on `text` (stable per turn). prefers-reduced-motion reveals the
 * whole string on the first tick. `onComplete` fires once when the full text is
 * revealed (the review block waits for it before expanding).
 */
export const TypedText = (props: TypedTextProps) => {
  const { text, onComplete } = props
  const [ revealedCount, setRevealedCount ] = useState(0)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const charsPerTick = prefersReducedMotion ? text.length : 1
    const interval = setInterval(() => {
      setRevealedCount((previous) => {
        const next = Math.min(previous + charsPerTick, text.length)
        if (next >= text.length) {
          clearInterval(interval)
        }

        return next
      })
    }, CHAR_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [ text ])

  // Completion is observed here (not inside the setState updater, which must
  // stay pure). The ref makes it one-shot: onComplete is an unstable parent
  // closure, so without the guard every later parent re-render would refire it.
  useEffect(() => {
    const isComplete = text.length > 0 && revealedCount >= text.length
    if (isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      onComplete?.()
    }
  }, [ revealedCount, text, onComplete ])

  const isTyping = revealedCount < text.length
  const caretNode = isTyping ? <span className="tx-caret" aria-hidden="true" /> : null

  return (
    <>
      {text.slice(0, revealedCount)}
      {caretNode}
    </>
  )
}
