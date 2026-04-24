import { describe, it, expect } from 'vitest'

import type { TransactionError } from '@txkit/core'

import type { FlowState, FlowStep } from '../../../types/transaction'
import {
  advanceStep,
  cancelFlow,
  createFlowState,
  failStep,
  pauseFlow,
  resetFlow,
  rejectStep,
  resumeFlow,
  retryFrom,
  skipStep,
  startFlow,
  updateStep,
} from './flowTransitions'


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


describe('startFlow', () => {
  it('sets status to running', () => {
    const flow = createFlowState(makeSteps(2))
    const next = startFlow(flow)

    expect(next.status).toBe('running')
    expect(next.currentStepIndex).toBe(0)
  })
})


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


describe('cancelFlow', () => {
  it('cancels all non-completed steps from index', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(4)),
      status: 'running',
      currentStepIndex: 2,
    }
    flow.steps[0].status = 'completed'
    flow.steps[1].status = 'skipped'
    flow.steps[2].status = 'signing'
    flow.steps[3].status = 'pending'

    const next = cancelFlow(flow, 2)

    expect(next.status).toBe('error')
    expect(next.steps[0].status).toBe('completed')
    expect(next.steps[1].status).toBe('skipped')
    expect(next.steps[2].status).toBe('canceled')
    expect(next.steps[3].status).toBe('canceled')
  })
})


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


describe('pauseFlow / resumeFlow', () => {
  it('pauses a running flow', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(1)),
      status: 'running',
    }

    expect(pauseFlow(flow).status).toBe('paused')
  })

  it('resumes a paused flow', () => {
    const flow: FlowState = {
      ...createFlowState(makeSteps(1)),
      status: 'paused',
    }

    expect(resumeFlow(flow).status).toBe('running')
  })
})
