import type { TransactionError } from '@txkit/core'

import type { FlowState } from '../../../../types/transaction'


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
