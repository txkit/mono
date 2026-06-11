'use client'
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import type { Chain } from 'viem'
import { getExplorerUrl, copyToClipboard } from '@txkit/core'

import copyIcon from '../../../assets/icons/copy.svg'
import checkIcon from '../../../assets/icons/check.svg'
import logOutIcon from '../../../assets/icons/log-out.svg'
import arrowRightIcon from '../../../assets/icons/arrow-right.svg'
import externalLinkIcon from '../../../assets/icons/external-link.svg'

import maskStyle from '../../../helpers/maskStyle'
import ExternalLink from '../../../helpers/ExternalLink'
import useEscapeKey from '../../../hooks/useEscapeKey'
import useClickOutside from '../../../hooks/useClickOutside'
import useArrowNavigation from '../../../hooks/useArrowNavigation'
import AvatarFallback from '../AvatarFallback'
import type { ConnectWalletLabels } from '../labels'


const copyMaskStyle = maskStyle(copyIcon)
const checkMaskStyle = maskStyle(checkIcon)
const logOutMaskStyle = maskStyle(logOutIcon)
const arrowMaskStyle = maskStyle(arrowRightIcon)
const explorerMaskStyle = maskStyle(externalLinkIcon)


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

  useEffect(() => {
    const firstItem = dropdownRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    firstItem?.focus()
  }, [])

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

  const accountLabel = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`

  const isWrongChain = Boolean(requiredChain && (!chain || chain.id !== requiredChain.id))
  const switchLabel = requiredChain ? labels.switchTo.replace('{chain}', requiredChain.name) : ''
  const currentChainLabel = chain?.name ?? labels.unknownChain

  const identityContent = (
    <>
      {
        ensAvatar
          ? <img src={ensAvatar} alt="" className="tx-cw-dropdown-avatar" />
          : <AvatarFallback address={address} variant={avatarStyle} />
      }
      <div className="tx-cw-dropdown-identity-info">
        <div className="tx-cw-dropdown-name">{accountLabel}</div>
        {
          chain && (
            <div className="tx-cw-dropdown-chain">
              <span
                className="tx-cw-dropdown-chain-dot"
                style={{ background: isWrongChain ? 'var(--tx-color-warning)' : 'var(--tx-color-success)' }}
                aria-hidden="true"
              />
              {chain.name}
            </div>
          )
        }
      </div>
      {
        explorerUrl && (
          <span className="tx-cw-dropdown-explorer-icon" style={explorerMaskStyle} aria-hidden="true" />
        )
      }
    </>
  )

  return (
    <div
      ref={dropdownRef}
      id="tx-account-dropdown"
      className="tx-cw-dropdown"
    >
      {
        isWrongChain && requiredChain && (
          <div className="tx-cw-dropdown-mismatch">
            <div className="tx-cw-dropdown-chain-flow">
              <span className="tx-cw-dropdown-chain-dot" style={{ background: 'var(--tx-color-warning)' }} aria-hidden="true" />
              <span>{currentChainLabel}</span>
              <span className="tx-cw-dropdown-chain-flow-arrow" style={arrowMaskStyle} aria-hidden="true" />
              <span className="tx-cw-dropdown-chain-target">
                <span className="tx-cw-dropdown-chain-dot" style={{ background: 'var(--tx-color-success)' }} aria-hidden="true" />
                {requiredChain.name}
              </span>
            </div>
            <button
              type="button"
              className="tx-cw-dropdown-switch-cta"
              onClick={() => onChainSwitch(requiredChain.id)}
            >
              {switchLabel}
            </button>
          </div>
        )
      }

      {
        !isWrongChain && (
          <div className="tx-cw-dropdown-header">
            {
              explorerUrl
                ? (
                  <ExternalLink
                    href={explorerUrl}
                    className="tx-cw-dropdown-identity-link"
                    aria-label={`${accountLabel} - ${labels.explorer}`}
                  >
                    {identityContent}
                  </ExternalLink>
                )
                : (
                  <div className="tx-cw-dropdown-identity-link">
                    {identityContent}
                  </div>
                )
            }
          </div>
        )
      }

      <div role="menu" aria-label={labels.menuLabel} onKeyDown={handleKeyDown}>
        <button
          type="button"
          role="menuitem"
          className="tx-cw-dropdown-item"
          tabIndex={getTabIndex(0)}
          data-active={activeIndex === 0 || undefined}
          data-copied={copied || undefined}
          onClick={handleCopy}
        >
          <span
            className="tx-cw-dropdown-item-icon"
            style={copied ? checkMaskStyle : copyMaskStyle}
            aria-hidden="true"
          />
          <span>{copied ? labels.copied : labels.copyAddress}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="tx-cw-dropdown-item"
          tabIndex={getTabIndex(1)}
          data-active={activeIndex === 1 || undefined}
          onClick={handleDisconnect}
        >
          <span
            className="tx-cw-dropdown-item-icon"
            style={logOutMaskStyle}
            aria-hidden="true"
          />
          {labels.disconnect}
        </button>
      </div>
    </div>
  )
}


export default AccountDropdown
