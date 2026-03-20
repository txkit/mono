import React from 'react'

import WalletModal from './WalletModal'
import AccountDropdown from './AccountDropdown'
import type { ConnectWalletDefaultProps } from './types'


/** Deterministic color from string hash */
const hashColor = (str: string): string => {
  let hash = 0
  for (let index = 0; index < str.length; index++) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}

const AvatarFallback: React.FC<{ address: string }> = ({ address }) => {
  const bgColor = hashColor(address)
  const letter = address.slice(2, 4).toUpperCase()

  return (
    <span className="txkit-cw-avatar-fallback" style={{ backgroundColor: bgColor }}>
      {letter}
    </span>
  )
}

const DotLoader: React.FC = () => (
  <span className="txkit-cw-dots">
    <span className="txkit-cw-dot" />
    <span className="txkit-cw-dot" />
    <span className="txkit-cw-dot" />
  </span>
)

const ConnectWalletDefault: React.FC<ConnectWalletDefaultProps> = ({
  buttonRef,
  state,
  panel,
  address,
  ensAvatar,
  ensName,
  buttonLabel,
  statusMessage,
  formattedBalance,
  resolvedDisplayAddress,
  chain,
  connectors,
  mergedLabels,
  showAvatar,
  showBalance,
  onModalClose,
  onDisconnect,
  onPanelClose,
  onButtonClick,
  onModalSelect,
}) => {
  const panelControlsMap = {
    modal: 'txkit-wallet-modal',
    dropdown: 'txkit-account-dropdown',
    closed: undefined,
  } as const

  return (
  <>
    <button
      ref={buttonRef}
      type="button"
      className="txkit-cw-button"
      data-state={state}
      onClick={onButtonClick}
      disabled={state === 'connecting'}
      aria-expanded={panel !== 'closed'}
      aria-controls={panelControlsMap[panel]}
      aria-busy={state === 'connecting'}
    >
      {
        state === 'connecting' && <DotLoader />
      }

      {
        state === 'connected' && (
          <>
            {
              showAvatar && (
                ensAvatar
                  ? <img src={ensAvatar} alt="" className="txkit-cw-avatar" />
                  : address && <AvatarFallback address={address} />
              )
            }
            <span>{resolvedDisplayAddress}</span>
            {
              showBalance && formattedBalance && (
                <span className="txkit-cw-balance">{formattedBalance}</span>
              )
            }
          </>
        )
      }

      {
        buttonLabel && <span>{buttonLabel}</span>
      }
    </button>

    {
      panel === 'modal' && (
        <WalletModal
          labels={mergedLabels}
          connectors={connectors}
          onClose={onModalClose}
          onSelect={onModalSelect}
        />
      )
    }

    {
      panel === 'dropdown' && address && (
        <AccountDropdown
          address={address}
          ensName={ensName}
          ensAvatar={ensAvatar}
          formattedBalance={formattedBalance}
          chain={chain}
          labels={mergedLabels}
          onClose={onPanelClose}
          onDisconnect={onDisconnect}
        />
      )
    }

    <div role="status" aria-live="polite" className="txkit-cw-status">
      {statusMessage}
    </div>
  </>
  )
}


export default ConnectWalletDefault
