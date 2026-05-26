import { arbitrumSepolia as viemArbitrumSepolia } from 'viem/chains'


/**
 * Arbitrum Sepolia testnet (chainId 421614) - canonical for txKit Buildathon
 * Scenario A: Pendle yield swap demo. Uses viem's built-in chain config so
 * RPC fallback and explorer URLs match the Arbitrum-published defaults.
 */
export const arbitrumSepolia = viemArbitrumSepolia

export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614 as const
