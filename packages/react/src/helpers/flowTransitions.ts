import type { TransactionError } from '@txkit/core'

import type { FlowStep, FlowState, StepState } from '../types/transaction'


/** Create initial flow state from step definitions */
export const createFlowState = (steps: FlowStep[]): FlowState => ({
  status: 'idle',
  currentStepIndex: 0,
  totalSteps: steps.length,
  steps: steps.map((step) => ({
    id: step.id,
    status: 'pending',
    confirmCountdown: 0,
  })),
})


/** Advance to next step. Sets flow to completed if no more steps */
export const advanceStep = (flow: FlowState): FlowState => {
  const nextIndex = flow.currentStepIndex + 1

  if (nextIndex >= flow.totalSteps) {
    return { ...flow, status: 'completed' }
  }

  return { ...flow, currentStepIndex: nextIndex }
}


/** Fail a step and cascade cancel all subsequent steps */
export const failStep = (
  flow: FlowState,
  stepIndex: number,
  error: TransactionError
): FlowState => ({
  ...flow,
  status: error.code === 'USER_REJECTED' ? 'rejected' : 'error',
  steps: flow.steps.map((step, index) => {
    if (index === stepIndex) {
      return { ...step, status: 'error', error }
    }
    if (index > stepIndex) {
      return { ...step, status: 'canceled' }
    }
    return step
  }),
})


/** Reject a step (user rejected in wallet) and cascade cancel */
export const rejectStep = (
  flow: FlowState,
  stepIndex: number,
  error: TransactionError
): FlowState => ({
  ...flow,
  status: 'rejected',
  steps: flow.steps.map((step, index) => {
    if (index === stepIndex) {
      return { ...step, status: 'rejected', error }
    }
    if (index > stepIndex) {
      return { ...step, status: 'canceled' }
    }
    return step
  }),
})


/** Retry from a specific step index. Resets that step and all subsequent to pending */
export const retryFrom = (flow: FlowState, stepIndex: number): FlowState => ({
  ...flow,
  status: 'running',
  currentStepIndex: stepIndex,
  steps: flow.steps.map((step, index) => {
    if (index >= stepIndex) {
      return {
        ...step,
        status: 'pending',
        error: undefined,
        hash: undefined,
        receipt: undefined,
        signature: undefined,
        gasEstimate: undefined,
        riskResult: undefined,
        decodedCalldata: undefined,
        confirmCountdown: 0,
      }
    }
    return step
  }),
})


/** Update a single step's state with a partial patch */
export const updateStep = (
  flow: FlowState,
  stepIndex: number,
  patch: Partial<StepState>
): FlowState => ({
  ...flow,
  steps: flow.steps.map((step, index) =>
    index === stepIndex ? { ...step, ...patch } : step
  ),
})


/** Skip a step (mark as skipped, advance to next) */
export const skipStep = (flow: FlowState, stepIndex: number): FlowState => {
  const updated = updateStep(flow, stepIndex, { status: 'skipped' })
  return advanceStep(updated)
}


/** Cancel current step and all remaining. Used when user explicitly cancels */
export const cancelFlow = (flow: FlowState, fromIndex: number): FlowState => ({
  ...flow,
  status: 'error',
  steps: flow.steps.map((step, index) => {
    if (index >= fromIndex && step.status !== 'completed' && step.status !== 'skipped') {
      return { ...step, status: 'canceled' }
    }
    return step
  }),
})


/** Reset entire flow to idle state */
export const resetFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'idle',
  currentStepIndex: 0,
  steps: flow.steps.map((step) => ({
    id: step.id,
    status: 'pending',
    confirmCountdown: 0,
  })),
})


/** Start a flow (set status to running) */
export const startFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'running',
})


/** Pause a flow (waitAfterMs or waitForCondition) */
export const pauseFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'paused',
})


/** Resume a paused flow */
export const resumeFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'running',
})
