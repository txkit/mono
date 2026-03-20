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

    type Config = {
      chains: [Chain, ...Chain[]]
      transports: Record<number, Transport> // chainId → transport (http/ws/custom)

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

    type EmbeddedConfig = Pick<Config, 'theme' | 'variant' | 'licenseKey' | 'pollingInterval' | 'blockWatching'>

    type ResolvedConfig = {
      embedded: boolean
      chains: [Chain, ...Chain[]]
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
