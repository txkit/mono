import { useState, useCallback } from 'react'

import safeStorage from '../../../helpers/safeStorage'
import { MAX_RECENT_WALLETS, RECENT_WALLETS_KEY } from '../../../helpers/connectConstants'


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

const writeToStorage = (ids: string[]) => {
  safeStorage.setItem(RECENT_WALLETS_KEY, JSON.stringify(ids))
}

const useRecentWallets = (): UseRecentWalletsReturn => {
  // Lazy init reads from localStorage synchronously on first render.
  // safeStorage handles SSR (returns null) and incognito (memory fallback).
  const [ recentIds, setRecentIds ] = useState(readFromStorage)

  const addRecent = useCallback((walletId: string) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== walletId)
      const updated = [ walletId, ...filtered ].slice(0, MAX_RECENT_WALLETS)
      writeToStorage(updated)
      return updated
    })
  }, [])

  return { recentIds, addRecent }
}


export default useRecentWallets
