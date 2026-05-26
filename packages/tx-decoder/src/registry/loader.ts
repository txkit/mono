import type { RegistryDescriptor } from '../types'

import erc20Data from './data/erc20.json'
import permit2Data from './data/permit2.json'


/**
 * Read-only registry of decoder descriptors keyed by `${chain}:${address}`
 * (lowercased). Plain Record per the project rule "no `new Map` for lookup
 * caches": registries are static, loaded once at startup, and only read.
 */
export type Registry = Readonly<Record<string, RegistryDescriptor>>

export const registryKey = (chain: `eip155:${number}`, address: `0x${string}`): string => {
  return `${chain.toLowerCase()}:${address.toLowerCase()}`
}

/** Build an in-memory registry from an array of descriptors. */
export const buildRegistry = (descriptors: ReadonlyArray<RegistryDescriptor>): Registry => {
  const store: Record<string, RegistryDescriptor> = {}
  for (const descriptor of descriptors) {
    store[registryKey(descriptor.chain, descriptor.address)] = descriptor
  }
  return store
}

/**
 * Built-in starter registry. Real entries land as JSON files under
 * `src/registry/data/` and are imported into this barrel.
 *
 * Coverage as of v0.1.0-alpha.4:
 *  - ERC-20 standard: USDC, WETH, USDT (mainnet)
 *  - Permit2: mainnet + Arbitrum + Base + Optimism + Polygon
 *
 * Roadmap: ERC-7730 manifests for top-50 protocols by tx volume:
 * Uniswap v2/v3/v4, Aave v3, Compound III, Lido, EigenLayer,
 * 1inch v6, Across v3, Wormhole, Safe MultiSig, Chainlink CCIP, etc.
 */
// JSON imports lose their template-literal types (`eip155:${number}`, `0x${string}`)
// once parsed - cast through unknown is the idiomatic escape hatch. We accept the
// loss of compile-time chain/address validation here because the data files are
// hand-curated and reviewed in PR; a future runtime validator (Zod) can re-tighten.
const allDescriptors: ReadonlyArray<RegistryDescriptor> = [
  ...(erc20Data as unknown as ReadonlyArray<RegistryDescriptor>),
  ...(permit2Data as unknown as ReadonlyArray<RegistryDescriptor>),
]

export const BUILTIN_REGISTRY: Registry = buildRegistry(allDescriptors)
