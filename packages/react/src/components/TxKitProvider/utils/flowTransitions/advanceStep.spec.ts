import { describe, it, expect } from 'vitest'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { advanceStep } from './advanceStep'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('advanceStep', () => {
  it('increments currentStepIndex', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(3)),
      status: 'running',
    }
    const next = advanceStep(flow)

    expect(next.currentStepIndex).toBe(1)
    expect(next.status).toBe('running')
  })

  it('sets completed when advancing past last step', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(3)),
      status: 'running',
      currentStepIndex: 2,
    }
    const next = advanceStep(flow)

    expect(next.status).toBe('completed')
    expect(next.currentStepIndex).toBe(2)
  })

  it('sets completed for single-step flow', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(1)),
      status: 'running',
      currentStepIndex: 0,
    }
    const next = advanceStep(flow)

    expect(next.status).toBe('completed')
  })
})
