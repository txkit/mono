import type { RegistryDescriptor } from '../types'


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
 * Built-in starter registry. Empty in v0.1 - real entries land as JSON files
 * under `src/registry/data/` and are imported here.
 *
 * Roadmap: ERC-7730 manifests for top-50 protocols by tx volume:
 * Uniswap v2/v3/v4, Aave v3, Compound III, Lido, EigenLayer, Permit2,
 * 1inch v6, Across v3, Wormhole, Safe MultiSig, Chainlink CCIP, etc.
 */
export const BUILTIN_REGISTRY: Registry = buildRegistry([])
