import { useMemo, useSyncExternalStore } from 'react'

import safeStorage from '../../../helpers/safeStorage'
import { MAX_RECENT_WALLETS, RECENT_WALLETS_KEY } from './connectConstants'


type UseRecentWalletsReturn = {
  /** Ordered list of recent wallet connector IDs (most recent first) */
  recentIds: string[]
  /** Add a wallet ID to recent list */
  addRecent: (walletId: string) => void
}

const readFromStorage = (): string[] => {
  const stored = safeStorage.getItem(RECENT_WALLETS_KEY)
  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item): item is string => typeof item === 'string')
  }
  catch {
    return []
  }
}

const writeToStorage = (ids: string[]): void => {
  safeStorage.setItem(RECENT_WALLETS_KEY, JSON.stringify(ids))
}

// One module-level store, not per-instance useState: the default modal's WalletList
// and ConnectWallet's render-prop groupedConnectors both call this hook, and must
// read the same list and re-render together when either adds a recent wallet.
const serverSnapshot: string[] = []
const listeners = new Set<() => void>()
let snapshot: string[] = readFromStorage()

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = (): string[] => snapshot

const getServerSnapshot = (): string[] => serverSnapshot

const addRecent = (walletId: string): void => {
  const filtered = snapshot.filter((id) => id !== walletId)
  snapshot = [ walletId, ...filtered ].slice(0, MAX_RECENT_WALLETS)
  writeToStorage(snapshot)
  listeners.forEach((listener) => listener())
}

const useRecentWallets = (): UseRecentWalletsReturn => {
  const recentIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return useMemo(() => ({ recentIds, addRecent }), [ recentIds ])
}


export default useRecentWallets
