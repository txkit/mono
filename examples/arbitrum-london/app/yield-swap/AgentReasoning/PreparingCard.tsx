'use client'

import { useEffect, useState } from 'react'

import { AgentReasoning } from './AgentReasoning'


type PreparingCardProps = {
  steps: string[],
}

// Delay between successive pipeline steps appearing.
const STEP_INTERVAL_MS = 600

/**
 * The in-flight bot turn: the preparing reasoning card narrating the agent
 * pipeline (parse intent -> tool call -> build -> EIP-712 sign) one step at a
 * time, so the agent loop is observable in the UI rather than a silent spinner.
 * Mounts fresh for every in-flight turn (the parent renders it only while a
 * reply is awaited), so the reveal restarts naturally per turn. The real reply
 * replaces this card the moment it lands - the steps are pacing, not a gate.
 */
export const PreparingCard = (props: PreparingCardProps) => {
  const { steps } = props
  const [ visibleCount, setVisibleCount ] = useState(1)

  useEffect(() => {
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
  }, [ steps ])

  return <AgentReasoning reasoningLines={[]} pipelineSteps={steps.slice(0, visibleCount)} status="preparing" />
}
