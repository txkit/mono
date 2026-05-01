import type { FlowState, StepState } from '../../../../types/transaction'


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
