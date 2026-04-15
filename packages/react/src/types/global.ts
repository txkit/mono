import type { Chain, Transport } from 'viem'
import type { CreateConnectorFn } from 'wagmi'


declare global {

  namespace TxKit {

    type Theme = 'light' | 'dark' | 'auto'

    /** Visual variant preset for component styling */
    type Variant = 'default' | 'soft' | 'sharp' | 'rounded'

    type ThemeOutput = {
      theme: 'light' | 'dark'           // resolved, never 'auto'
      setTheme: (value: Theme) => void
    }

    type WalletConfig = {
      id: string
      name: string
      icon?: string
      createConnector: CreateConnectorFn
    }

    type ConfigBase = {
      // Wallets
      wallets?: WalletConfig[]           // default: injected + walletConnect + coinbase
      walletConnectProjectId?: string    // WC v2, required for WalletConnect

      // Theme
      theme?: Theme // default: 'auto' (system preference)
      variant?: Variant // default: 'default'

      // Behavior
      autoConnect?: boolean              // default: true, reconnect on reload
      pollingInterval?: number           // default: 4000ms

      /** Block-based balance invalidation config */
      blockWatching?: {
        /** Enable block-based balance refresh. @default true */
        enabled?: boolean
        /** Min interval between invalidations in ms. @default pollingInterval */
        throttleMs?: number
      }

      // Pro
      licenseKey?: string                // enables pro components
    }

    /** Zero-config testnet preset - uses Sepolia + public RPC, mainnet added for ENS lookups. */
    type ConfigTestnet = ConfigBase & {
      /** Enable testnet preset (Sepolia). When true, chains + transports are optional and filled from defaults. */
      testnet: true
      chains?: [Chain, ...Chain[]]
      transports?: Record<number, Transport>
    }

    /** Custom config - user provides chains + transports. */
    type ConfigCustom = ConfigBase & {
      testnet?: false
      chains: [Chain, ...Chain[]]
      transports: Record<number, Transport> // chainId → transport (http/ws/custom)
    }

    type Config = ConfigTestnet | ConfigCustom

    type EmbeddedConfig = Pick<ConfigBase, 'theme' | 'variant' | 'licenseKey' | 'pollingInterval' | 'blockWatching'>

    type ResolvedConfig = {
      testnet: boolean
      embedded: boolean
      /** All chains registered with wagmi (includes mainnet in testnet mode for ENS). */
      chains: [Chain, ...Chain[]]
      /** Chains shown in UI (chain selector, wrong-chain checks) - mainnet filtered out in testnet mode. */
      displayChains: [Chain, ...Chain[]]
      transports: Record<number, Transport>
      walletConnectProjectId: string | null
      wallets: WalletConfig[]
      autoConnect: boolean
      pollingInterval: number
      blockWatching: { enabled: boolean; throttleMs: number }
      licenseKey: string | null
    }

    type Context = ThemeOutput & {
      config: ResolvedConfig
      isProEnabled: boolean
    }
  }
}
