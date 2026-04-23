import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import type { Chain } from 'viem'
import { getExplorerUrl, copyToClipboard } from '@txkit/core'

import useEscapeKey from '../../hooks/useEscapeKey'
import useClickOutside from '../../hooks/useClickOutside'
import useArrowNavigation from '../../hooks/useArrowNavigation'
import AvatarFallback from './AvatarFallback'
import type { ConnectWalletLabels } from './labels'


type AccountDropdownProps = {
  address: string
  ensName?: string | null
  ensAvatar?: string | null
  avatarStyle?: 'gradient' | 'pixel'
  chain?: Chain
  requiredChain?: Chain
  labels: Required<ConnectWalletLabels>
  onClose: () => void
  onDisconnect: () => void
  onChainSwitch: (chainId: number) => void
}

const AccountDropdown: React.FC<AccountDropdownProps> = (props) => {
  const {
    address,
    ensName,
    ensAvatar,
    avatarStyle = 'gradient',
    chain,
    requiredChain,
    labels,
    onClose,
    onDisconnect,
    onChainSwitch,
  } = props

  const dropdownRef = useRef<HTMLDivElement>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [ copied, setCopied ] = useState(false)

  useClickOutside(dropdownRef, onClose)
  useEscapeKey(onClose)

  // Cleanup copied feedback timer on unmount
  useEffect(() => {
    return () => clearTimeout(copiedTimerRef.current)
  }, [])

  const explorerUrl = chain?.id ? getExplorerUrl(chain.id, address, 'address') : undefined

  const menuItems = useMemo(() => [
    { id: 'copy', label: labels.copyAddress },
    { id: 'disconnect', label: labels.disconnect },
  ], [ labels ])

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
      case 'disconnect':
        handleDisconnect()
        break
    }
  }, [ menuItems, handleCopy, handleDisconnect ])

  const getLabel = useCallback((index: number) => menuItems[index]?.label ?? '', [ menuItems ])

  const { activeIndex, handleKeyDown, getTabIndex } = useArrowNavigation({
    itemCount: menuItems.length,
    onActivate: handleActivate,
    getLabel,
  })

  const displayName = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`

  const isWrongChain = Boolean(requiredChain && chain && chain.id !== requiredChain.id)
  const switchLabel = requiredChain ? labels.switchTo.replace('{chain}', requiredChain.name) : ''

  // Identity row: clickable <a> if explorer available, <div> otherwise
  const identityContent = (
    <>
      {
        ensAvatar
          ? <img src={ensAvatar} alt="" className="txkit-cw-dropdown-avatar" />
          : <AvatarFallback address={address} variant={avatarStyle} />
      }
      <div className="txkit-cw-dropdown-identity-info">
        <div className="txkit-cw-dropdown-name">{displayName}</div>
        {
          chain && (
            <div className="txkit-cw-dropdown-chain">
              <span className="txkit-cw-dropdown-chain-dot" style={{ background: isWrongChain ? 'var(--txkit-color-warning)' : 'var(--txkit-color-success)' }} aria-hidden="true" />
              {chain.name}
            </div>
          )
        }
      </div>
      {
        explorerUrl && (
          <svg className="txkit-cw-dropdown-explorer-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        )
      }
    </>
  )

  return (
    <div
      ref={dropdownRef}
      id="txkit-account-dropdown"
      className="txkit-cw-dropdown"
    >
      {
        isWrongChain && requiredChain && (
          <div className="txkit-cw-dropdown-mismatch">
            <div className="txkit-cw-dropdown-chain-flow">
              <span className="txkit-cw-dropdown-chain-dot" style={{ background: 'var(--txkit-color-warning)' }} aria-hidden="true" />
              <span>{chain?.name}</span>
              <span className="txkit-cw-dropdown-chain-flow-arrow" aria-hidden="true">→</span>
              <span className="txkit-cw-dropdown-chain-target">
                <span className="txkit-cw-dropdown-chain-dot" style={{ background: 'var(--txkit-color-success)' }} aria-hidden="true" />
                {requiredChain.name}
              </span>
            </div>
            <button
              type="button"
              className="txkit-cw-dropdown-switch-cta"
              onClick={() => onChainSwitch(requiredChain.id)}
            >
              {switchLabel}
            </button>
          </div>
        )
      }

      {
        !isWrongChain && (
          <div className="txkit-cw-dropdown-header">
            {
              explorerUrl
                ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="txkit-cw-dropdown-identity-link"
                    aria-label={`${displayName} - ${labels.explorer}`}
                  >
                    {identityContent}
                  </a>
                )
                : (
                  <div className="txkit-cw-dropdown-identity-link">
                    {identityContent}
                  </div>
                )
            }
          </div>
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
          {
            copied
              ? (
                <svg className="txkit-cw-dropdown-item-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )
              : (
                <svg className="txkit-cw-dropdown-item-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )
          }
          <span>{copied ? labels.copied : labels.copyAddress}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="txkit-cw-dropdown-item"
          tabIndex={getTabIndex(1)}
          data-active={activeIndex === 1 || undefined}
          onClick={handleDisconnect}
        >
          <svg className="txkit-cw-dropdown-item-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {labels.disconnect}
        </button>
      </div>
    </div>
  )
}


export default AccountDropdown
