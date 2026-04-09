'use client'
import React, { useRef, useState, useMemo, useCallback, type MouseEvent } from 'react'
import type { Connector } from 'wagmi'

import Portal from '../../primitives/Portal'
import useAriaHidden from '../../hooks/useAriaHidden'
import useEscapeKey from '../../hooks/useEscapeKey'
import useFocusTrap from '../../hooks/useFocusTrap'
import useScrollLock from '../../hooks/useScrollLock'
import useArrowNavigation from '../../hooks/useArrowNavigation'
import WalletConnecting from './WalletConnecting'
import WalletQRCode from './WalletQRCode'
import useDisplayUri from '../shared/useDisplayUri'
import { SEARCH_THRESHOLD } from '../shared/constants'
import { WALLET_FALLBACK_ICONS } from '../shared/wallet-icons'
import type { WalletGroups } from '../shared/useWalletGroups'
import type { ConnectWalletLabels } from '../labels'


type WalletModalProps = {
  labels: Required<ConnectWalletLabels>
  connectors: readonly Connector[]
  groupedConnectors: WalletGroups
  recentIds: string[]
  connectingWallet: string | undefined
  isTimedOut: boolean
  onClose: () => void
  onSelect: (connector: Connector) => void
  onCancelConnect: () => void
}

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

const WalletItem: React.FC<WalletItemProps> = ({
  connector,
  isActive,
  isRecent,
  tabIndex,
  onSelect,
}) => {
  const icon = connector.icon || WALLET_FALLBACK_ICONS[connector.id] || null

  return (
    <div
      key={connector.uid}
      role="option"
      className="txkit-cw-wallet"
      tabIndex={tabIndex}
      data-active={isActive || undefined}
      aria-selected={isActive}
      onClick={() => onSelect(connector)}
    >
      {
        icon
          ? <img src={icon} alt="" className="txkit-cw-wallet-icon" />
          : (
            <span
              className="txkit-cw-wallet-icon txkit-cw-wallet-icon-fallback"
              style={{ background: getIconGradient(connector.name) }}
            >
              {connector.name.charAt(0).toUpperCase()}
            </span>
          )
      }
      <span className="txkit-cw-wallet-name">{connector.name}</span>
      {
        isRecent && (
          <span className="txkit-cw-wallet-badge">Recent</span>
        )
      }
    </div>
  )
}


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

const WalletModal: React.FC<WalletModalProps> = ({
  labels,
  connectors,
  groupedConnectors,
  recentIds,
  connectingWallet,
  isTimedOut,
  onClose,
  onSelect,
  onCancelConnect,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [ search, setSearch ] = useState('')

  useAriaHidden(overlayRef)
  useEscapeKey(onClose)
  useFocusTrap(modalRef, true)
  useScrollLock(true)

  // Flatten grouped connectors into ordered list for arrow navigation
  const { flatList, groupOffsets } = useMemo(() => {
    const groups = [
      { key: 'installed', items: groupedConnectors.installed },
      { key: 'recent', items: groupedConnectors.recent },
      { key: 'popular', items: groupedConnectors.popular },
      { key: 'other', items: groupedConnectors.other },
    ]

    const flat: Connector[] = []
    const offsets: Record<string, number> = {}

    for (const group of groups) {
      offsets[group.key] = flat.length
      flat.push(...group.items)
    }

    return { flatList: flat, groupOffsets: offsets }
  }, [ groupedConnectors ])

  // Filter by search
  const filteredList = useMemo(() => {
    if (!search.trim()) {
      return flatList
    }
    const query = search.toLowerCase()
    return flatList.filter((connector) => connector.name.toLowerCase().includes(query))
  }, [ flatList, search ])

  const showSearch = connectors.length >= SEARCH_THRESHOLD
  const isSearching = search.trim().length > 0

  // Find the connecting connector
  const connectingConnector = useMemo(() => {
    if (!connectingWallet) {
      return undefined
    }
    return connectors.find((connector) => connector.name === connectingWallet)
  }, [ connectors, connectingWallet ])

  const handleSelect = useCallback((connector: Connector) => {
    onSelect(connector)
  }, [ onSelect ])

  const handleActivate = useCallback((index: number) => {
    const connector = filteredList[index]
    if (connector) {
      handleSelect(connector)
    }
  }, [ filteredList, handleSelect ])

  const getLabel = useCallback(
    (index: number) => filteredList[index]?.name ?? '',
    [ filteredList ],
  )

  const { activeIndex, handleKeyDown, getTabIndex } = useArrowNavigation({
    itemCount: filteredList.length,
    onActivate: handleActivate,
    getLabel,
    typeAhead: !showSearch,
  })

  const handleOverlayClick = useCallback((event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [ onClose ])

  const handleRetry = useCallback(() => {
    if (connectingConnector) {
      onSelect(connectingConnector)
    }
  }, [ connectingConnector, onSelect ])

  const handleTryDifferent = useCallback(() => {
    onCancelConnect()
    setSearch('')
  }, [ onCancelConnect ])

  // WalletConnect QR code - capture display_uri from connector's emitter
  const { displayUri, isLoadingUri } = useDisplayUri(connectingConnector, Boolean(connectingWallet))
  const isWalletConnect = connectingConnector?.id === 'walletConnect'

  // Show connecting view - extract to variable to avoid double ternary in JSX
  const showConnectingView = Boolean(connectingWallet)
  const connectingIcon = connectingConnector?.icon || WALLET_FALLBACK_ICONS[connectingConnector?.id ?? '']

  // Total wallet count for empty state
  const totalWallets = groupedConnectors.installed.length
    + groupedConnectors.recent.length
    + groupedConnectors.popular.length
    + groupedConnectors.other.length

  return (
    <Portal>
      <div ref={overlayRef} className="txkit-cw-overlay" onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          id="txkit-wallet-modal"
          className="txkit-cw-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="txkit-wallet-modal-title"
        >
          <div className="txkit-cw-modal-header">
            {
              showConnectingView
                ? (
                  <button
                    type="button"
                    className="txkit-cw-modal-back"
                    onClick={handleTryDifferent}
                    aria-label="Back to wallet list"
                  >
                    &#8592;
                  </button>
                )
                : null
            }
            <h2 id="txkit-wallet-modal-title" className="txkit-cw-modal-title">
              {
                showConnectingView && connectingWallet
                  ? connectingWallet
                  : labels.selectWallet
              }
            </h2>
            <button
              type="button"
              className="txkit-cw-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {
            showConnectingView && connectingWallet && isWalletConnect && (
              <WalletQRCode
                uri={displayUri}
                isLoading={isLoadingUri}
                walletIcon={connectingIcon}
                isTimedOut={isTimedOut}
                labels={labels}
                onRetry={handleRetry}
              />
            )
          }

          {
            showConnectingView && connectingWallet && !isWalletConnect && (
              <WalletConnecting
                walletName={connectingWallet}
                walletIcon={connectingIcon}
                isTimedOut={isTimedOut}
                labels={labels}
                onRetry={handleRetry}
              />
            )
          }

          {
            !showConnectingView && (
                <>
                  {
                    showSearch && (
                      <div className="txkit-cw-search-wrap">
                        <input
                          type="text"
                          className="txkit-cw-search"
                          placeholder={labels.searchWallets}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          aria-label={labels.searchWallets}
                        />
                      </div>
                    )
                  }

                  <div
                    role="listbox"
                    aria-labelledby="txkit-wallet-modal-title"
                    onKeyDown={handleKeyDown}
                    className="txkit-cw-modal-list"
                  >
                    {
                      isSearching
                        ? (
                          filteredList.length > 0
                            ? filteredList.map((connector, index) => (
                              <WalletItem
                                key={connector.uid}
                                connector={connector}
                                isActive={index === activeIndex}
                                isRecent={recentIds.includes(connector.id)}
                                tabIndex={getTabIndex(index)}
                                onSelect={handleSelect}
                              />
                            ))
                            : (
                              <div className="txkit-cw-empty">
                                No wallets found
                              </div>
                            )
                        )
                        : totalWallets > 0
                          ? (
                            <>
                              <WalletGroupSection
                                label={labels.installedWallets}
                                labelId="txkit-group-installed"
                                variant="accent"
                                connectors={groupedConnectors.installed}
                                recentIds={recentIds}
                                activeIndex={activeIndex}
                                indexOffset={groupOffsets.installed}
                                getTabIndex={getTabIndex}
                                onSelect={handleSelect}
                              />
                              <WalletGroupSection
                                label={labels.recentWallets}
                                labelId="txkit-group-recent"
                                connectors={groupedConnectors.recent}
                                recentIds={recentIds}
                                activeIndex={activeIndex}
                                indexOffset={groupOffsets.recent}
                                getTabIndex={getTabIndex}
                                onSelect={handleSelect}
                              />
                              <WalletGroupSection
                                label={labels.popularWallets}
                                labelId="txkit-group-popular"
                                connectors={groupedConnectors.popular}
                                recentIds={recentIds}
                                activeIndex={activeIndex}
                                indexOffset={groupOffsets.popular}
                                getTabIndex={getTabIndex}
                                onSelect={handleSelect}
                              />
                              <WalletGroupSection
                                label={labels.allWallets}
                                labelId="txkit-group-other"
                                connectors={groupedConnectors.other}
                                recentIds={recentIds}
                                activeIndex={activeIndex}
                                indexOffset={groupOffsets.other}
                                getTabIndex={getTabIndex}
                                onSelect={handleSelect}
                              />
                            </>
                          )
                          : (
                            <div className="txkit-cw-empty">
                              No wallets available
                            </div>
                          )
                    }
                  </div>
                </>
              )
          }

          <a
            href="https://ethereum.org/wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="txkit-cw-modal-help"
          >
            {labels.whatIsWallet}
          </a>
        </div>
      </div>
    </Portal>
  )
}


export default WalletModal
