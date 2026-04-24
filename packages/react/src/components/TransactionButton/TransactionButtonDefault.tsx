import React from 'react'
import type { StepStatus, TransactionError, RiskResult, DecodedCalldata } from '@txkit/core'
import { formatDecodedCalldata } from '@txkit/core'

import ExternalLinkIcon from './ExternalLinkIcon'
import type { TransactionButtonLabels } from './labels'

import loaderIcon from '../../assets/icons/loader.svg'
import checkIcon from '../../assets/icons/check.svg'


const idleStates: readonly StepStatus[] = [ 'pending', 'error', 'simulation-failed', 'rejected' ]

const ArrowRightIcon = () => (
  <svg
    className="txkit-txb-icon"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)


export type TransactionButtonDefaultProps = {
  state: StepStatus
  buttonLabel: string
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
  onClick: () => void
  onCancel: () => void
  onForceSubmit: () => void
}

const explorerStates: readonly StepStatus[] = [ 'tx-pending', 'completed', 'error' ]

const TransactionButtonDefault: React.FC<TransactionButtonDefaultProps> = ({
  state,
  buttonLabel,
  explorerUrl,
  statusMessage,
  error,
  riskResult,
  mergedLabels,
  decodedCalldata,
  confirmCountdown,
  isProcessing,
  showExplorerLink,
  isButtonDisabled,
  currentStepIndex,
  totalSteps,
  onClick,
  onCancel,
  onForceSubmit,
}) => {
  const showDetails = state === 'confirming-risk' && Boolean(decodedCalldata || riskResult)
  const showExplorer = showExplorerLink && explorerUrl && explorerStates.includes(state)
  const showProgressDots = totalSteps > 1

  return (
    <>
      {
        showProgressDots && (
          <div
            className="txkit-txb-progress"
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
                  className="txkit-txb-progress-dot"
                  data-state={
                    index < currentStepIndex
                      ? 'completed'
                      : index === currentStepIndex
                        ? 'current'
                        : 'pending'
                  }
                />
              ))
            }
            <span className="txkit-txb-progress-label">
              {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
        )
      }
      <button
        type="button"
        className="txkit-txb-button"
        data-state={state}
        disabled={isButtonDisabled}
        onClick={onClick}
        aria-busy={isProcessing}
      >
        {
          state === 'completed' && (
            <img src={checkIcon} alt="" className="txkit-txb-icon" aria-hidden="true" />
          )
        }
        {
          isProcessing && (
            <img
              src={loaderIcon}
              alt=""
              className="txkit-txb-icon txkit-txb-icon--spinning"
              aria-hidden="true"
            />
          )
        }
        <span>{buttonLabel}</span>
        {
          idleStates.includes(state) && <ArrowRightIcon />
        }
        {
          state === 'confirming-risk' && confirmCountdown > 0 && (
            <span className="txkit-txb-countdown" aria-hidden="true">{confirmCountdown}</span>
          )
        }
      </button>

      {
        showDetails && (
          <div
            className="txkit-txb-details"
            data-expanded="true"
            role="region"
            aria-label="Transaction details"
          >
            {
              decodedCalldata && (
                <div className="txkit-txb-details-row">
                  <pre className="txkit-txb-details-calldata">
                    {formatDecodedCalldata(decodedCalldata)}
                  </pre>
                </div>
              )
            }
            {
              riskResult && riskResult.warnings.length > 0 && (
                <div className="txkit-txb-details-warnings">
                  {
                    riskResult.warnings.map((warning, index) => (
                      <div key={index} className="txkit-txb-details-warning">
                        {warning}
                      </div>
                    ))
                  }
                </div>
              )
            }
            {
              state === 'confirming-risk' && (
                <button
                  type="button"
                  className="txkit-txb-cancel"
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
        state === 'simulation-failed' && (
          <div className="txkit-txb-details" data-expanded="true" role="alert">
            {
              error && (
                <div className="txkit-txb-details-warning">{error.message}</div>
              )
            }
            <button
              type="button"
              className="txkit-txb-force"
              onClick={onForceSubmit}
            >
              {mergedLabels.forceSubmit}
            </button>
          </div>
        )
      }

      {
        showExplorer && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="txkit-txb-explorer"
          >
            <span>{mergedLabels.viewOnExplorer}</span>
            <ExternalLinkIcon />
          </a>
        )
      }

      <div role="status" aria-live="polite" className="txkit-txb-sr">
        {statusMessage}
      </div>
    </>
  )
}


export default TransactionButtonDefault
