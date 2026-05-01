import type { CounterpartyLabelSource, CounterpartyRole, TokenMovementKind, TokenStandard } from '@txkit/tx-protocol'


/**
 * Subset of the OWS spec sufficient for adapter implementation. Full spec:
 * https://github.com/open-wallet-standard/core
 *
 * Mirrors the shape of `signAndSend` payloads. We avoid taking a runtime
 * dependency on `@open-wallet-standard/core` until the spec stabilizes
 * (currently v1.3.2). The mirror is intentionally minimal - upgrade as
 * the spec adds fields.
 */
export type OwsTransaction = {
  /** Raw transaction bytes (RLP-encoded for EVM). */
  rawHex: `0x${string}`
  /** Optional content fields - currently always populated as None on v1.3.2 (issue #153). */
  to?: `0x${string}`
  value?: `0x${string}`
  data?: `0x${string}`
}

export type OwsSimulationResult = {
  /** Decoded function call display name, e.g. "transfer(address,uint256)". */
  functionName?: string
  /** Counterparties involved in the transaction (recipient, contract, spender). */
  counterparties?: ReadonlyArray<{
    role: CounterpartyRole
    address: `0x${string}`
    label?: string
    labelSource?: CounterpartyLabelSource
  }>
  /** Token movements (transfers, approvals). */
  tokenMovements?: ReadonlyArray<{
    kind: TokenMovementKind
    token: `0x${string}` | 'native'
    from: `0x${string}`
    to: `0x${string}`
    amount: string
    isUnlimited?: boolean
    standard?: TokenStandard
    tokenId?: string
  }>
  /** Risk hints for policy engines. */
  risk?: {
    action?: 'allow' | 'warn' | 'block'
    reasons?: ReadonlyArray<string>
  }
  /** Time-bound validity (Unix seconds). */
  validity?: {
    notAfter: number
  }
}

export type OwsSignAndSendPayload = {
  /** Chain identifier - CAIP-2 form, e.g. "eip155:1". */
  chain: `${string}:${string}`
  /** Transaction(s) to sign and broadcast. Multi-call uses OWS atomic batch shape. */
  transaction: OwsTransaction | ReadonlyArray<OwsTransaction>
  /** Whether the batch must be atomic (all or nothing). */
  atomicRequired?: boolean
  /** Pre-computed simulation result for the policy engine. */
  simulation?: OwsSimulationResult
  /** Free-form metadata; producers may attach extra hints. */
  meta?: Record<string, unknown>
}

/**
 * The result OWS returns after signAndSend. Captured by `annotateWithOwsResult`
 * so downstream consumers can correlate the broadcast tx hash back to the
 * original PreparedEnvelope.
 */
export type OwsSignAndSendResult = {
  txHash: `0x${string}`
  chain: `${string}:${string}`
  /** Receipt-time timestamp in unix seconds. */
  signedAt?: number
}
