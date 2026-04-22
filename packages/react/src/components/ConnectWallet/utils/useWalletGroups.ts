import { useMemo } from 'react'
import type { Connector } from 'wagmi'

import { POPULAR_WALLET_RDNS } from '../../../helpers/connectConstants'


export type WalletGroups = {
  installed: Connector[]
  recent: Connector[]
  popular: Connector[]
  other: Connector[]
}

type UseWalletGroupsOptions = {
  connectors: readonly Connector[]
  recentIds: string[]
}

/**
 * Detect EIP-6963 wallets. In wagmi v2, EIP-6963 connectors have:
 * - type: 'injected'
 * - id: the rdns value (e.g. 'io.metamask', 'io.rabby')
 * - icon: data URI from wallet metadata
 *
 * Generic injected connector has id='injected', no icon.
 * SDK connectors (coinbaseWalletSDK) have their own type, not 'injected'.
 */
const isEip6963 = (connector: Connector): boolean =>
  connector.type === 'injected' && connector.id !== 'injected'

/**
 * Groups connectors into: installed (EIP-6963) -> recent -> popular -> other.
 * A connector appears in only one group (highest priority wins).
 *
 * Deduplication rules:
 * - Generic "injected" connector hidden when EIP-6963 wallets are detected
 * - SDK connectors deduped if same wallet detected via EIP-6963
 */
const useWalletGroups = ({ connectors, recentIds }: UseWalletGroupsOptions): WalletGroups => {
  return useMemo(() => {
    // Collect EIP-6963 wallet ids for dedup
    const eip6963Ids: Record<string, true> = {}
    let hasEip6963Wallets = false
    for (const connector of connectors) {
      if (isEip6963(connector)) {
        eip6963Ids[connector.id] = true
        hasEip6963Wallets = true
      }
    }

    // Filter out redundant connectors before grouping
    const filtered = connectors.filter((connector) => {
      // Hide generic "injected" connector when EIP-6963 wallets exist
      // (EIP-6963 provides specific wallet identity - MetaMask, Rabby etc.)
      if (connector.id === 'injected' && connector.type === 'injected' && hasEip6963Wallets) {
        return false
      }

      // Hide SDK connectors when same wallet detected via EIP-6963
      // (e.g. coinbaseWalletSDK has rdns 'com.coinbase.wallet', EIP-6963 id matches)
      if (connector.id === 'coinbaseWalletSDK' && eip6963Ids['com.coinbase.wallet']) {
        return false
      }

      return true
    })

    const assigned: Record<string, true> = {}
    const installed: Connector[] = []
    const recent: Connector[] = []
    const popular: Connector[] = []
    const other: Connector[] = []

    // 1. Installed wallets (EIP-6963 detected)
    for (const connector of filtered) {
      if (isEip6963(connector)) {
        installed.push(connector)
        assigned[connector.uid] = true
      }
    }

    // 2. Recent wallets (by stored IDs, preserving order)
    for (const recentId of recentIds) {
      const connector = filtered.find(
        (connector) => connector.id === recentId && !assigned[connector.uid]
      )
      if (connector) {
        recent.push(connector)
        assigned[connector.uid] = true
      }
    }

    // 3. Popular wallets (by known RDNS list - only non-installed)
    for (const connector of filtered) {
      if (assigned[connector.uid]) {
        continue
      }
      if (POPULAR_WALLET_RDNS.includes(connector.id)) {
        popular.push(connector)
        assigned[connector.uid] = true
      }
    }

    // 4. Everything else (WalletConnect, SDK connectors, generic injected if no EIP-6963)
    for (const connector of filtered) {
      if (!assigned[connector.uid]) {
        other.push(connector)
      }
    }

    return { installed, recent, popular, other }
  }, [ connectors, recentIds ])
}


export default useWalletGroups
