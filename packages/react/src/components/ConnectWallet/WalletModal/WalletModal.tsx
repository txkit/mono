'use client'
import React, { useRef, useState, useMemo, useCallback, type MouseEvent } from 'react'
import type { Connector } from 'wagmi'

import Portal from '../../Portal'
import WalletItem from '../WalletItem'
import WalletQRCode from '../WalletQRCode'
import useEscapeKey from '../../../hooks/useEscapeKey'
import useFocusTrap from '../../../hooks/useFocusTrap'
import useScrollLock from '../../../hooks/useScrollLock'
import useAriaHidden from '../../../hooks/useAriaHidden'
import WalletConnecting from '../WalletConnecting'
import useDisplayUri from '../utils/useDisplayUri'
import WalletGroupSection from '../WalletGroupSection'
import useArrowNavigation from '../../../hooks/useArrowNavigation'
import type { ConnectWalletLabels } from '../labels'
import type { WalletGroups } from '../utils/useWalletGroups'
import { SEARCH_THRESHOLD } from '../utils/connectConstants'
import { WALLET_FALLBACK_ICONS } from '../../../helpers/walletIcons'

import ExternalLink from '../../../helpers/ExternalLink'
import ExternalLinkIcon from '../../ExternalLinkIcon/ExternalLinkIcon'


type WalletGroupKey = keyof WalletGroups
type WalletLabelKey = 'installedWallets' | 'recentWallets' | 'popularWallets' | 'allWallets'

type WalletGroupConfigItem = {
  key: WalletGroupKey
  labelKey: WalletLabelKey
  labelId: string
  variant?: 'accent' | 'default'
}

const WALLET_GROUP_CONFIG: readonly WalletGroupConfigItem[] = [
  { key: 'installed', labelKey: 'installedWallets', labelId: 'tx-group-installed', variant: 'accent' },
  { key: 'recent', labelKey: 'recentWallets', labelId: 'tx-group-recent' },
  { key: 'popular', labelKey: 'popularWallets', labelId: 'tx-group-popular' },
  { key: 'other', labelKey: 'allWallets', labelId: 'tx-group-other' },
]


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

const WalletModal: React.FC<WalletModalProps> = (props) => {
  const {
    labels,
    connectors,
    groupedConnectors,
    recentIds,
    connectingWallet,
    isTimedOut,
    onClose,
    onSelect,
    onCancelConnect,
  } = props

  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [ search, setSearch ] = useState('')

  useAriaHidden(overlayRef)
  useEscapeKey(onClose)
  useFocusTrap(modalRef, true)
  useScrollLock(true)

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

  const filteredList = useMemo(() => {
    if (!search.trim()) {
      return flatList
    }
    const query = search.toLowerCase()
    return flatList.filter((connector) => connector.name.toLowerCase().includes(query))
  }, [ flatList, search ])

  const showSearch = connectors.length >= SEARCH_THRESHOLD
  const isSearching = search.trim().length > 0

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

  const { displayUri, isLoadingUri } = useDisplayUri(connectingConnector, Boolean(connectingWallet))
  const isWalletConnect = connectingConnector?.id === 'walletConnect'

  const showConnectingView = Boolean(connectingWallet)
  const connectingIcon = connectingConnector?.icon || WALLET_FALLBACK_ICONS[connectingConnector?.id ?? '']

  const totalWallets = groupedConnectors.installed.length
    + groupedConnectors.recent.length
    + groupedConnectors.popular.length
    + groupedConnectors.other.length

  const emptySearchNode = (
    <div className="tx-cw-empty">
      {labels.noWalletsFound}
    </div>
  )

  const emptyAvailableNode = (
    <div className="tx-cw-empty">
      {labels.noWalletsAvailable}
    </div>
  )

  const searchResultsNode = filteredList.length > 0
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
    : emptySearchNode

  const groupedListingNode = (
    <>
      {
        WALLET_GROUP_CONFIG.map((group) => (
          <WalletGroupSection
            key={group.key}
            label={labels[group.labelKey]}
            labelId={group.labelId}
            variant={group.variant}
            connectors={groupedConnectors[group.key]}
            recentIds={recentIds}
            activeIndex={activeIndex}
            indexOffset={groupOffsets[group.key]}
            getTabIndex={getTabIndex}
            onSelect={handleSelect}
          />
        ))
      }
    </>
  )

  const listingNode = totalWallets > 0 ? groupedListingNode : emptyAvailableNode
  const contentNode = isSearching ? searchResultsNode : listingNode

  return (
    <Portal>
      <div ref={overlayRef} className="tx-cw-overlay" onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          id="tx-wallet-modal"
          className="tx-cw-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-wallet-modal-title"
        >
          <div className="tx-cw-modal-header">
            {
              showConnectingView
                ? (
                  <button
                    type="button"
                    className="tx-cw-modal-back"
                    onClick={handleTryDifferent}
                    aria-label={labels.backToWalletList}
                  >
                    &#8592;
                  </button>
                )
                : null
            }
            <div className="tx-cw-modal-heading">
              <h2 id="tx-wallet-modal-title" className="tx-cw-modal-title">
                {
                  showConnectingView && connectingWallet
                    ? connectingWallet
                    : labels.selectWallet
                }
              </h2>
              {
                !showConnectingView && typeof window !== 'undefined' && (
                  <p className="tx-cw-modal-origin">
                    {labels.connectingTo || 'Connecting to'}{' '}
                    <span className="tx-cw-modal-origin-host">{window.location.host}</span>
                  </p>
                )
              }
            </div>
            <button
              type="button"
              className="tx-cw-modal-close"
              onClick={onClose}
              aria-label={labels.close}
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
                    <div className="tx-cw-search-wrap">
                      <input
                        type="text"
                        className="tx-cw-search"
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
                  aria-labelledby="tx-wallet-modal-title"
                  onKeyDown={handleKeyDown}
                  className="tx-cw-modal-list"
                >
                  {contentNode}
                </div>
              </>
            )
          }

          <ExternalLink
            href="https://ethereum.org/wallets"
            className="tx-cw-modal-help"
          >
            <span>{labels.whatIsWallet}</span>
            <ExternalLinkIcon size={12} />
          </ExternalLink>
        </div>
      </div>
    </Portal>
  )
}


export default WalletModal
