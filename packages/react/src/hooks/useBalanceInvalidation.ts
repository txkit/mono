import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import parseAffectedBalances, { type AffectedBalance } from '../components/TokenBalance/utils/parseAffectedBalances'


type LogEntry = {
  address: `0x${string}`
  topics: `0x${string}`[]
  data: `0x${string}`
}

export type UseBalanceInvalidationReturn = {
  /** Invalidate balance queries only for addresses/tokens affected by transaction logs */
  invalidateAffected: (logs: LogEntry[], senderAddress: `0x${string}`) => void
  /** Invalidate all balance queries globally */
  invalidateAll: () => void
}

const useBalanceInvalidation = (): UseBalanceInvalidationReturn => {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [ 'balance' ] })
    queryClient.invalidateQueries({ queryKey: [ 'readContracts' ] })
  }, [ queryClient ])

  const invalidateAffected = useCallback((logs: LogEntry[], senderAddress: `0x${string}`) => {
    const affected = parseAffectedBalances(logs, senderAddress)

    if (affected.length === 0) {
      return
    }

    const nativeAddresses = affected
      .filter((entry) => !entry.token)
      .map((entry) => entry.address.toLowerCase())

    if (nativeAddresses.length > 0) {
      queryClient.invalidateQueries({
        queryKey: [ 'balance' ],
        predicate: (query) => {
          const params = query.queryKey[1]
          if (typeof params !== 'object' || params === null || !('address' in params)) {
            return false
          }
          const address = params.address
          return typeof address === 'string' && nativeAddresses.includes(address.toLowerCase())
        },
      })
    }

    const tokenEntries = affected.filter((entry): entry is AffectedBalance & { token: `0x${string}` } =>
      Boolean(entry.token),
    )

    if (tokenEntries.length > 0) {
      const affectedTokens: Record<string, true> = {}
      for (const entry of tokenEntries) {
        affectedTokens[entry.token.toLowerCase()] = true
      }

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
            const address = contract.address
            return typeof address === 'string' && Boolean(affectedTokens[address.toLowerCase()])
          })
        },
      })
    }
  }, [ queryClient ])

  return { invalidateAffected, invalidateAll }
}


export default useBalanceInvalidation
