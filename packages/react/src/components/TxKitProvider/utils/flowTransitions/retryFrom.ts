import type { FlowState } from '../../../../types/transaction'


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
