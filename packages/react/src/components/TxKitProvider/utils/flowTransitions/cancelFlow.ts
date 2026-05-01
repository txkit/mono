import type { FlowState } from '../../../../types/transaction'


/** Cancel current step and all remaining. Used when user explicitly cancels */
export const cancelFlow = (flow: FlowState, fromIndex: number): FlowState => ({
  ...flow,
  status: 'canceled',
  steps: flow.steps.map((step, index) => {
    if (index >= fromIndex && step.status !== 'completed' && step.status !== 'skipped') {
      return { ...step, status: 'canceled' }
    }
    return step
  }),
})
