import { describe, it, expect } from 'vitest'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { resumeFlow } from './resumeFlow'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))


describe('resumeFlow', () => {
  it('resumes a paused flow', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(1)),
      status: 'paused',
    }

    expect(resumeFlow(flow).status).toBe('running')
  })
})
