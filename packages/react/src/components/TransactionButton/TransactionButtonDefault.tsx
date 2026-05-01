import React from 'react'
import type { StepStatus, TransactionError, RiskResult, DecodedCalldata } from '@txkit/core'

import type { TransactionButtonLabels } from './labels'

import maskStyle from '../../helpers/maskStyle'
import ExternalLink from '../../helpers/ExternalLink'
import DecodedCalldataPreview from './DecodedCalldataPreview/DecodedCalldataPreview'
import ExternalLinkIcon from '../ExternalLinkIcon/ExternalLinkIcon'

import loaderIcon from '../../assets/icons/loader.svg'
import checkIcon from '../../assets/icons/check.svg'
import arrowRightIcon from '../../assets/icons/arrow-right.svg'


const idleStates: readonly StepStatus[] = [ 'pending', 'error', 'simulation-failed', 'rejected' ]


type ProgressDotState = 'completed' | 'current' | 'pending'

const getProgressDotState = (index: number, currentIndex: number): ProgressDotState => {
  if (index < currentIndex) {
    return 'completed'
  }
  if (index === currentIndex) {
    return 'current'
  }
  return 'pending'
}

const ArrowRightIcon = () => (
  <span
    className="tx-txb-icon"
    aria-hidden="true"
    style={maskStyle(arrowRightIcon)}
  />
)


export type TransactionButtonDefaultProps = {
  state: StepStatus
  buttonLabel: string
  description?: string
  explorerUrl: string | undefined
  statusMessage: string
  error: TransactionError | undefined
  riskResult: RiskResult | undefined
  mergedLabels: Required<TransactionButtonLabels>
  decodedCalldata: DecodedCalldata | undefined
  confirmCountdown: number
  isProcessing: boolean
  showExplorerLink: boolean
  isButtonDisabled: boolean
  /** 0-indexed current step. Used to render progress dots above button for multi-step flows. */
  currentStepIndex: number
  /** Total steps in the flow. When > 1, progress dots are rendered. */
  totalSteps: number
  /** Whether the current step has step.optional === true. Surfaces the Skip affordance. */
  currentStepOptional: boolean
  onClick: () => void
  onCancel: () => void
  onForceSubmit: () => void
  onSkipStep: () => void
}

const explorerStates: readonly StepStatus[] = [ 'tx-pending', 'completed', 'error' ]

const skippableStates: readonly StepStatus[] = [
  'pending',
  'simulating',
  'confirming-risk',
  'simulation-failed',
  'signing',
  'tx-pending',
  'waiting',
  'error',
  'rejected',
]

const TransactionButtonDefault: React.FC<TransactionButtonDefaultProps> = (props) => {
  const {
    error,
    state,
    onClick,
    onCancel,
    onSkipStep,
    totalSteps,
    riskResult,
    onForceSubmit: _onForceSubmit,
    description,
    explorerUrl,
    buttonLabel,
    isProcessing,
    mergedLabels,
    statusMessage,
    decodedCalldata,
    confirmCountdown,
    isButtonDisabled,
    showExplorerLink,
    currentStepIndex,
    currentStepOptional,
  } = props

  const showDetails = state === 'confirming-risk' && Boolean(decodedCalldata || riskResult)
  const showExplorer = showExplorerLink && explorerUrl && explorerStates.includes(state)
  const showProgressDots = totalSteps > 1
  const showSkip = currentStepOptional && skippableStates.includes(state)

  return (
    <>
      {
        description && (
          <p className="tx-txb-description">{description}</p>
        )
      }
      {
        showProgressDots && (
          <div
            className="tx-txb-progress"
            role="progressbar"
            aria-valuenow={currentStepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}
          >
            {
              Array.from({ length: totalSteps }).map((_, index) => (
                <span
                  key={index}
                  className="tx-txb-progress-dot"
                  data-state={getProgressDotState(index, currentStepIndex)}
                />
              ))
            }
            <span className="tx-txb-progress-label">
              {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
        )
      }
      <button
        type="button"
        className="tx-txb-button"
        data-state={state}
        disabled={isButtonDisabled}
        onClick={onClick}
        aria-busy={isProcessing}
      >
        {
          state === 'completed' && (
            <span
              className="tx-txb-icon"
              aria-hidden="true"
              style={maskStyle(checkIcon)}
            />
          )
        }
        {
          isProcessing && (
            <span
              className="tx-txb-icon tx-txb-icon--spinning"
              aria-hidden="true"
              style={maskStyle(loaderIcon)}
            />
          )
        }
        <span>{buttonLabel}</span>
        {
          idleStates.includes(state) && <ArrowRightIcon />
        }
        {
          state === 'confirming-risk' && confirmCountdown > 0 && (
            <span className="tx-txb-countdown" aria-hidden="true">{confirmCountdown}</span>
          )
        }
      </button>

      {
        showSkip && (
          <button
            type="button"
            className="tx-txb-skip"
            onClick={onSkipStep}
          >
            {mergedLabels.skipStep}
          </button>
        )
      }

      {
        showDetails && (
          <div
            className="tx-txb-details"
            data-expanded="true"
            role="region"
            aria-label="Transaction details"
          >
            {
              decodedCalldata && (
                <DecodedCalldataPreview
                  decoded={decodedCalldata}
                  warnings={riskResult?.warnings}
                  riskLevel={riskResult?.level}
                />
              )
            }
            {
              state === 'confirming-risk' && (
                <button
                  type="button"
                  className="tx-txb-cancel"
                  onClick={onCancel}
                >
                  {mergedLabels.cancel}
                </button>
              )
            }
          </div>
        )
      }

      {
        state === 'simulation-failed' && error && (
          <div className="tx-txb-details" data-expanded="true" role="alert">
            <div className="tx-txb-details-error">{error.message}</div>
          </div>
        )
      }

      {
        showExplorer && (
          <ExternalLink
            href={explorerUrl}
            className="tx-txb-explorer"
          >
            <span>{mergedLabels.viewOnExplorer}</span>
            <ExternalLinkIcon />
          </ExternalLink>
        )
      }

      <div role="status" aria-live="polite" className="tx-txb-sr">
        {statusMessage}
      </div>
    </>
  )
}


export default TransactionButtonDefault
