import React from 'react'
import type { ReactNode } from 'react'

import chainSwitchIcon from '../../../../../packages/react/src/assets/icons/chain-switch.svg'

import CwConnectedContent from './CwConnectedContent'


const switchMaskStyle = { maskImage: `url("${chainSwitchIcon}")`, WebkitMaskImage: `url("${chainSwitchIcon}")` }


type LabelOverrides = {
  connect?: string
  connecting?: string
  wrongChain?: string
  error?: string
}

type CwMockProps = {
  children?: ReactNode
  state: string
  label: string
  size: string
  variant: string
  showBalance: boolean
  showAvatar: boolean
  showEns: boolean
  showFiat?: boolean
  balance?: string
  fiat?: string
  avatarStyle?: string
  interactive?: boolean
  formatAddress?: (address: string, ens?: string) => string
  labels?: LabelOverrides
  onClick?: () => void
}

const MOCK_ADDRESS = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51'

const CwMockButton: React.FC<CwMockProps> = ({
  children,
  state,
  label,
  size,
  variant,
  showBalance,
  showAvatar,
  showEns,
  showFiat = false,
  balance = '1.23 ETH',
  fiat = '$4,321.98',
  avatarStyle = 'gradient',
  interactive: _interactive = false,
  formatAddress,
  labels,
  onClick,
}) => {
  const sizeStyle = size === 'compact' ? { minHeight: 32, padding: '4px 12px', fontSize: 13 } : {}

  const ensName = 'alice.eth'
  const shortened = '0xaC8e...BE51'
  const defaultDisplay = showEns ? ensName : shortened
  const displayAddress = formatAddress
    ? formatAddress(MOCK_ADDRESS, showEns ? ensName : undefined)
    : defaultDisplay

  const connectedContent = (
    <CwConnectedContent
      fiat={fiat}
      address={MOCK_ADDRESS}
      balance={balance}
      avatarStyle={avatarStyle}
      displayAddress={displayAddress}
      showFiat={showFiat}
      showAvatar={showAvatar}
      showBalance={showBalance}
    />
  )

  switch (state) {
    case 'connected':
      return (
        <div className="tx-cw" data-size={size} data-variant={variant}>
          <button type="button" className="tx-cw-button" data-state="connected" style={sizeStyle} onClick={onClick}>
            {connectedContent}
          </button>
          {children}
        </div>
      )
    case 'wrong-chain':
      return (
        <div className="tx-cw" data-size={size} data-variant={variant}>
          <button type="button" className="tx-cw-button" data-state="wrong-chain" style={sizeStyle} onClick={onClick}>
            {connectedContent}
            <span className="tx-cw-switch-icon" style={switchMaskStyle} aria-hidden="true" />
          </button>
          {children}
        </div>
      )
    case 'connecting':
      return (
        <div className="tx-cw" data-size={size} data-variant={variant}>
          <button type="button" className="tx-cw-button" data-state="connecting" disabled style={sizeStyle}>
            <span className="tx-cw-dots">
              <span className="tx-cw-dot" />
              <span className="tx-cw-dot" />
              <span className="tx-cw-dot" />
            </span>
            <span>{labels?.connecting ?? 'Connecting'}</span>
          </button>
        </div>
      )
    case 'error':
      return (
        <div className="tx-cw" data-size={size} data-variant={variant}>
          <button type="button" className="tx-cw-button" data-state="error" style={sizeStyle} onClick={onClick}>
            {labels?.error ?? 'Try Again'}
          </button>
        </div>
      )
    case 'initializing':
      return (
        <div className="tx-cw" data-size={size} data-variant={variant}>
          <button type="button" className="tx-cw-button" data-state="initializing" disabled style={sizeStyle} onClick={onClick}>
            <span className="tx-cw-dots">
              <span className="tx-cw-dot" />
              <span className="tx-cw-dot" />
              <span className="tx-cw-dot" />
            </span>
          </button>
        </div>
      )
    default:
      return (
        <div className="tx-cw" data-size={size} data-variant={variant}>
          <button type="button" className="tx-cw-button" data-state="disconnected" style={sizeStyle} onClick={onClick}>
            {labels?.connect ?? label}
          </button>
        </div>
      )
  }
}


export default CwMockButton
