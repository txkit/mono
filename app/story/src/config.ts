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

/** Memoized config with variant + optional theme. Live stories omit theme so that
 *  PlaygroundThemeSync is the single source of truth; stories that demo a specific
 *  theme (Dark/Light examples) pass it explicitly. Keeping deps stable avoids wagmi
 *  useSyncExternalStore infinite loops on dynamic theme switch. */
export const useStoryConfig = (
  base: TxKit.Config,
  theme: TxKit.Theme | undefined,
  variant: TxKit.Variant
): TxKit.Config => {
  return useMemo(
    () => {
      const next: TxKit.Config = { ...base, variant }
      if (theme !== undefined) {
        next.theme = theme
      }
      return next
    },
    [ base, theme, variant ]
  )
}
