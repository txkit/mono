import React from 'react'
import type { Connector } from 'wagmi'

import WalletItem from './WalletItem'


type WalletGroupSectionProps = {
  label: string
  labelId: string
  variant?: 'accent' | 'default'
  connectors: Connector[]
  recentIds: string[]
  activeIndex: number
  indexOffset: number
  getTabIndex: (index: number) => 0 | -1
  onSelect: (connector: Connector) => void
}

const WalletGroupSection: React.FC<WalletGroupSectionProps> = ({
  label,
  labelId,
  variant = 'default',
  connectors,
  recentIds,
  activeIndex,
  indexOffset,
  getTabIndex,
  onSelect,
}) => {
  if (connectors.length === 0) {
    return null
  }

  return (
    <div role="group" aria-labelledby={labelId} className="txkit-cw-group">
      <div
        role="presentation"
        id={labelId}
        className="txkit-cw-group-label"
        data-variant={variant}
      >
        {label}
      </div>
      {
        connectors.map((connector, index) => {
          const globalIndex = indexOffset + index
          const isActive = globalIndex === activeIndex
          const isRecent = recentIds.includes(connector.id)

          return (
            <WalletItem
              key={connector.uid}
              connector={connector}
              isActive={isActive}
              isRecent={isRecent}
              tabIndex={getTabIndex(globalIndex)}
              onSelect={onSelect}
            />
          )
        })
      }
    </div>
  )
}


export default WalletGroupSection
export type { WalletGroupSectionProps }
