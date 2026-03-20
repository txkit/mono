'use client'
import React, { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWatchBlockNumber } from 'wagmi'

import { useTxKit } from '../provider/TxKitProvider'
import useActiveBrowserTab from '../hooks/useActiveBrowserTab'
import BalanceContext, { type BalanceContextValue } from './BalanceContext'


type BalanceWatcherProps = {
  children: ReactNode
}

const BalanceWatcher: React.FC<BalanceWatcherProps> = ({ children }) => {
  const { config } = useTxKit()
  const queryClient = useQueryClient()
  const { isActive } = useActiveBrowserTab()

  const [ lastBlockNumber, setLastBlockNumber ] = useState<bigint | undefined>(undefined)
  const lastInvalidationRef = useRef(0)

  const { enabled, throttleMs } = config.blockWatching

  const onBlockNumber = useCallback((blockNumber: bigint) => {
    setLastBlockNumber(blockNumber)

    const now = Date.now()
    if (now - lastInvalidationRef.current < throttleMs) {
      return
    }
    lastInvalidationRef.current = now

    queryClient.invalidateQueries({ queryKey: [ 'balance' ], type: 'active' })
    queryClient.invalidateQueries({ queryKey: [ 'readContracts' ], type: 'active' })
  }, [ queryClient, throttleMs ])

  useWatchBlockNumber({
    enabled: enabled && isActive,
    onBlockNumber,
  })

  const invalidateBalance = useCallback((address: `0x${string}`, token?: `0x${string}`) => {
    if (!token) {
      queryClient.invalidateQueries({
        queryKey: [ 'balance' ],
        predicate: (query) => {
          const params = query.queryKey[1] as { address?: string } | undefined
          return Boolean(params?.address && params.address.toLowerCase() === address.toLowerCase())
        },
      })
    } else {
      queryClient.invalidateQueries({
        queryKey: [ 'readContracts' ],
        predicate: (query) => {
          const params = query.queryKey[1] as { contracts?: Array<{ address?: string }> } | undefined
          if (!params?.contracts) {
            return false
          }
          return params.contracts.some(
            (contract) => contract.address && contract.address.toLowerCase() === token.toLowerCase(),
          )
        },
      })
    }
  }, [ queryClient ])

  const invalidateAllBalances = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [ 'balance' ] })
    queryClient.invalidateQueries({ queryKey: [ 'readContracts' ] })
  }, [ queryClient ])

  const contextValue = useMemo<BalanceContextValue>(() => ({
    lastBlockNumber,
    invalidateBalance,
    invalidateAllBalances,
  }), [ lastBlockNumber, invalidateBalance, invalidateAllBalances ])

  return (
    <BalanceContext.Provider value={contextValue}>
      {children}
    </BalanceContext.Provider>
  )
}


export default BalanceWatcher
