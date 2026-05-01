/**
 * x402 payment proof - the receipt an HTTP client receives after paying
 * for a 402 Payment Required response. Stable subset of the x402 v0.x spec
 * sufficient to attach to a PreparedEnvelope `meta.x402` slot.
 *
 * Reference: https://www.x402.org and the Linux Foundation x402 working
 * group (formerly Coinbase x402, transferred 2 Apr 2026).
 */
export type X402PaymentProof = {
  /** Spec version. */
  version: '0.1' | string
  /** The 402 challenge that was paid (server-issued nonce). */
  paymentRequirementsHash: `0x${string}`
  /** Tx hash or signature receipt provided by the agent. */
  paymentReceipt: `0x${string}`
  /** Network on which the payment settled. CAIP-2 chain id, e.g. eip155:8453. */
  chain: `eip155:${number}`
  /** Asset paid in (ERC-20 contract or 'native'). */
  asset: `0x${string}` | 'native'
  /** Amount in smallest units (hex quantity). */
  amount: `0x${string}`
  /** Recipient (resource server). */
  payee: `0x${string}`
  /** When the payment was settled (unix seconds). */
  paidAt: number
  /** Optional human-readable resource path that the payment unlocks. */
  resource?: string
}

/**
 * Inverse direction: an envelope produced by an agent who *intends* to
 * pay an x402 challenge with the underlying transaction. The wallet /
 * preview UI should show "this signs the payment for resource X".
 */
export type X402Intent = {
  paymentRequirementsHash: `0x${string}`
  resource?: string
  expiresAt?: number
}

export type EnvelopeWithX402 = {
  meta?: {
    x402?: X402Intent | X402PaymentProof
    [key: string]: unknown
  }
  [key: string]: unknown
}
