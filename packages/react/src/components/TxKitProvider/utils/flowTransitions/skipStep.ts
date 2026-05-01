import type { FlowState } from '../../../../types/transaction'

import { advanceStep } from './advanceStep'
import { updateStep } from './updateStep'


/** Skip a step (mark as skipped, advance to next) */
export const skipStep = (flow: FlowState, stepIndex: number): FlowState => {
  const updated = updateStep(flow, stepIndex, { status: 'skipped' })
  return advanceStep(updated)
}
