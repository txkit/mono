import { describe, it, expect } from 'vitest'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { skipStep } from './skipStep'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('skipStep', () => {
  it('marks step as skipped and advances', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(3)),
      status: 'running',
      currentStepIndex: 0,
    }
    const next = skipStep(flow, 0)

    expect(next.steps[0].status).toBe('skipped')
    expect(next.currentStepIndex).toBe(1)
  })

  it('completes flow when skipping last step', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(2)),
      status: 'running',
      currentStepIndex: 1,
    }
    const next = skipStep(flow, 1)

    expect(next.steps[1].status).toBe('skipped')
    expect(next.status).toBe('completed')
  })
})
