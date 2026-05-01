import type { EnvelopeWithX402, X402Intent, X402PaymentProof } from './types'


export const isX402Proof = (value: unknown): value is X402PaymentProof => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.paymentReceipt === 'string'
    && typeof candidate.paymentRequirementsHash === 'string'
    && typeof candidate.payee === 'string'
}

export const isX402Intent = (value: unknown): value is X402Intent => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.paymentRequirementsHash !== 'string') {
    return false
  }
  // An intent MUST NOT carry a payment receipt - that is the proof shape (use isX402Proof for that)
  if ('paymentReceipt' in candidate && candidate.paymentReceipt !== undefined) {
    return false
  }
  return true
}

/**
 * Read the x402 payload from an envelope, if present. Returns null when
 * `meta.x402` is missing or malformed - callers should not assume any
 * envelope carries x402 metadata.
 */
export const extractX402 = (envelope: EnvelopeWithX402): X402Intent | X402PaymentProof | null => {
  const x402 = envelope.meta?.x402
  if (isX402Proof(x402)) {
    return x402
  }
  if (isX402Intent(x402)) {
    return x402
  }
  return null
}
