import { describe, it, expect } from 'vitest'

import type { FlowStep } from '../../../../types/transaction'

import { updateStep } from './updateStep'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('updateStep', () => {
  it('patches single step without affecting others', () => {
    const flow = createFlowState(makeSteps(3))
    const next = updateStep(flow, 1, { status: 'signing', hash: '0xdef' as `0x${string}` })

    expect(next.steps[0].status).toBe('pending')
    expect(next.steps[1].status).toBe('signing')
    expect(next.steps[1].hash).toBe('0xdef')
    expect(next.steps[2].status).toBe('pending')
  })

  it('preserves existing step fields when patching', () => {
    const flow = createFlowState(makeSteps(1))
    flow.steps[0].hash = '0xaaa' as `0x${string}`

    const next = updateStep(flow, 0, { status: 'tx-pending' })

    expect(next.steps[0].hash).toBe('0xaaa')
    expect(next.steps[0].status).toBe('tx-pending')
  })
})
