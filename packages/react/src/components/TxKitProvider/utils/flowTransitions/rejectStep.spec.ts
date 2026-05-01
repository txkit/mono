import { describe, it, expect } from 'vitest'

import type { TransactionError } from '@txkit/core'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { rejectStep } from './rejectStep'
import { createFlowState } from './createFlowState'


const makeSteps = (count: number): FlowStep[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    type: 'tx' as const,
    label: `Step ${index}`,
    tx: { to: '0x0000000000000000000000000000000000000001' as const, value: 0n },
  }))

const makeError = (code = 'UNKNOWN'): TransactionError => ({
  code: code as TransactionError['code'],
  message: 'Test error',
})


describe('rejectStep', () => {
  it('sets step to rejected and cascades cancel', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(3)),
      status: 'running',
      currentStepIndex: 0,
    }
    const next = rejectStep(flow, 0, makeError('USER_REJECTED'))

    expect(next.status).toBe('rejected')
    expect(next.steps[0].status).toBe('rejected')
    expect(next.steps[1].status).toBe('canceled')
    expect(next.steps[2].status).toBe('canceled')
  })
})
