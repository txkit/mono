import { describe, it, expect } from 'vitest'

import type { FlowStep } from '../../../../types/transaction'

import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('createFlowState', () => {
  it('creates idle flow with pending steps', () => {
    const steps = makeSteps(3)
    const flow = createFlowState(steps)

    expect(flow.status).toBe('idle')
    expect(flow.currentStepIndex).toBe(0)
    expect(flow.totalSteps).toBe(3)
    expect(flow.steps).toHaveLength(3)
    expect(flow.steps[0].id).toBe('step-0')
    expect(flow.steps[0].status).toBe('pending')
    expect(flow.steps[0].confirmCountdown).toBe(0)
    expect(flow.steps[2].id).toBe('step-2')
  })

  it('creates empty flow for zero steps', () => {
    const flow = createFlowState([])

    expect(flow.totalSteps).toBe(0)
    expect(flow.steps).toHaveLength(0)
  })
})
