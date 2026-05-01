import { describe, it, expect } from 'vitest'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { pauseFlow } from './pauseFlow'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('pauseFlow', () => {
  it('pauses a running flow', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(1)),
      status: 'running',
    }

    expect(pauseFlow(flow).status).toBe('paused')
  })
})
