import React from 'react'
import type { Connector } from 'wagmi'

import { WALLET_FALLBACK_ICONS } from '../../../helpers/walletIcons'


type WalletItemProps = {
  connector: Connector
  isActive: boolean
  isRecent: boolean
  tabIndex: 0 | -1
  onSelect: (connector: Connector) => void
}

/**
 * Deterministic gradient from connector name for icon fallback.
 * Maps first char code to a hue in HSL color space.
 */
const getIconGradient = (name: string): string => {
  const hue = (name.charCodeAt(0) * 137) % 360
  return `linear-gradient(135deg, hsl(${hue}, 60%, 50%), hsl(${(hue + 40) % 360}, 50%, 40%))`
}

const WalletItem: React.FC<WalletItemProps> = (props) => {
  const {
    onSelect,
    tabIndex,
    isActive,
    isRecent,
    connector,
  } = props

  const icon = connector.icon || WALLET_FALLBACK_ICONS[connector.id] || null

  return (
    <div
      key={connector.uid}
      role="option"
      className="tx-cw-wallet"
      tabIndex={tabIndex}
      data-active={isActive || undefined}
      aria-selected={isActive}
      onClick={() => onSelect(connector)}
    >
      {
        icon
          ? <img src={icon} alt="" className="tx-cw-wallet-icon" />
          : (
            <span
              className="tx-cw-wallet-icon tx-cw-wallet-icon-fallback"
              style={{ background: getIconGradient(connector.name) }}
            >
              {connector.name.charAt(0).toUpperCase()}
            </span>
          )
      }
      <span className="tx-cw-wallet-name">{connector.name}</span>
      {
        isRecent && (
          <span className="tx-cw-wallet-badge">Recent</span>
        )
      }
    </div>
  )
}


export default WalletItem
export type { WalletItemProps }
