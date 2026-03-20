import { useMemo } from 'react'
import { http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'


export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
export const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as const

export const defaultConfig: TxKit.Config = {
  chains: [ mainnet, sepolia ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
}

export const mainnetOnlyConfig: TxKit.Config = {
  chains: [ mainnet ],
  transports: {
    [mainnet.id]: http(),
  },
}

/** Memoized config with theme/variant from playground - prevents infinite re-renders in TxKitProvider */
export const useStoryConfig = (
  base: TxKit.Config,
  theme: TxKit.Theme,
  variant: TxKit.Variant
): TxKit.Config => {
  return useMemo(
    () => ({ ...base, theme, variant }),
    [ base, theme, variant ]
  )
}
