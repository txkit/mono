'use client'

import type { AnimationEvent, ReactNode } from 'react'

import { BotTurnEntrance } from './BotTurnEntrance'
import { AgentReasoning, type ReasoningStatus } from './AgentReasoning/AgentReasoning'


// Module-level so a route-change remount renders an already-played greeting
// settled. Recorded on animationend (not on mount), so StrictMode's dev
// throwaway mount does not swallow the one real entrance.
const playedGreetings = new Set<string>()

type AgentGreetingProps = {
  greetingId: string,
  status?: ReasoningStatus,
  isInstant?: boolean,
  children: ReactNode,
}

/**
 * The agent's turn zero: a synthetic card that speaks first (support widget
 * pattern), so an empty page reads as a chat with a clear call to action, and
 * the card stays put once the conversation starts - turns never disappear in
 * this chat. Enters via BotTurnEntrance like the agent greeting an arriving
 * user, once per app load; later visits and restored transcripts (`isInstant`)
 * render it settled. `status` picks the card identity (greeting, x402 locked);
 * children render as-is, so a turn can carry interactive content like the
 * paywall button. Synthetic UI: not part of `messages`, so it is never
 * persisted and never sent to the API.
 */
export const AgentGreeting = (props: AgentGreetingProps) => {
  const { greetingId, status = 'greeting', isInstant, children } = props

  const isSettled = Boolean(isInstant) || playedGreetings.has(greetingId)

  const handleEntranceEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      playedGreetings.add(greetingId)
    }
  }

  return (
    <BotTurnEntrance isInstant={isSettled} onEntranceEnd={handleEntranceEnd}>
      <AgentReasoning reasoningLines={[]} status={status}>
        {children}
      </AgentReasoning>
    </BotTurnEntrance>
  )
}
