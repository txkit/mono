import React, { useCallback } from 'react'
import type { Chain } from 'viem'

import useArrowNavigation from '../../hooks/useArrowNavigation'
import type { ConnectWalletLabels } from './labels'


type ChainSelectorProps = {
  chains: readonly Chain[]
  currentChainId: number | undefined
  labels: Required<ConnectWalletLabels>
  onSwitch: (chainId: number) => void
}

const ChainSelector: React.FC<ChainSelectorProps> = ({
  chains,
  currentChainId,
  labels,
  onSwitch,
}) => {
  const handleActivate = useCallback((index: number) => {
    const chain = chains[index]
    if (chain && chain.id !== currentChainId) {
      onSwitch(chain.id)
    }
  }, [ chains, currentChainId, onSwitch ])

  const getLabel = useCallback((index: number) => chains[index]?.name ?? '', [ chains ])

  const { activeIndex, handleKeyDown, getTabIndex } = useArrowNavigation({
    itemCount: chains.length,
    onActivate: handleActivate,
    getLabel,
    typeAhead: true,
  })

  if (chains.length <= 1) {
    return null
  }

  return (
    <div className="txkit-cw-chain-selector">
      <div className="txkit-cw-chain-selector-label">{labels.switchNetwork}</div>
      <div
        role="listbox"
        aria-label={labels.switchNetwork}
        onKeyDown={handleKeyDown}
        className="txkit-cw-chain-list"
      >
        {
          chains.map((chain, index) => {
            const isSelected = chain.id === currentChainId
            const isActive = index === activeIndex

            return (
              <button
                key={chain.id}
                type="button"
                role="option"
                className="txkit-cw-chain-option"
                aria-selected={isSelected}
                tabIndex={getTabIndex(index)}
                data-active={isActive || undefined}
                onClick={() => handleActivate(index)}
              >
                <span className="txkit-cw-chain-name">{chain.name}</span>
                {
                  isSelected && (
                    <span className="txkit-cw-chain-check" aria-hidden="true">
                      &#10003;
                    </span>
                  )
                }
              </button>
            )
          })
        }
      </div>
    </div>
  )
}


export default ChainSelector
