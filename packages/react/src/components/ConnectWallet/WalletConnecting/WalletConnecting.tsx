import React from 'react'

import DotLoader from '../DotLoader'
import type { ConnectWalletLabels } from '../labels'


type WalletConnectingProps = {
  walletName: string
  walletIcon?: string
  isTimedOut: boolean
  labels: Required<ConnectWalletLabels>
  onRetry: () => void
}

const WalletConnecting: React.FC<WalletConnectingProps> = (props) => {
  const {
    labels,
    onRetry,
    walletName,
    walletIcon,
    isTimedOut,
  } = props

  const statusText = labels.openingWallet.replace('{wallet}', walletName)

  return (
    <div className="tx-cw-connecting">
      <div className="tx-cw-connecting-icon">
        {
          walletIcon
            ? <img src={walletIcon} alt="" className="tx-cw-connecting-img" />
            : (
              <span className="tx-cw-connecting-placeholder" aria-hidden="true">
                {walletName.charAt(0)}
              </span>
            )
        }
      </div>

      <div className="tx-cw-connecting-status" role="status" aria-live="polite">
        <span className="tx-cw-connecting-text">{statusText}</span>

        <DotLoader />
      </div>

      {
        isTimedOut && (
          <div className="tx-cw-timeout">
            <span className="tx-cw-timeout-text">{labels.takingTooLong}</span>
            <button type="button" className="tx-cw-timeout-btn" onClick={onRetry}>
              {labels.retry}
            </button>
          </div>
        )
      }
    </div>
  )
}


export default WalletConnecting
