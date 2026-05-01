import type { FlowState } from '../../../../types/transaction'


/** Pause a flow (waitAfterMs or waitForCondition) */
export const pauseFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'paused',
})
