import React from 'react'

import DotLoader from './DotLoader'
import WalletModal from './WalletModal'
import SkeletonPulse from './SkeletonPulse'
import AvatarFallback from './AvatarFallback'
import AccountDropdown from './AccountDropdown'
import type { ConnectWalletDefaultProps } from '../../types/connect'


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
  fiatBalance,
  resolvedDisplayAddress,
  chain,
  requiredChain,
  chains: _chains,
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
  showFiat,
  showChainSelector: _showChainSelector,
  avatarStyle,
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

  const isConnectedLike = state === 'connected' || state === 'wrong-chain'
  const ariaHaspopup = isConnectedLike ? 'menu' as const : 'dialog' as const

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
        isConnectedLike && (
          <>
            {
              showAvatar && (
                ensAvatar
                  ? <img src={ensAvatar} alt="" className="txkit-cw-avatar" />
                  : address && <AvatarFallback address={address} variant={avatarStyle} />
              )
            }
            <span className="txkit-cw-address">{resolvedDisplayAddress}</span>
            {
              ((showBalance && formattedBalance) || (showFiat && fiatBalance)) && (
                <span className="txkit-cw-balance-wrap">
                  {showBalance && formattedBalance && <span className="txkit-cw-balance">{formattedBalance}</span>}
                  {showFiat && fiatBalance && <span className="txkit-cw-fiat">{fiatBalance}</span>}
                </span>
              )
            }
            {
              state === 'wrong-chain' && (
                <svg className="txkit-cw-switch-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m16 3 4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="m8 21-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
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
          avatarStyle={avatarStyle}
          chain={chain}
          requiredChain={requiredChain}
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
