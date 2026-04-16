import { useMemo } from 'react'
import { erc20Abi } from 'viem'
import { useConnection, useBalance, useChainId, useReadContracts } from 'wagmi'


export type UseTokenBalanceOptions = {
  /** ERC-20 token address. Omit for native token (ETH) */
  token?: `0x${string}`
  /** Wallet address. @default connected wallet */
  address?: `0x${string}`
  /** Chain ID. @default current chain */
  chainId?: number
  /** Polling interval in ms. Omit to use block-based refresh via BalanceWatcher */
  refetchInterval?: number
  /** Enable/disable fetching. @default true */
  enabled?: boolean
}

export type UseTokenBalanceReturn = {
  /** Raw balance in smallest unit (wei) */
  balance: bigint | undefined
  /** Token decimals */
  decimals: number | undefined
  /** Token symbol */
  symbol: string | undefined
  /** True while fetching */
  isLoading: boolean
  /** True if fetch failed (including individual sub-call failures) */
  isError: boolean
  /** Error object */
  error: Error | null
  /** Manually trigger refetch */
  refetch: () => void
}

const useTokenBalance = (options: UseTokenBalanceOptions = {}): UseTokenBalanceReturn => {
  const { token, address: addressProp, chainId: chainIdProp, refetchInterval, enabled = true } = options

  const { address: connectedAddress } = useConnection()
  const currentChainId = useChainId()

  const address = addressProp ?? connectedAddress
  const chainId = chainIdProp ?? currentChainId
  const interval = refetchInterval ?? undefined

  // Native token balance
  const {
    data: nativeData,
    isLoading: nativeLoading,
    isError: nativeError,
    error: nativeErr,
    refetch: nativeRefetch,
  } = useBalance({
    address,
    chainId,
    query: {
      enabled: enabled && Boolean(address) && !token,
      refetchInterval: interval,
    },
  })

  // ERC-20 token balance
  const {
    data: erc20Data,
    isLoading: erc20Loading,
    isError: erc20Error,
    error: erc20Err,
    refetch: erc20Refetch,
  } = useReadContracts({
    contracts: [
      {
        address: token!,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [ address! ],
        chainId,
      },
      {
        address: token!,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId,
      },
      {
        address: token!,
        abi: erc20Abi,
        functionName: 'symbol',
        chainId,
      },
    ],
    query: {
      enabled: enabled && Boolean(address) && Boolean(token),
      refetchInterval: interval,
    },
  })

  return useMemo(() => {
    if (!token) {
      return {
        balance: nativeData?.value,
        decimals: nativeData?.decimals,
        symbol: nativeData?.symbol,
        isLoading: nativeLoading,
        isError: nativeError,
        error: nativeErr,
        refetch: nativeRefetch,
      }
    }

    const balanceResult = erc20Data?.[0]
    const decimalsResult = erc20Data?.[1]
    const symbolResult = erc20Data?.[2]

    const hasSubCallError = balanceResult?.status === 'failure'
      || decimalsResult?.status === 'failure'
      || symbolResult?.status === 'failure'

    return {
      balance: typeof balanceResult?.result === 'bigint' ? balanceResult.result : undefined,
      decimals: typeof decimalsResult?.result === 'number' ? decimalsResult.result : undefined,
      symbol: typeof symbolResult?.result === 'string' ? symbolResult.result : undefined,
      isLoading: erc20Loading,
      isError: erc20Error || hasSubCallError,
      error: erc20Err ?? (hasSubCallError ? new Error('Failed to read token data') : null),
      refetch: erc20Refetch,
    }
  }, [
    token, nativeData, nativeLoading, nativeError, nativeErr, nativeRefetch,
    erc20Data, erc20Loading, erc20Error, erc20Err, erc20Refetch,
  ])
}


export default useTokenBalance
