import type { FlowState } from '../../../../types/transaction'


/** Start a flow (set status to running) */
export const startFlow = (flow: FlowState): FlowState => ({
  ...flow,
  status: 'running',
})
