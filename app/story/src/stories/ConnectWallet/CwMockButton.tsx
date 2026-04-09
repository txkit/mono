import React from 'react'

import hashColor from '../shared/hashColor'


type CwMockProps = {
  state: string
  label: string
  size: string
  variant: string
  showBalance: boolean
  showAvatar: boolean
  showEns: boolean
}

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const CwMockButton: React.FC<CwMockProps> = ({
  state,
  label,
  size,
  variant,
  showBalance,
  showAvatar,
  showEns,
}) => {
  const sizeStyle = size === 'compact' ? { minHeight: 32, padding: '4px 12px', fontSize: 13 } : {}

  switch (state) {
    case 'connected': {
      const displayAddress = showEns ? 'vitalik.eth' : '0xd8dA...6045'
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connected" style={{ pointerEvents: 'none', ...sizeStyle }}>
            {
              showAvatar && (
                <span className="txkit-cw-avatar-fallback" style={{ backgroundColor: hashColor(MOCK_ADDRESS) }}>
                  D8
                </span>
              )
            }
            <span className="txkit-cw-address">{displayAddress}</span>
            {
              showBalance && (
                <span className="txkit-cw-balance">1.23 ETH</span>
              )
            }
          </button>
        </div>
      )
    }
    case 'connecting':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connecting" disabled style={{ cursor: 'wait', pointerEvents: 'none', ...sizeStyle }}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
            <span>Connecting</span>
          </button>
        </div>
      )
    case 'wrong-chain':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="wrong-chain" style={{ pointerEvents: 'none', ...sizeStyle }}>
            Switch to Mainnet
          </button>
        </div>
      )
    case 'error':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="error" style={{ pointerEvents: 'none', ...sizeStyle }}>
            Try Again
          </button>
        </div>
      )
    case 'initializing':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="initializing" disabled style={{ pointerEvents: 'none', ...sizeStyle }}>
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
          <button type="button" className="txkit-cw-button" data-state="disconnected" style={{ pointerEvents: 'none', ...sizeStyle }}>
            {label}
          </button>
        </div>
      )
  }
}


export default CwMockButton
