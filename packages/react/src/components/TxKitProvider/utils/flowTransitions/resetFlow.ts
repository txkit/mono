import type { FlowState } from '../../../../types/transaction'


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
