import { describe, it, expect } from 'vitest'

import type { TransactionError } from '@txkit/core'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { failStep } from './failStep'
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


describe('failStep', () => {
  it('sets step to error and cascades cancel', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(4)),
      status: 'running',
      currentStepIndex: 1,
    }
    const next = failStep(flow, 1, makeError('EXECUTION_REVERTED'))

    expect(next.status).toBe('error')
    expect(next.steps[0].status).toBe('pending')
    expect(next.steps[1].status).toBe('error')
    expect(next.steps[1].error?.code).toBe('EXECUTION_REVERTED')
    expect(next.steps[2].status).toBe('canceled')
    expect(next.steps[3].status).toBe('canceled')
  })

  it('sets flow status to rejected for USER_REJECTED', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(2)),
      status: 'running',
    }
    const next = failStep(flow, 0, makeError('USER_REJECTED'))

    expect(next.status).toBe('rejected')
  })

  it('handles failure on last step without cascade', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(2)),
      status: 'running',
      currentStepIndex: 1,
    }
    const next = failStep(flow, 1, makeError())

    expect(next.steps[0].status).toBe('pending')
    expect(next.steps[1].status).toBe('error')
  })
})
