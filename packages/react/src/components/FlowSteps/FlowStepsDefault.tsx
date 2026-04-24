import React from 'react'
import type { StepStatus } from '@txkit/core'

import type { FlowStepsRenderData } from '../../types/transaction'

import loaderIcon from '../../assets/icons/loader.svg'
import checkIcon from '../../assets/icons/check.svg'
import alertCircleIcon from '../../assets/icons/alert-circle.svg'
import xCircleIcon from '../../assets/icons/x-circle.svg'
import banIcon from '../../assets/icons/ban.svg'
import skipForwardIcon from '../../assets/icons/skip-forward.svg'


type FlowStepsDefaultProps = FlowStepsRenderData & {
  orientation: 'horizontal' | 'vertical'
}

const iconByStatus: Partial<Record<StepStatus, string>> = {
  simulating: loaderIcon,
  'confirming-risk': loaderIcon,
  signing: loaderIcon,
  'tx-pending': loaderIcon,
  waiting: loaderIcon,
  completed: checkIcon,
  error: alertCircleIcon,
  'simulation-failed': alertCircleIcon,
  rejected: xCircleIcon,
  canceled: banIcon,
  skipped: skipForwardIcon,
}

const spinningStatuses: StepStatus[] = [
  'simulating',
  'confirming-risk',
  'signing',
  'tx-pending',
  'waiting',
]

const isActiveStatus = (status: StepStatus): boolean => spinningStatuses.includes(status)

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
    case 'simulating':
    case 'confirming-risk':
    case 'signing':
    case 'tx-pending':
    case 'waiting':
      return 'In Progress'
    default:
      return 'Pending'
  }
}

const FlowStepsDefault: React.FC<FlowStepsDefaultProps> = ({
  steps,
  orientation,
}) => (
  <ol
    className="txkit-fs-list"
    aria-label="Transaction steps"
    data-orientation={orientation}
  >
    {
      steps.map((step, index) => {
        const iconSrc = iconByStatus[step.status]
        const spinning = isActiveStatus(step.status)
        const showPill = step.isCurrent && spinning

        return (
          <li
            key={step.id}
            className="txkit-fs-item"
            data-status={step.status}
            aria-current={step.isCurrent ? 'step' : undefined}
          >
            <span className="txkit-fs-indicator" aria-hidden="true">
              {
                iconSrc
                  ? (
                    <img
                      src={iconSrc}
                      alt=""
                      className={
                        `txkit-fs-indicator-icon${
                          spinning ? ' txkit-fs-indicator-icon--spinning' : ''
                        }`
                      }
                    />
                  )
                  : <span className="txkit-fs-indicator-number">{index + 1}</span>
              }
            </span>

            <div className="txkit-fs-text">
              <span className="txkit-fs-label">{step.label}</span>
              {step.description && (
                <span className="txkit-fs-description">{step.description}</span>
              )}
            </div>

            {showPill && (
              <span className="txkit-fs-pill">In Progress</span>
            )}

            <span className="txkit-fs-sr">
              {`Status: ${stepStatusLabel(step.status)}`}
            </span>
          </li>
        )
      })
    }
  </ol>
)


export default FlowStepsDefault
