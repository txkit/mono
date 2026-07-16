'use client'
import React, { useState, useMemo, useCallback } from 'react'
import type { Connector } from 'wagmi'

import WalletItem from '../WalletItem'
import WalletQRCode from '../WalletQRCode'
import useDeepMemo from '../../../hooks/useDeepMemo'
import WalletConnecting from '../WalletConnecting'
import useDisplayUri from '../utils/useDisplayUri'
import useRecentWallets from '../utils/useRecentWallets'
import useWalletGroups from '../utils/useWalletGroups'
import WalletGroupSection from '../WalletGroupSection'
import useArrowNavigation from '../../../hooks/useArrowNavigation'
import { defaultLabels } from '../labels'
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
}

const WALLET_GROUP_CONFIG: readonly WalletGroupConfigItem[] = [
  { key: 'installed', labelKey: 'installedWallets', labelId: 'tx-group-installed' },
  { key: 'recent', labelKey: 'recentWallets', labelId: 'tx-group-recent' },
  { key: 'popular', labelKey: 'popularWallets', labelId: 'tx-group-popular' },
  { key: 'other', labelKey: 'allWallets', labelId: 'tx-group-other' },
]


export type WalletListProps = {
  connectors: readonly Connector[]
  connectingWallet?: string
  isTimedOut?: boolean
  onSelect: (connector: Connector) => void
  onCancelConnect?: () => void
  labels?: Partial<ConnectWalletLabels>
  showHelpLink?: boolean
}

const WalletList: React.FC<WalletListProps> = (props) => {
  const {
    labels,
    connectors,
    isTimedOut = false,
    showHelpLink = true,
    connectingWallet,
    onSelect,
    onCancelConnect,
  } = props

  const [ search, setSearch ] = useState('')

  const mergedLabels = useDeepMemo(
    () => ({ ...defaultLabels, ...labels }),
    [ labels ],
  )

  const { recentIds, addRecent } = useRecentWallets()
  const groupedConnectors = useWalletGroups({ connectors, recentIds })

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
    addRecent(connector.id)
    onSelect(connector)
  }, [ addRecent, onSelect ])

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

  const handleRetry = useCallback(() => {
    if (connectingConnector) {
      onSelect(connectingConnector)
    }
  }, [ connectingConnector, onSelect ])

  const handleBack = useCallback(() => {
    onCancelConnect?.()
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
      {mergedLabels.noWalletsFound}
    </div>
  )

  const emptyAvailableNode = (
    <div className="tx-cw-empty">
      {mergedLabels.noWalletsAvailable}
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
            label={mergedLabels[group.labelKey]}
            labelId={group.labelId}
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
    <>
      {
        showConnectingView && onCancelConnect && (
          <button
            type="button"
            className="tx-cw-modal-back"
            aria-label={mergedLabels.backToWalletList}
            onClick={handleBack}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )
      }

      {
        showConnectingView && connectingWallet && isWalletConnect && (
          <WalletQRCode
            uri={displayUri}
            isLoading={isLoadingUri}
            walletIcon={connectingIcon}
            isTimedOut={isTimedOut}
            labels={mergedLabels}
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
            labels={mergedLabels}
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
                    placeholder={mergedLabels.searchWallets}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label={mergedLabels.searchWallets}
                  />
                </div>
              )
            }

            <div
              role="listbox"
              aria-label={mergedLabels.selectWallet}
              onKeyDown={handleKeyDown}
              className="tx-cw-modal-list"
            >
              {contentNode}
            </div>
          </>
        )
      }

      {
        showHelpLink && (
          <ExternalLink
            href="https://ethereum.org/wallets"
            className="tx-cw-modal-help"
          >
            <span>{mergedLabels.whatIsWallet}</span>
            <ExternalLinkIcon size={12} />
          </ExternalLink>
        )
      }
    </>
  )
}


export default WalletList
