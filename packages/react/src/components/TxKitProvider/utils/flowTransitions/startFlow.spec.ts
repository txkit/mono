import { describe, it, expect } from 'vitest'

import type { FlowStep } from '../../../../types/transaction'

import { createFlowState } from './createFlowState'
import { startFlow } from './startFlow'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('startFlow', () => {
  it('sets status to running', () => {
    const flow = createFlowState(makeSteps(2))
    const next = startFlow(flow)

    expect(next.status).toBe('running')
    expect(next.currentStepIndex).toBe(0)
  })
})
