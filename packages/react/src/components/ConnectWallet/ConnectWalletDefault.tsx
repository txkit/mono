import React from 'react'

import chainSwitchIcon from '../../assets/icons/chain-switch.svg'

import maskStyle from '../../helpers/maskStyle'
import DotLoader from './DotLoader'
import WalletModal from './WalletModal'
import SkeletonPulse from './SkeletonPulse'
import AvatarFallback from './AvatarFallback'
import AccountDropdown from './AccountDropdown'
import type { ConnectWalletDefaultProps } from '../../types/connect'


const chainSwitchMaskStyle = maskStyle(chainSwitchIcon)


const ConnectWalletDefault: React.FC<ConnectWalletDefaultProps> = (props) => {
  const {
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
    connectors,
    groupedConnectors,
    recentIds,
    connectingWallet,
    isTimedOut,
    isBalanceLoading,
    mergedLabels,
    showAvatar,
    showBalance,
    showFiat,
    avatarStyle,
    onModalClose,
    onDisconnect,
    onPanelClose,
    onButtonClick,
    onModalSelect,
    onChainSwitch,
    onCancelConnect,
  } = props
  const panelControlsMap = {
    modal: 'tx-wallet-modal',
    dropdown: 'tx-account-dropdown',
    closed: undefined,
  } as const

  const isInitializing = connectors.length === 0
  const showSkeleton = isInitializing || state === 'reconnecting'

  const isConnectedLike = state === 'connected' || state === 'wrong-chain'
  const ariaHaspopup = isConnectedLike ? 'menu' as const : 'dialog' as const

  const balanceValueNode = showBalance && formattedBalance
    ? <span className="tx-cw-balance">{formattedBalance}</span>
    : null
  const balanceSkeletonNode = showBalance && !formattedBalance && isBalanceLoading
    ? <span className="tx-cw-balance-skeleton" aria-hidden="true" />
    : null
  const fiatNode = showFiat && fiatBalance
    ? <span className="tx-cw-fiat">{fiatBalance}</span>
    : null
  const hasBalanceContent = Boolean(balanceValueNode || balanceSkeletonNode || fiatNode)
  const balanceWrapNode = hasBalanceContent
    ? (
      <span className="tx-cw-balance-wrap">
        {balanceValueNode}
        {balanceSkeletonNode}
        {fiatNode}
      </span>
    )
    : null

  return (
  <>
    <button
      ref={buttonRef}
      type="button"
      className="tx-cw-button"
      data-state={isInitializing ? 'initializing' : state}
      onClick={onButtonClick}
      disabled={state === 'connecting' || showSkeleton}
      aria-haspopup={ariaHaspopup}
      aria-expanded={panel !== 'closed'}
      aria-controls={panelControlsMap[panel]}
      aria-busy={state === 'connecting' || showSkeleton}
    >
      {
        showSkeleton && <SkeletonPulse />
      }

      {
        !showSkeleton && state === 'connecting' && <DotLoader />
      }

      {
        isConnectedLike && (
          <>
            {
              showAvatar && (
                ensAvatar
                  ? <img src={ensAvatar} alt="" className="tx-cw-avatar" />
                  : address && <AvatarFallback address={address} variant={avatarStyle} />
              )
            }
            <span className="tx-cw-address">{resolvedDisplayAddress}</span>
            {balanceWrapNode}
            {
              state === 'wrong-chain' && (
                <span
                  className="tx-cw-switch-icon"
                  style={chainSwitchMaskStyle}
                  aria-hidden="true"
                />
              )
            }
          </>
        )
      }

      {
        !showSkeleton && buttonLabel && <span>{buttonLabel}</span>
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

    <div role="status" aria-live="polite" aria-atomic="true" className="tx-cw-status">
      {statusMessage}
    </div>
  </>
  )
}


export default ConnectWalletDefault
