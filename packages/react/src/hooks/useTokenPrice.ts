import { useMemo } from 'react'
import { useChainId } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { DEFILLAMA_PRICE_URL, CHAIN_TO_DEFILLAMA, NATIVE_PRICE_IDS } from '@txkit/core'

import useFiatRates from '../components/TokenBalance/utils/useFiatRates'


export type UseTokenPriceOptions = {
  /** ERC-20 token address. Omit for native token price */
  token?: `0x${string}`
  /** Chain ID. @default current chain */
  chainId?: number
  /** Fiat currency for conversion. @default 'USD' */
  fiatCurrency?: string
  /** Enable/disable price fetching. @default true */
  enabled?: boolean
}

export type UseTokenPriceReturn = {
  /** Token price in selected fiat currency */
  price: number | undefined
  /** True while fetching price */
  isLoading: boolean
  /** True if price fetch failed (fiat display hidden silently) */
  isError: boolean
}

const fetchTokenPrice = async (chainId: number, token?: string): Promise<number | undefined> => {
  const chainName = CHAIN_TO_DEFILLAMA[chainId]
  if (!chainName) {
    return undefined
  }

  const coinId = token
    ? `${chainName}:${token}`
    : NATIVE_PRICE_IDS[chainId]

  if (!coinId) {
    return undefined
  }

  const res = await fetch(`${DEFILLAMA_PRICE_URL}/${coinId}`)
  if (!res.ok) {
    return undefined
  }

  try {
    const data = await res.json()
    return data.coins?.[coinId]?.price
  } catch {
    return undefined
  }
}

const useTokenPrice = (options: UseTokenPriceOptions = {}): UseTokenPriceReturn => {
  const {
    token,
    chainId: chainIdProp,
    fiatCurrency = 'USD',
    enabled = true,
  } = options

  const currentChainId = useChainId()
  const chainId = chainIdProp ?? currentChainId

  const needsForex = fiatCurrency !== 'USD'
  const { data: fiatRates } = useFiatRates(enabled && needsForex)

  const {
    data: usdPrice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [ 'txkit-token-price', chainId, token ?? 'native' ],
    queryFn: () => fetchTokenPrice(chainId, token),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
    enabled,
  })

  const price = useMemo(() => {
    if (usdPrice === undefined) return undefined
    if (!needsForex) return usdPrice

    const rate = fiatRates?.[fiatCurrency]
    if (!rate) return undefined

    return usdPrice * rate
  }, [ usdPrice, needsForex, fiatRates, fiatCurrency ])

  return { price, isLoading, isError }
}


export default useTokenPrice
