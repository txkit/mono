import type { FlowStep, FlowState } from '../../../../types/transaction'


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
