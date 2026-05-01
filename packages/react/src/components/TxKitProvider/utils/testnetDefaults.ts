import { fallback, http } from 'viem'
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
 * CORS-enabled public RPCs for browser use.
 *
 * viem's default RPC for mainnet (eth.merkle.io) and sepolia (thirdweb) don't
 * reliably allow browser CORS, so we pin CORS-friendly providers with a fallback
 * chain for resilience. Fine for alpha / playground - production apps should
 * supply their own chains + transports.
 *
 * Sources (CORS-enabled as of 2026-04):
 * - PublicNode (free, no key): https://www.publicnode.com
 * - Cloudflare (free, no key): https://developers.cloudflare.com/web3/
 * - LlamaRPC (free, no key): https://llamarpc.com
 * - ethpandaops Sepolia (community run)
 */
const MAINNET_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://cloudflare-eth.com',
  'https://eth.llamarpc.com',
]

const SEPOLIA_RPCS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
]

export const TESTNET_TRANSPORTS: Record<number, Transport> = {
  [sepolia.id]: fallback(SEPOLIA_RPCS.map((url) => http(url))),
  [mainnet.id]: fallback(MAINNET_RPCS.map((url) => http(url))),
}
