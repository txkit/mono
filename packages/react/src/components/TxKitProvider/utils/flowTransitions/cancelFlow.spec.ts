import { describe, it, expect } from 'vitest'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { cancelFlow } from './cancelFlow'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('cancelFlow', () => {
  it('cancels all non-completed steps from index', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(4)),
      status: 'running',
      currentStepIndex: 2,
    }
    flow.steps[0].status = 'completed'
    flow.steps[1].status = 'skipped'
    flow.steps[2].status = 'signing'
    flow.steps[3].status = 'pending'

    const next = cancelFlow(flow, 2)

    expect(next.status).toBe('canceled')
    expect(next.steps[0].status).toBe('completed')
    expect(next.steps[1].status).toBe('skipped')
    expect(next.steps[2].status).toBe('canceled')
    expect(next.steps[3].status).toBe('canceled')
  })
})
