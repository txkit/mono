import React from 'react'
import type { StepStatus, TransactionError, RiskResult, DecodedCalldata } from '@txkit/core'
import { formatDecodedCalldata } from '@txkit/core'

import CheckIcon from './CheckIcon'
import DotLoader from './DotLoader'
import ExternalLinkIcon from './ExternalLinkIcon'
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
