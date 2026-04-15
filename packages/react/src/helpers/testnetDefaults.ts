import { http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import type { Chain, Transport } from 'viem'


/**
 * Chains registered with wagmi in testnet mode.
 *
 * Sepolia is the primary target chain. Mainnet is included because ENS resolver
 * hooks (useEnsName, useEnsAvatar) pin chainId: 1 - without mainnet in the wagmi
 * config, ENS queries fail. Mainnet is hidden from UI via displayChains filter.
 */
export const TESTNET_CHAINS: [ Chain, ...Chain[] ] = [ sepolia, mainnet ]

/** Chains shown in UI (chain selector, wrong-chain banner). Excludes mainnet. */
export const TESTNET_DISPLAY_CHAINS: [ Chain, ...Chain[] ] = [ sepolia ]

/**
 * Default transports for testnet mode.
 *
 * Uses viem's built-in public RPC endpoints (no Alchemy/Infura key required).
 * Fine for alpha / playground use - rate limits apply. Production apps should
 * provide `chains` + `transports` explicitly.
 */
export const TESTNET_TRANSPORTS: Record<number, Transport> = {
  [sepolia.id]: http(),
  [mainnet.id]: http(),
}
