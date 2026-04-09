import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import type { Chain } from 'viem'
import { getExplorerUrl, copyToClipboard } from '@txkit/core'

import hashColor from '../../helpers/hashColor'
import useEscapeKey from '../../hooks/useEscapeKey'
import useClickOutside from '../../hooks/useClickOutside'
import useArrowNavigation from '../../hooks/useArrowNavigation'
import ChainSelector from './ChainSelector'
import type { ConnectWalletLabels } from './labels'


type AccountDropdownProps = {
  address: string
  ensName?: string | null
  ensAvatar?: string | null
  formattedBalance?: string
  chain?: Chain
  chains: readonly Chain[]
  showChainSelector: boolean
  labels: Required<ConnectWalletLabels>
  onClose: () => void
  onDisconnect: () => void
  onChainSwitch: (chainId: number) => void
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({
  address,
  ensName,
  ensAvatar,
  formattedBalance,
  chain,
  chains,
  showChainSelector,
  labels,
  onClose,
  onDisconnect,
  onChainSwitch,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [ copied, setCopied ] = useState(false)

  useClickOutside(dropdownRef, onClose)
  useEscapeKey(onClose)

  // Cleanup copied feedback timer on unmount
  useEffect(() => {
    return () => clearTimeout(copiedTimerRef.current)
  }, [])

  // Menu items for arrow navigation
  const explorerUrl = chain?.id ? getExplorerUrl(chain.id, address, 'address') : undefined

  const menuItems = useMemo(() => {
    const items: { id: string, label: string }[] = [
      { id: 'copy', label: labels.copyAddress },
    ]
    if (explorerUrl) {
      items.push({ id: 'explorer', label: labels.explorer })
    }
    items.push({ id: 'disconnect', label: labels.disconnect })
    return items
  }, [ labels, explorerUrl ])

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(address)

    if (success) {
      setCopied(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }, [ address ])

  const handleDisconnect = useCallback(() => {
    onDisconnect()
    onClose()
  }, [ onDisconnect, onClose ])

  const handleActivate = useCallback((index: number) => {
    const item = menuItems[index]
    if (!item) {
      return
    }

    switch (item.id) {
      case 'copy':
        handleCopy()
        break
      case 'explorer':
        if (explorerUrl) {
          window.open(explorerUrl, '_blank', 'noopener,noreferrer')
        }
        break
      case 'disconnect':
        handleDisconnect()
        break
    }
  }, [ menuItems, explorerUrl, handleCopy, handleDisconnect ])

  const getLabel = useCallback((index: number) => menuItems[index]?.label ?? '', [ menuItems ])

  const { activeIndex, handleKeyDown, getTabIndex } = useArrowNavigation({
    itemCount: menuItems.length,
    onActivate: handleActivate,
    getLabel,
  })

  const displayName = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div
      ref={dropdownRef}
      id="txkit-account-dropdown"
      className="txkit-cw-dropdown"
    >
      <div className="txkit-cw-dropdown-header">
        <div className="txkit-cw-dropdown-identity">
          <div className="txkit-cw-dropdown-identity-info">
            <div className="txkit-cw-dropdown-name">{displayName}</div>
            {
              chain && (
                <div className="txkit-cw-dropdown-chain">{chain.name}</div>
              )
            }
          </div>
        </div>
        {
          formattedBalance && (
            <div className="txkit-cw-dropdown-balance">{formattedBalance}</div>
          )
        }
      </div>

      {
        showChainSelector && (
          <ChainSelector
            chains={chains}
            currentChainId={chain?.id}
            labels={labels}
            onSwitch={onChainSwitch}
          />
        )
      }

      <div role="menu" aria-label="Account actions" onKeyDown={handleKeyDown}>
        <button
          type="button"
          role="menuitem"
          className="txkit-cw-dropdown-item"
          tabIndex={getTabIndex(0)}
          data-active={activeIndex === 0 || undefined}
          data-copied={copied || undefined}
          onClick={handleCopy}
        >
          <span>{copied ? labels.copied : labels.copyAddress}</span>
          <span className="txkit-cw-dropdown-item-secondary">
            {
              copied
                ? <span className="txkit-cw-copy-check" aria-hidden="true">&#10003;</span>
                : `${address.slice(0, 6)}...${address.slice(-4)}`
            }
          </span>
        </button>

        {
          explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="txkit-cw-dropdown-item"
              tabIndex={getTabIndex(1)}
              data-active={activeIndex === 1 || undefined}
            >
              <span>{labels.explorer}</span>
              <span className="txkit-cw-dropdown-item-secondary" aria-hidden="true">&#8599;</span>
            </a>
          )
        }

        <div className="txkit-cw-dropdown-divider" />

        <button
          type="button"
          role="menuitem"
          className="txkit-cw-dropdown-item"
          data-variant="danger"
          tabIndex={getTabIndex(menuItems.length - 1)}
          data-active={activeIndex === menuItems.length - 1 || undefined}
          onClick={handleDisconnect}
        >
          {labels.disconnect}
        </button>
      </div>
    </div>
  )
}


export default AccountDropdown
