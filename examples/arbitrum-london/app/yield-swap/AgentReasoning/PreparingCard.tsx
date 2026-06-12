'use client'

import { useEffect, useState } from 'react'

import { useReplyDelay } from '../utils/useReplyDelay'
import { AgentReasoning } from './AgentReasoning'


type PreparingCardProps = {
  steps: string[],
}

// Delay between successive pipeline steps appearing. Exported so the chats
// can hold a fast reply until the in-flight narration has played out.
export const STEP_INTERVAL_MS = 600

/**
 * The in-flight bot turn: the preparing reasoning card narrating the agent
 * pipeline (parse intent -> tool call -> build -> EIP-712 sign) one step at a
 * time, so the agent loop is observable in the UI rather than a silent spinner.
 * Mounts fresh for every in-flight turn (the parent renders it only while a
 * reply is awaited). It renders nothing for the first reply-delay beat - the
 * pause a real LLM chat takes after the user's message - then slides in and
 * starts staggering its steps, so the user watches them fill one by one (the
 * card never pre-fills behind the delay). The real reply replaces this card
 * the moment it lands - the steps are pacing, not a gate.
 */
export const PreparingCard = (props: PreparingCardProps) => {
  const { steps } = props
  const [ visibleCount, setVisibleCount ] = useState(1)
  const hasAppeared = useReplyDelay()

  useEffect(() => {
    if (!hasAppeared) {
      return
    }

    const interval = setInterval(() => {
      setVisibleCount((previous) => {
        const next = Math.min(previous + 1, steps.length)
        if (next >= steps.length) {
          clearInterval(interval)
        }

        return next
      })
    }, STEP_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [ steps, hasAppeared ])

  if (!hasAppeared) {
    return null
  }

  return (
    <div className="tx-anim-enter-y">
      <AgentReasoning reasoningLines={[]} pipelineSteps={steps.slice(0, visibleCount)} status="preparing" />
    </div>
  )
}
