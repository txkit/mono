'use client'

import type { AnimationEvent, ReactNode } from 'react'

import { useReplyDelay } from './utils/useReplyDelay'
import { AgentReasoning } from './AgentReasoning/AgentReasoning'


// Module-level so a route-change remount renders an already-played greeting
// settled. Recorded on animationend (not on mount), so StrictMode's dev
// throwaway mount does not swallow the one real entrance.
const playedGreetings = new Set<string>()

type AgentGreetingProps = {
  greetingId: string,
  isInstant?: boolean,
  children: ReactNode,
}

/**
 * The agent's turn zero: a greeting card pinned above the transcript (support
 * widget pattern - the bot speaks first), so an empty page reads as a chat
 * with a clear call to action, and the card stays put once the conversation
 * starts - turns never disappear in this chat. On its first appearance it
 * holds the reply-delay beat (rendering nothing, so no ghost layout space)
 * and slides in - like the agent greeting an arriving user - then renders
 * settled on every later visit; `isInstant` (a transcript restored from
 * storage) also renders it settled. Synthetic UI: not part of `messages`, so
 * it is never persisted and never sent to the API.
 */
export const AgentGreeting = (props: AgentGreetingProps) => {
  const { greetingId, isInstant, children } = props

  const shouldAnimate = !isInstant && !playedGreetings.has(greetingId)
  const hasAppeared = useReplyDelay()

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      playedGreetings.add(greetingId)
    }
  }

  if (shouldAnimate && !hasAppeared) {
    return null
  }

  return (
    <div
      className={shouldAnimate ? 'tx-anim-enter-y' : undefined}
      onAnimationEnd={shouldAnimate ? handleAnimationEnd : undefined}
    >
      <AgentReasoning reasoningLines={[]} status="greeting">
        <p className="text-sm leading-relaxed text-foreground">{children}</p>
      </AgentReasoning>
    </div>
  )
}
