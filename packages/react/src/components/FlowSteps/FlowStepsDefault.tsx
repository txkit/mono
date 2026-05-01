import React from 'react'
import type { StepStatus } from '@txkit/core'

import type { FlowStepsRenderData } from '../../types/transaction'
import type { FlowStepsLabels } from './labels'

import maskStyle from '../../helpers/maskStyle'
import loaderIcon from '../../assets/icons/loader.svg'
import checkIcon from '../../assets/icons/check.svg'
import alertCircleIcon from '../../assets/icons/alert-circle.svg'
import xCircleIcon from '../../assets/icons/x-circle.svg'
import banIcon from '../../assets/icons/ban.svg'
import skipForwardIcon from '../../assets/icons/skip-forward.svg'


type FlowStepsDefaultProps = FlowStepsRenderData & {
  labels: Required<FlowStepsLabels>
  orientation: 'horizontal' | 'vertical'
}

const iconByStatus: Partial<Record<StepStatus, string>> = {
  simulating: loaderIcon,
  'confirming-risk': loaderIcon,
  signing: loaderIcon,
  'tx-pending': loaderIcon,
  waiting: loaderIcon,
  completed: checkIcon,
  skipped: skipForwardIcon,
  error: alertCircleIcon,
  'simulation-failed': alertCircleIcon,
  rejected: xCircleIcon,
  canceled: banIcon,
}

const spinningStatuses: StepStatus[] = [
  'simulating',
  'confirming-risk',
  'signing',
  'tx-pending',
  'waiting',
]

const isActiveStatus = (status: StepStatus): boolean => spinningStatuses.includes(status)

type StepStatusLabelKey = 'pending' | 'inProgress' | 'completed' | 'skipped' | 'failed' | 'rejected' | 'canceled'

const STEP_STATUS_LABEL_KEY: Record<StepStatus, StepStatusLabelKey> = {
  pending: 'pending',
  simulating: 'inProgress',
  'confirming-risk': 'inProgress',
  signing: 'inProgress',
  'tx-pending': 'inProgress',
  waiting: 'inProgress',
  completed: 'completed',
  skipped: 'skipped',
  error: 'failed',
  'simulation-failed': 'failed',
  rejected: 'rejected',
  canceled: 'canceled',
}

const stepStatusLabel = (status: StepStatus, labels: Required<FlowStepsLabels>): string =>
  labels[STEP_STATUS_LABEL_KEY[status]]

const FlowStepsDefault: React.FC<FlowStepsDefaultProps> = (props) => {
  const { steps, labels, orientation } = props

  return (
    <ol
      className="tx-fs-list"
      aria-label={labels.listLabel}
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
              className="tx-fs-item"
              data-status={step.status}
              aria-current={step.isCurrent ? 'step' : undefined}
            >
              <span className="tx-fs-indicator" aria-hidden="true">
                {
                  iconSrc
                    ? (
                      <span
                        style={maskStyle(iconSrc)}
                        className={
                          `tx-fs-indicator-icon${
                            spinning ? ' tx-fs-indicator-icon--spinning' : ''
                          }`
                        }
                      />
                    )
                    : <span className="tx-fs-indicator-number">{index + 1}</span>
                }
              </span>

              <div className="tx-fs-text">
                <span className="tx-fs-label">{step.label}</span>
                {step.description && (
                  <span className="tx-fs-description">{step.description}</span>
                )}
              </div>

              {showPill && (
                <span className="tx-fs-pill">{labels.inProgress}</span>
              )}

              <span className="tx-fs-sr">
                {`${labels.statusPrefix}: ${stepStatusLabel(step.status, labels)}`}
              </span>
            </li>
          )
        })
      }
    </ol>
  )
}


export default FlowStepsDefault
