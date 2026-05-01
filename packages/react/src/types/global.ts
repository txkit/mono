import type { Chain, Transport } from 'viem'
import type { CreateConnectorFn } from 'wagmi'


declare global {

  namespace TxKit {

    /** Light, dark, or follow system preference. `auto` resolves to light/dark at runtime via `prefers-color-scheme`. */
    type Theme = 'light' | 'dark' | 'auto'

    /** Visual variant preset for component styling. */
    type Variant = 'default' | 'soft' | 'sharp' | 'rounded'

    /** Output of the `useTheme` hook - the runtime-resolved theme plus a setter. */
    type ThemeOutput = {
      /** Always concrete - 'auto' is resolved against the user's system preference. */
      theme: 'light' | 'dark'
      /** Set the configured theme. Pass 'auto' to follow system preference again. */
      setTheme: (value: Theme) => void
    }

    /** A wallet connector entry plus the metadata txKit needs to render it in the picker. */
    type WalletConfig = {
      /** Stable identifier used as a React key and for connector dedup. */
      id: string
      /** User-facing wallet name shown in the modal (e.g. "MetaMask"). */
      name: string
      /** Optional icon URL or data-URI. EIP-6963 wallets supply one automatically. */
      icon?: string
      /** wagmi connector factory - txKit calls this once per provider mount. */
      createConnector: CreateConnectorFn
    }

    type ConfigBase = {
      /** Override the default wallet list. @default injected + walletConnect + coinbase */
      wallets?: WalletConfig[]
      /** WalletConnect v2 project id - required only if a WC connector is present. */
      walletConnectProjectId?: string

      /** Initial theme. @default 'auto' (follows system preference) */
      theme?: Theme
      /** Visual variant preset. @default 'default' */
      variant?: Variant

      /** Reconnect to the last-used wallet on page reload. @default true */
      autoConnect?: boolean
      /** Polling interval for balance / chain queries in ms. @default 4000 */
      pollingInterval?: number

      /** Block-based balance invalidation config. */
      blockWatching?: {
        /** Enable block-based balance refresh. @default true */
        enabled?: boolean
        /** Min interval between invalidations in ms. @default pollingInterval */
        throttleMs?: number
      }

      /** Pro tier license key. Unlocks Pro components when present and valid. */
      licenseKey?: string
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
      /** All chains the dApp can interact with. The first entry is the default selection. */
      chains: [Chain, ...Chain[]]
      /** Per-chain transport (http/ws/custom). Key is `chain.id`. */
      transports: Record<number, Transport>
    }

    /** Discriminated union: testnet preset OR fully custom. */
    type Config = ConfigTestnet | ConfigCustom

    /** Subset of config accepted in embedded mode - chains/transports come from the outer wagmi provider. */
    type EmbeddedConfig = Pick<ConfigBase, 'theme' | 'variant' | 'licenseKey' | 'pollingInterval' | 'blockWatching'>

    /** What `useTxKit().config` exposes - all defaults applied, ready for downstream consumers. */
    type ResolvedConfig = {
      /** True when the testnet preset was used. */
      testnet: boolean
      /** True when txKit is mounted inside an external wagmi provider (no internal createConfig). */
      embedded: boolean
      /** All chains registered with wagmi (includes mainnet in testnet mode for ENS). */
      chains: [Chain, ...Chain[]]
      /** Chains shown in UI (chain selector, wrong-chain checks) - mainnet filtered out in testnet mode. */
      displayChains: [Chain, ...Chain[]]
      /** Per-chain transport. Empty `{}` in embedded mode (managed by outer wagmi). */
      transports: Record<number, Transport>
      /** WalletConnect v2 project id, or null if no WC connector is configured. */
      walletConnectProjectId: string | null
      /** Resolved wallet list. Empty `[]` in embedded mode (managed by outer wagmi). */
      wallets: WalletConfig[]
      /** Reconnect to the last-used wallet on page reload. */
      autoConnect: boolean
      /** Polling interval for balance / chain queries in ms. */
      pollingInterval: number
      /** Block-based balance invalidation - resolved with defaults applied. */
      blockWatching: { enabled: boolean; throttleMs: number }
      /** Pro tier license key, or null when not configured. */
      licenseKey: string | null
    }

    /** Full TxKit context - what `useTxKit()` returns. */
    type Context = ThemeOutput & {
      config: ResolvedConfig
      /** True when a valid Pro `licenseKey` was provided and is non-expired. */
      isProEnabled: boolean
    }
  }
}
