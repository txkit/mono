import { useEffect, useState } from 'react'


// The beat a real LLM chat pauses after the user's message before the
// assistant's turn shows up (network-latency feel).
export const REPLY_DELAY_MS = 500

/**
 * False for the first REPLY_DELAY_MS after mount, then true. Bot-turn cards
 * gate their RENDER on it - returning null during the pause - so the delayed
 * card never occupies invisible layout space (a CSS opacity delay left a
 * ghost gap that pushed the user's message up) and any step/typing stagger
 * inside it starts only once the card is actually visible.
 */
export const useReplyDelay = (): boolean => {
  const [ hasElapsed, setHasElapsed ] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasElapsed(true), REPLY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  return hasElapsed
}
