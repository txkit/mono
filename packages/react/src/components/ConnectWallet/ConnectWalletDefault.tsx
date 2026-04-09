import React from 'react'

import hashColor from '../../helpers/hashColor'
import SkeletonPulse from './SkeletonPulse'
import WalletModal from './WalletModal'
import AccountDropdown from './AccountDropdown'
import type { ConnectWalletDefaultProps } from '../../types/connect'


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
  fiatBalance: _fiatBalance,
  resolvedDisplayAddress,
  chain,
  chains,
  connectors,
  groupedConnectors,
  recentIds,
  connectingWallet,
  isTimedOut,
  mergedLabels,
  size: _size,
  variant: _variant,
  showAvatar,
  showBalance,
  showFiat: _showFiat,
  showChainSelector,
  avatarStyle: _avatarStyle,
  onModalClose,
  onDisconnect,
  onPanelClose,
  onButtonClick,
  onModalSelect,
  onChainSwitch,
  onCancelConnect,
}) => {
  const panelControlsMap = {
    modal: 'txkit-wallet-modal',
    dropdown: 'txkit-account-dropdown',
    closed: undefined,
  } as const

  // Detect initializing state (wagmi hydrating, no connectors loaded yet)
  // In wagmi v2, connectors come synchronously from config, so this is brief.
  // We also detect when state is disconnected but connectors haven't hydrated.
  const isInitializing = connectors.length === 0

  const ariaHaspopup = state === 'connected' ? 'menu' as const : 'dialog' as const

  return (
  <>
    <button
      ref={buttonRef}
      type="button"
      className="txkit-cw-button"
      data-state={isInitializing ? 'initializing' : state}
      onClick={onButtonClick}
      disabled={state === 'connecting' || isInitializing}
      aria-haspopup={ariaHaspopup}
      aria-expanded={panel !== 'closed'}
      aria-controls={panelControlsMap[panel]}
      aria-busy={state === 'connecting' || isInitializing}
    >
      {
        isInitializing && <SkeletonPulse />
      }

      {
        !isInitializing && state === 'connecting' && <DotLoader />
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
            <span className="txkit-cw-address">{resolvedDisplayAddress}</span>
            {
              showBalance && formattedBalance && (
                <span className="txkit-cw-balance">{formattedBalance}</span>
              )
            }
          </>
        )
      }

      {
        !isInitializing && buttonLabel && <span>{buttonLabel}</span>
      }
    </button>

    {
      panel === 'modal' && (
        <WalletModal
          labels={mergedLabels}
          connectors={connectors}
          groupedConnectors={groupedConnectors}
          recentIds={recentIds}
          connectingWallet={connectingWallet}
          isTimedOut={isTimedOut}
          onClose={onModalClose}
          onSelect={onModalSelect}
          onCancelConnect={onCancelConnect}
        />
      )
    }

    {
      panel === 'dropdown' && address && (
        <AccountDropdown
          address={address}
          ensName={ensName}
          ensAvatar={ensAvatar}
          formattedBalance={showBalance ? formattedBalance : undefined}
          chain={chain}
          chains={chains}
          showChainSelector={showChainSelector}
          labels={mergedLabels}
          onClose={onPanelClose}
          onDisconnect={onDisconnect}
          onChainSwitch={onChainSwitch}
        />
      )
    }

    <div role="status" aria-live="polite" aria-atomic="true" className="txkit-cw-status">
      {statusMessage}
    </div>
  </>
  )
}


export default ConnectWalletDefault
