'use client'
import React, { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWatchBlockNumber } from 'wagmi'

import { useTxKit } from '../TxKitProvider'
import useActiveBrowserTab from '../../../hooks/useActiveBrowserTab'
import BalanceContext, { type BalanceContextValue } from '../../../hooks/useBalanceContext'


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
    const target = address.toLowerCase()

    if (!token) {
      queryClient.invalidateQueries({
        queryKey: [ 'balance' ],
        predicate: (query) => {
          const params = query.queryKey[1]
          if (typeof params !== 'object' || params === null || !('address' in params)) {
            return false
          }
          const candidate = params.address
          return typeof candidate === 'string' && candidate.toLowerCase() === target
        },
      })
      return
    }

    const targetToken = token.toLowerCase()

    queryClient.invalidateQueries({
      queryKey: [ 'readContracts' ],
      predicate: (query) => {
        const params = query.queryKey[1]
        if (typeof params !== 'object' || params === null || !('contracts' in params)) {
          return false
        }
        const contracts = params.contracts
        if (!Array.isArray(contracts)) {
          return false
        }
        return contracts.some((contract) => {
          if (typeof contract !== 'object' || contract === null || !('address' in contract)) {
            return false
          }
          const candidate = contract.address
          return typeof candidate === 'string' && candidate.toLowerCase() === targetToken
        })
      },
    })
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
