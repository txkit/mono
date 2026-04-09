import React from 'react'

import type { ConnectWalletLabels } from './labels'


type WalletConnectingProps = {
  walletName: string
  walletIcon?: string
  isTimedOut: boolean
  labels: Required<ConnectWalletLabels>
  onRetry: () => void
}

const WalletConnecting: React.FC<WalletConnectingProps> = ({
  walletName,
  walletIcon,
  isTimedOut,
  labels,
  onRetry,
}) => {
  const statusText = labels.openingWallet.replace('{wallet}', walletName)

  return (
    <div className="txkit-cw-connecting">
      <div className="txkit-cw-connecting-icon">
        {
          walletIcon
            ? <img src={walletIcon} alt="" className="txkit-cw-connecting-img" />
            : (
              <span className="txkit-cw-connecting-placeholder" aria-hidden="true">
                {walletName.charAt(0)}
              </span>
            )
        }
      </div>

      <div className="txkit-cw-connecting-status" role="status" aria-live="polite">
        <span className="txkit-cw-connecting-text">{statusText}</span>

        <span className="txkit-cw-dots">
          <span className="txkit-cw-dot" />
          <span className="txkit-cw-dot" />
          <span className="txkit-cw-dot" />
        </span>
      </div>

      {
        isTimedOut && (
          <div className="txkit-cw-timeout">
            <span className="txkit-cw-timeout-text">{labels.takingTooLong}</span>
            <button type="button" className="txkit-cw-timeout-btn" onClick={onRetry}>
              {labels.retry}
            </button>
          </div>
        )
      }
    </div>
  )
}


export default WalletConnecting
