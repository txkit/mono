import type { TransactionError } from '@txkit/core'

import type { FlowState } from '../../../../types/transaction'


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
