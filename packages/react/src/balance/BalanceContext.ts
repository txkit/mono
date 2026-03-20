import { createContext, useContext } from 'react'


export type BalanceContextValue = {
  /** Last observed block number from the block watcher */
  lastBlockNumber: bigint | undefined
  /** Invalidate balance queries for a specific address/token pair */
  invalidateBalance: (address: `0x${string}`, token?: `0x${string}`) => void
  /** Invalidate all balance queries globally */
  invalidateAllBalances: () => void
}

const BalanceContext = createContext<BalanceContextValue | null>(null)

/** Returns BalanceContext value or null if outside TxKitProvider (graceful degradation) */
export const useBalanceContext = (): BalanceContextValue | null => {
  return useContext(BalanceContext)
}


export default BalanceContext
