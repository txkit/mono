import { describe, it, expect } from 'vitest'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { resetFlow } from './resetFlow'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('resetFlow', () => {
  it('resets all steps to pending and flow to idle', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(3)),
      status: 'completed',
      currentStepIndex: 2,
    }
    flow.steps[0].status = 'completed'
    flow.steps[0].hash = '0xfff' as `0x${string}`
    flow.steps[1].status = 'completed'
    flow.steps[2].status = 'completed'

    const next = resetFlow(flow)

    expect(next.status).toBe('idle')
    expect(next.currentStepIndex).toBe(0)
    expect(next.steps[0].status).toBe('pending')
    expect(next.steps[0].hash).toBeUndefined()
    expect(next.steps[1].status).toBe('pending')
    expect(next.steps[2].status).toBe('pending')
  })

  it('preserves step ids', () => {
    const flow = createFlowState(makeSteps(2))
    flow.steps[0].status = 'error'

    const next = resetFlow(flow)

    expect(next.steps[0].id).toBe('step-0')
    expect(next.steps[1].id).toBe('step-1')
  })
})
