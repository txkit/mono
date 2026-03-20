import React from 'react'
import type { StepStatus } from '@txkit/core'

import type { FlowStepsRenderData } from './flow-types'


type FlowStepsDefaultProps = FlowStepsRenderData & {
  orientation: 'horizontal' | 'vertical'
}

const stepStatusLabel = (status: StepStatus): string => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'error':
    case 'simulation-failed':
      return 'Failed'
    case 'rejected':
      return 'Rejected'
    case 'canceled':
      return 'Canceled'
    case 'skipped':
      return 'Skipped'
    default:
      return ''
  }
}

const FlowStepsDefault: React.FC<FlowStepsDefaultProps> = ({
  steps,
  currentStepIndex,
  totalSteps,
  completedCount,
  orientation,
}) => (
  <>
    <ol
      className="txkit-fs-list"
      aria-label="Transaction steps"
      data-orientation={orientation}
    >
      {
        steps.map((step, index) => (
          <li
            key={step.id}
            className="txkit-fs-item"
            data-status={step.status}
            aria-current={step.isCurrent ? 'step' : undefined}
          >
            <span className="txkit-fs-indicator" aria-hidden="true">
              {
                (() => {
                  const indicatorMap: Record<string, string | number> = {
                    completed: '\u2713',
                    error: '\u2717',
                    rejected: '\u2717',
                  }
                  return indicatorMap[step.status] ?? index + 1
                })()
              }
            </span>
            <span className="txkit-fs-label">{step.label}</span>
            {
              stepStatusLabel(step.status) && (
                <span className="txkit-fs-sr">{stepStatusLabel(step.status)}</span>
              )
            }
          </li>
        ))
      }
    </ol>

    <div role="status" aria-live="polite" className="txkit-fs-sr">
      {`Step ${currentStepIndex + 1} of ${totalSteps}: ${completedCount} completed`}
    </div>
  </>
)


export default FlowStepsDefault
