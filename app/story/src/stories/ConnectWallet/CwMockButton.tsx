import React from 'react'
import type { ReactNode } from 'react'

import { hashGradient, hashPixelAvatar } from '../../helpers/hashColor'


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

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

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
  interactive = false,
  formatAddress,
  labels,
  onClick,
}) => {
  const sizeStyle = size === 'compact' ? { minHeight: 32, padding: '4px 12px', fontSize: 13 } : {}
  const nonInteractiveStyle = interactive ? { cursor: 'pointer' } : { pointerEvents: 'none' as const }

  const ensName = 'vitalik.eth'
  const shortened = '0xd8dA...6045'
  const defaultDisplay = showEns ? ensName : shortened
  const displayAddress = formatAddress
    ? formatAddress(MOCK_ADDRESS, showEns ? ensName : undefined)
    : defaultDisplay

  const renderConnectedContent = () => {
    const pixel = avatarStyle === 'pixel' ? hashPixelAvatar(MOCK_ADDRESS) : null

    return (
    <>
      {
        showAvatar && (
          pixel
            ? (
              <span className="txkit-cw-avatar-fallback" style={{ background: pixel.background, overflow: 'hidden' }} aria-hidden="true">
                <svg viewBox="0 0 5 5" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
                  {
                    pixel.pattern.flatMap((row, rowIndex) => (
                      row.map((filled, colIndex) => (
                        filled
                          ? <rect key={`${rowIndex}-${colIndex}`} x={colIndex} y={rowIndex} width={1} height={1} fill={pixel.foreground} />
                          : null
                      ))
                    ))
                  }
                </svg>
              </span>
            )
            : <span className="txkit-cw-avatar-fallback" style={{ background: hashGradient(MOCK_ADDRESS) }} aria-hidden="true" />
        )
      }
      <span className="txkit-cw-address">{displayAddress}</span>
      {
        showBalance && (
          <span className="txkit-cw-balance-wrap">
            <span className="txkit-cw-balance">{balance}</span>
            {showFiat && <span className="txkit-cw-fiat">{fiat}</span>}
          </span>
        )
      }
    </>
    )
  }

  switch (state) {
    case 'connected':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connected" style={{ ...nonInteractiveStyle, ...sizeStyle }} onClick={onClick}>
            {renderConnectedContent()}
          </button>
          {children}
        </div>
      )
    case 'wrong-chain':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="wrong-chain" style={{ ...nonInteractiveStyle, ...sizeStyle }} onClick={onClick}>
            {renderConnectedContent()}
            <svg className="txkit-cw-switch-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m16 3 4 4-4 4" />
              <path d="M20 7H4" />
              <path d="m8 21-4-4 4-4" />
              <path d="M4 17h16" />
            </svg>
          </button>
          {children}
        </div>
      )
    case 'connecting':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connecting" disabled style={{ cursor: 'wait', ...nonInteractiveStyle, ...sizeStyle }}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
            <span>{labels?.connecting ?? 'Connecting'}</span>
          </button>
        </div>
      )
    case 'error':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="error" style={{ ...nonInteractiveStyle, ...sizeStyle }} onClick={onClick}>
            {labels?.error ?? 'Try Again'}
          </button>
        </div>
      )
    case 'initializing':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="initializing" disabled style={{ ...nonInteractiveStyle, ...sizeStyle }} onClick={onClick}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
          </button>
        </div>
      )
    default:
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="disconnected" style={{ ...nonInteractiveStyle, ...sizeStyle }} onClick={onClick}>
            {labels?.connect ?? label}
          </button>
        </div>
      )
  }
}


export default CwMockButton
