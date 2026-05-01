import type { FlowState } from '../../../../types/transaction'


/** Advance to next step. Sets flow to completed if no more steps */
export const advanceStep = (flow: FlowState): FlowState => {
  const nextIndex = flow.currentStepIndex + 1

  if (nextIndex >= flow.totalSteps) {
    return { ...flow, status: 'completed' }
  }

  return { ...flow, currentStepIndex: nextIndex }
}
