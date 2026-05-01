import { describe, it, expect } from 'vitest'

import type { TransactionError } from '@txkit/core'

import type { FlowState, FlowStep } from '../../../../types/transaction'

import { retryFrom } from './retryFrom'
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


describe('retryFrom', () => {
  it('resets step and all subsequent to pending', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(4)),
      status: 'error',
      currentStepIndex: 2,
    }
    // Simulate step 0,1 completed, 2 error, 3 canceled
    flow.steps[0].status = 'completed'
    flow.steps[0].hash = '0xabc' as `0x${string}`
    flow.steps[1].status = 'completed'
    flow.steps[2].status = 'error'
    flow.steps[2].error = makeError()
    flow.steps[3].status = 'canceled'

    const next = retryFrom(flow, 2)

    expect(next.status).toBe('running')
    expect(next.currentStepIndex).toBe(2)
    expect(next.steps[0].status).toBe('completed')
    expect(next.steps[0].hash).toBe('0xabc')
    expect(next.steps[1].status).toBe('completed')
    expect(next.steps[2].status).toBe('pending')
    expect(next.steps[2].error).toBeUndefined()
    expect(next.steps[3].status).toBe('pending')
  })

  it('retries from first step', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(2)),
      status: 'error',
      currentStepIndex: 0,
    }
    flow.steps[0].status = 'error'
    flow.steps[1].status = 'canceled'

    const next = retryFrom(flow, 0)

    expect(next.currentStepIndex).toBe(0)
    expect(next.steps[0].status).toBe('pending')
    expect(next.steps[1].status).toBe('pending')
  })
})
