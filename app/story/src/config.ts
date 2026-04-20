import { useMemo } from 'react'
import { fallback, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'


export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
export const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as const

// WalletConnect Cloud projectId loaded from VITE_WALLETCONNECT_PROJECT_ID env var.
// Create app/story/.env with: VITE_WALLETCONNECT_PROJECT_ID=your_project_id
// https://cloud.walletconnect.com - free tier
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

// CORS-enabled public RPCs with fallback for reliability.
// viem's default (eth.merkle.io) is heavily rate-limited (429).
const mainnetTransport = fallback([
  http('https://ethereum-rpc.publicnode.com'),
  http('https://cloudflare-eth.com'),
  http('https://eth.llamarpc.com'),
])

const sepoliaTransport = fallback([
  http('https://ethereum-sepolia-rpc.publicnode.com'),
  http('https://rpc.sepolia.org'),
])

export const defaultConfig: TxKit.Config = {
  chains: [ mainnet, sepolia ],
  transports: {
    [mainnet.id]: mainnetTransport,
    [sepolia.id]: sepoliaTransport,
  },
  walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
}

export const mainnetOnlyConfig: TxKit.Config = {
  chains: [ mainnet ],
  transports: {
    [mainnet.id]: mainnetTransport,
  },
}

/** Memoized config with optional theme. Variant is applied via CSS classes
 *  (PlaygroundThemeSync), NOT through config - to avoid wagmi
 *  useSyncExternalStore infinite loops on toolbar changes. */
export const useStoryConfig = (
  base: TxKit.Config,
  theme: TxKit.Theme | undefined
): TxKit.Config => {
  return useMemo(
    () => {
      if (theme === undefined) {
        return base
      }
      return { ...base, theme }
    },
    [ base, theme ]
  )
}
