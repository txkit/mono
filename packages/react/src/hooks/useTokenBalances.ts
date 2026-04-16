import { useMemo, useCallback } from 'react'
import { erc20Abi } from 'viem'
import { useConnection, useBalance, useChainId, useReadContracts } from 'wagmi'


export type UseTokenBalancesOptions = {
  /** Array of token addresses or 'native' for ETH/MATIC */
  tokens: Array<`0x${string}` | 'native'>
  /** Wallet address. @default connected wallet */
  address?: `0x${string}`
  /** Chain ID. @default current chain */
  chainId?: number
  /** Polling interval in ms. Omit to use block-based refresh via BalanceWatcher */
  refetchInterval?: number
  /** Enable/disable fetching. @default true */
  enabled?: boolean
}

/** Balance data for a single token in the batch result */
export type TokenBalanceItem = {
  /** Token address or 'native' */
  token: `0x${string}` | 'native'
  /** Raw balance in smallest unit */
  balance: bigint | undefined
  /** Token decimals */
  decimals: number | undefined
  /** Token symbol */
  symbol: string | undefined
  /** True while fetching */
  isLoading: boolean
  /** True if fetch failed */
  isError: boolean
}

export type UseTokenBalancesReturn = {
  /** Array of balance items matching input tokens order */
  balances: TokenBalanceItem[]
  /** True if any token is still loading */
  isLoading: boolean
  /** True if any token fetch failed */
  isError: boolean
  /** Refetch all balances */
  refetch: () => void
}

const useTokenBalances = (options: UseTokenBalancesOptions): UseTokenBalancesReturn => {
  const { tokens, address: addressProp, chainId: chainIdProp, refetchInterval, enabled = true } = options

  const { address: connectedAddress } = useConnection()
  const currentChainId = useChainId()

  const address = addressProp ?? connectedAddress
  const chainId = chainIdProp ?? currentChainId
  const interval = refetchInterval ?? undefined

  const hasNative = tokens.includes('native')
  const erc20Tokens = useMemo(
    () => tokens.filter((token): token is `0x${string}` => token !== 'native'),
    [ tokens ],
  )

  // Native balance
  const {
    data: nativeData,
    isLoading: nativeLoading,
    isError: nativeError,
    refetch: nativeRefetch,
  } = useBalance({
    address,
    chainId,
    query: {
      enabled: enabled && Boolean(address) && hasNative,
      refetchInterval: interval,
    },
  })

  // ERC-20 balances via multicall
  const contracts = erc20Tokens.flatMap((token) => [
    { address: token, abi: erc20Abi, functionName: 'balanceOf' as const, args: [ address! ], chainId },
    { address: token, abi: erc20Abi, functionName: 'decimals' as const, chainId },
    { address: token, abi: erc20Abi, functionName: 'symbol' as const, chainId },
  ])

  const {
    data: erc20Data,
    isLoading: erc20Loading,
    isError: erc20Error,
    refetch: erc20Refetch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: enabled && Boolean(address) && erc20Tokens.length > 0,
      refetchInterval: interval,
    },
  })

  const balances = useMemo(() => {
    const result: TokenBalanceItem[] = []

    for (const token of tokens) {
      if (token === 'native') {
        result.push({
          token: 'native',
          balance: nativeData?.value,
          decimals: nativeData?.decimals,
          symbol: nativeData?.symbol,
          isLoading: nativeLoading,
          isError: nativeError,
        })
      } else {
        const idx = erc20Tokens.indexOf(token) * 3
        const balanceResult = erc20Data?.[idx]?.result
        const decimalsResult = erc20Data?.[idx + 1]?.result
        const symbolResult = erc20Data?.[idx + 2]?.result
        result.push({
          token,
          balance: typeof balanceResult === 'bigint' ? balanceResult : undefined,
          decimals: typeof decimalsResult === 'number' ? decimalsResult : undefined,
          symbol: typeof symbolResult === 'string' ? symbolResult : undefined,
          isLoading: erc20Loading,
          isError: erc20Error,
        })
      }
    }

    return result
  }, [ tokens, erc20Tokens, nativeData, nativeLoading, nativeError, erc20Data, erc20Loading, erc20Error ])

  const refetch = useCallback(() => {
    if (hasNative) {
      nativeRefetch()
    }
    if (erc20Tokens.length > 0) {
      erc20Refetch()
    }
  }, [ hasNative, erc20Tokens, nativeRefetch, erc20Refetch ])

  return {
    balances,
    isLoading: (hasNative && nativeLoading) || (erc20Tokens.length > 0 && erc20Loading),
    isError: nativeError || erc20Error,
    refetch,
  }
}


export default useTokenBalances
