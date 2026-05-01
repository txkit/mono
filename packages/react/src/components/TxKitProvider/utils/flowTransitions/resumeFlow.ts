import type { FlowState } from '../../../../types/transaction'


/** Resume a paused flow */
export const resumeFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'running',
})
