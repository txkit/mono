import { useMemo } from 'react'
import { http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'


export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
export const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as const

// WalletConnect Cloud projectId loaded from VITE_WALLETCONNECT_PROJECT_ID env var.
// Create app/story/.env with: VITE_WALLETCONNECT_PROJECT_ID=your_project_id
// https://cloud.walletconnect.com - free tier
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

export const defaultConfig: TxKit.Config = {
  chains: [ mainnet, sepolia ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
}

export const mainnetOnlyConfig: TxKit.Config = {
  chains: [ mainnet ],
  transports: {
    [mainnet.id]: http(),
  },
}

/** Memoized config with theme/variant. Stories pass a fixed theme (not playground theme)
 *  to avoid wagmi useSyncExternalStore infinite loops on dynamic theme switch.
 *  Playground theme toggle is handled via CSS class override instead. */
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
