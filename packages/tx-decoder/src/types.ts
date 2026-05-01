import type { Abi } from 'viem'

import type { EvmCall } from '@txkit/tx-protocol'


/**
 * Local mirror of the inline `clearSigning` shape from `@txkit/tx-protocol`.
 * Kept loosely-typed (Record<string, unknown>) until ERC-7730 finalizes
 * the canonical schema.
 */
export type ClearSigning = Record<string, unknown>


/**
 * Output of decoding a single EvmCall.
 * Maps to the ERC-7730 clearSigning tree nested under PreparedEnvelope.
 */
export type DecodedCall = {
  /** Function selector (first 4 bytes of calldata) or null for plain ETH transfer. */
  selector: `0x${string}` | null
  /** Resolved function name from ABI / registry, or null if unknown. */
  functionName: string | null
  /** Decoded arguments matched against ABI input types. */
  args: ReadonlyArray<DecodedArg>
  /** ERC-7730-style clear-signing structure for UI rendering. */
  clearSigning?: ClearSigning
  /** Source of the decoded ABI: 'registry' | 'abi-prop' | 'fourbyte' | 'unknown'. */
  source: DecoderSource
}

export type DecodedArg = {
  name: string | null
  type: string
  value: unknown
}

export type DecoderSource = 'registry' | 'abi-prop' | 'fourbyte' | 'unknown'

/**
 * A registry descriptor matches a (chain, contract) pair to an ABI plus
 * optional ERC-7730 clear-signing metadata.
 *
 * Loaded from JSON files at build time or fetched lazily at runtime.
 */
export type RegistryDescriptor = {
  chain: `eip155:${number}`
  address: `0x${string}`
  /** Contract / protocol display name. */
  label?: string
  /** ABI used for argument decoding. */
  abi: Abi
  /** Optional ERC-7730 clear-signing rules per function. */
  clearSigning?: Record<string, ClearSigning>
}

/**
 * Options for the decoder. Pass any combination of inline ABI, a registry,
 * and a 4byte fallback resolver. Higher-priority sources are checked first.
 */
export type DecodeCallOptions = {
  /** Inline ABI taking precedence over the registry. */
  abi?: Abi
  /** In-memory registry, indexed by lowercased `${chain}:${address}`. */
  registry?: Readonly<Record<string, RegistryDescriptor>>
  /** Optional async resolver for unknown selectors (e.g. 4byte directory). */
  fourByte?: (selector: `0x${string}`) => Promise<{ name: string; signature: string } | null>
}

/**
 * Input shape for the decoder - a single EvmCall plus the chain it executes on.
 */
export type DecodeCallInput = {
  call: EvmCall
  chain: `eip155:${number}`
}

