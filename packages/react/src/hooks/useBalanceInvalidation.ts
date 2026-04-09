import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import parseAffectedBalances, { type AffectedBalance } from '../helpers/parseAffectedBalances'


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

    // Native balance: always invalidate ['balance'] queries matching affected addresses
    const nativeAddresses = affected
      .filter((entry) => !entry.token)
      .map((entry) => entry.address.toLowerCase())

    if (nativeAddresses.length > 0) {
      queryClient.invalidateQueries({
        queryKey: [ 'balance' ],
        predicate: (query) => {
          const params = query.queryKey[1] as { address?: string } | undefined
          return Boolean(params?.address && nativeAddresses.includes(params.address.toLowerCase()))
        },
      })
    }

    // ERC-20: invalidate ['readContracts'] queries that include affected token contracts
    const tokenEntries = affected.filter((entry): entry is AffectedBalance & { token: `0x${string}` } =>
      Boolean(entry.token),
    )

    if (tokenEntries.length > 0) {
      const affectedTokens = new Set(tokenEntries.map((entry) => entry.token.toLowerCase()))

      queryClient.invalidateQueries({
        queryKey: [ 'readContracts' ],
        predicate: (query) => {
          const params = query.queryKey[1] as { contracts?: Array<{ address?: string }> } | undefined
          if (!params?.contracts) {
            return false
          }
          return params.contracts.some(
            (contract) => contract.address && affectedTokens.has(contract.address.toLowerCase()),
          )
        },
      })
    }
  }, [ queryClient ])

  return { invalidateAffected, invalidateAll }
}


export default useBalanceInvalidation
