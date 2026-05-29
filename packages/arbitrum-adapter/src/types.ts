/**
 * Arbitrum-specific extension shapes for PreparedTransaction Envelope.
 *
 * The envelope reserves a `meta` slot; this package puts a typed shape on
 * `meta.arbitrum`, with `bridge`, `retryable`, and `sequencerFee` sub-keys.
 * Consumers should not assume any envelope carries these fields - they are
 * additive metadata, never authoritative on their own.
 *
 * References:
 * - Arbitrum chain IDs: docs.arbitrum.io/build-decentralized-apps/reference/chain-params
 * - Retryable tickets: docs.arbitrum.io/arbos/l1-to-l2-messaging
 * - Sequencer fee model: docs.arbitrum.io/build-decentralized-apps/how-to-estimate-gas
 */
export type ArbitrumChainId =
  | 'eip155:42161'   // Arbitrum One
  | 'eip155:421614'  // Arbitrum Sepolia
  | 'eip155:42170'   // Arbitrum Nova

/**
 * Bridge provider for L1->L2 transfers. Closed enum for v0.1 covers the
 * production-traffic majority; the trailing `string` keeps the door open
 * for vendor-specific bridges (e.g. an exchange's own Arbitrum gateway)
 * without forcing a spec bump.
 */
export type L1ToL2BridgeProvider =
  | 'canonical'  // Arbitrum native Delayed Inbox / Outbox
  | 'hop'        // Hop Protocol
  | 'across'     // Across Protocol
  | 'stargate'   // LayerZero Stargate
  | (string & {})

/**
 * Producer-attested intent for an L1->L2 bridge. The envelope is the L1
 * deposit / lock transaction; this intent describes the L2-side outcome
 * the wallet preview should surface ("you will receive 100 USDC on
 * Arbitrum One via Across").
 */
export type L1ToL2BridgeIntent = {
  provider: L1ToL2BridgeProvider
  /** Source chain (almost always Ethereum mainnet / Sepolia). CAIP-2. */
  l1ChainId: `eip155:${number}`
  /** Destination Arbitrum chain (One / Sepolia / Nova). CAIP-2. */
  l2ChainId: ArbitrumChainId
  /** Asset deposited on L1 (ERC-20 contract or 'native' for ETH). */
  tokenIn: `0x${string}` | 'native'
  /** Asset expected on L2. Omit when same as tokenIn (canonical 1:1 wrap). */
  tokenOut?: `0x${string}` | 'native'
  /** Amount in smallest L1 units (hex quantity). */
  amount: `0x${string}`
  /** Optional override L2 recipient. Defaults to msg.sender on L1. */
  recipient?: `0x${string}`
  /** Optional producer estimate of total L1+L2 fee cost (informational). */
  estimatedFeeWei?: `0x${string}`
  /** Optional time bound after which the intent is stale (Unix seconds). */
  expiresAt?: number
}

/**
 * UX hints for an Arbitrum retryable ticket (the L1->L2 message-passing
 * primitive). Wallet previews can surface these so the user understands
 * the gas budget reserved for the L2 leg and where any refund will land.
 *
 * Underlying contract: Arbitrum Inbox.createRetryableTicket /
 * unsafeCreateRetryableTicket on L1.
 */
export type RetryableTicketHints = {
  /** Gas limit reserved for the L2 leg of the retryable. */
  l2Gas: `0x${string}`
  /** Max L2 gas price the producer is willing to pay. */
  l2GasPriceBid: `0x${string}`
  /** Max submission cost (covers the retryable-ticket creation overhead). */
  maxSubmissionCost: `0x${string}`
  /** Address that receives the callvalue if the retryable is canceled or fails. */
  callValueRefundAddress?: `0x${string}`
  /** Address that receives excess L1 fees after submission. */
  excessFeeRefundAddress?: `0x${string}`
}

/**
 * Sequencer-fee breakdown shown to the user before signing. Arbitrum
 * charges L2 transactions for both L2 compute (gasUsed * l2BaseFee) and
 * the L1 calldata cost (encoded calldata bytes posted to Ethereum, or
 * compressed via Brotli on Arbitrum Nova's data-availability committee).
 *
 * For Nova specifically, `isCompressed: true` reflects the AnyTrust DAC
 * compression saving - the on-chain L1 calldata cost is typically <5%
 * of the equivalent Arbitrum One number.
 */
export type SequencerFeePreview = {
  /** L2 gas estimate (compute portion). */
  l2GasEstimate: `0x${string}`
  /** Bytes of L1 calldata the sequencer will post (post-compression on Nova). */
  l1CalldataBytes: number
  /** L1 base fee at preview time. */
  l1BaseFeeWei: `0x${string}`
  /** Estimated L1 calldata cost in wei. */
  l1FeeWei: `0x${string}`
  /** Estimated L2 compute cost in wei. */
  l2FeeWei: `0x${string}`
  /** Total estimated fee in wei (l1FeeWei + l2FeeWei). */
  totalFeeWei: `0x${string}`
  /** True when the chain compresses calldata before posting (Nova / AnyTrust). */
  isCompressed: boolean
  /** Block at which the preview was computed. */
  previewBlock?: number
}

/**
 * Arbitrum-specific calldata decode result. Returned by `decodeArbitrumCall`
 * for known selectors; `null` for everything else. Skeleton; alpha.1 will
 * expand the registry and add per-protocol structured fields.
 */
export type ArbitrumDecodedCall =
  | { kind: 'bridge-deposit'; provider: L1ToL2BridgeProvider; contractLabel: string }
  | { kind: 'retryable-create'; contractLabel: string }
  | { kind: 'arbsys'; method: string }
  | { kind: 'unknown'; contractLabel?: string }

/**
 * Aggregate shape of the `meta.arbitrum` slot. All three sub-keys are
 * independently optional; producers attach what they have.
 */
export type ArbitrumMeta = {
  bridge?: L1ToL2BridgeIntent
  retryable?: RetryableTicketHints
  sequencerFee?: SequencerFeePreview
}

export type EnvelopeWithArbitrum = {
  meta?: {
    arbitrum?: ArbitrumMeta
    [key: string]: unknown
  }
  [key: string]: unknown
}
