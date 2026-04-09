import React from 'react'
import type { StepStatus, TransactionError, RiskResult, DecodedCalldata } from '@txkit/core'
import { formatDecodedCalldata } from '@txkit/core'

import type { TransactionButtonLabels } from './labels'


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
  onClick: () => void
  onCancel: () => void
  onForceSubmit: () => void
}

const explorerStates: readonly StepStatus[] = [ 'tx-pending', 'completed', 'error' ]

const DotLoader: React.FC = () => (
  <span className="txkit-txb-dots" aria-hidden="true">
    <span className="txkit-txb-dot" />
    <span className="txkit-txb-dot" />
    <span className="txkit-txb-dot" />
  </span>
)

const CheckIcon: React.FC = () => (
  <svg className="txkit-txb-check" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const ExternalLinkIcon: React.FC = () => (
  <svg className="txkit-txb-explorer-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M12 8.5V12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3.5M9 2h5v5M14 2L6.5 9.5" />
  </svg>
)

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
  onClick,
  onCancel,
  onForceSubmit,
}) => {
  const showDetails = state === 'confirming-risk' && Boolean(decodedCalldata || riskResult)
  const showExplorer = showExplorerLink && explorerUrl && explorerStates.includes(state)

  return (
    <>
      <button
        type="button"
        className="txkit-txb-button"
        data-state={state}
        disabled={isButtonDisabled}
        onClick={onClick}
        aria-busy={isProcessing}
      >
        {
          (() => {
            if (state === 'completed') {
              return <CheckIcon />
            }
            if (isProcessing) {
              return <DotLoader />
            }
            return null
          })()
        }
        <span>{buttonLabel}</span>
        {
          state === 'confirming-risk' && confirmCountdown > 0 && (
            <span className="txkit-txb-countdown">{confirmCountdown}</span>
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
