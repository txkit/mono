'use client'

import type { AnimationEvent, ReactNode } from 'react'

import { useReplyDelay } from './utils/useReplyDelay'


type BotTurnEntranceProps = {
  isInstant?: boolean,
  onEntranceEnd?: (event: AnimationEvent<HTMLDivElement>) => void,
  children: ReactNode,
}

/**
 * Entrance shell for a bot turn that appears from nothing right after a user
 * action: holds the reply-delay beat (rendering nothing, so no ghost layout
 * space), then slides the turn in - the chat-wide rule that the bot never
 * answers in the same frame the user acts. `isInstant` (restored history or
 * an entrance that already played) renders the turn settled immediately.
 * The wrapper persists across re-renders, so in-place updates of a visible
 * turn never replay the entrance.
 */
export const BotTurnEntrance = (props: BotTurnEntranceProps) => {
  const { isInstant, onEntranceEnd, children } = props

  const hasAppeared = useReplyDelay()

  if (!isInstant && !hasAppeared) {
    return null
  }

  return (
    <div className={isInstant ? undefined : 'tx-anim-enter-y'} onAnimationEnd={isInstant ? undefined : onEntranceEnd}>
      {children}
    </div>
  )
}
