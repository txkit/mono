import type { PreparedEnvelope } from '@txkit/tx-protocol'

import type { EnvelopeWithX402, X402Intent, X402PaymentProof } from './types'


/**
 * Attach an x402 payment intent or proof to a PreparedEnvelope's
 * `meta.x402` slot. Pure - returns a new envelope, does not mutate.
 *
 * Use `attachX402Intent` when an agent is *about to* pay (envelope shows
 * the wallet what the signature unlocks). Use `attachX402Proof` when the
 * payment has already settled and the envelope captures the receipt for
 * downstream consumers.
 */
export const attachX402Intent = <E extends PreparedEnvelope>(envelope: E, intent: X402Intent): E & EnvelopeWithX402 => {
  return {
    ...envelope,
    meta: {
      ...((envelope as unknown as EnvelopeWithX402).meta ?? {}),
      x402: intent,
    },
  } as E & EnvelopeWithX402
}

export const attachX402Proof = <E extends PreparedEnvelope>(envelope: E, proof: X402PaymentProof): E & EnvelopeWithX402 => {
  return {
    ...envelope,
    meta: {
      ...((envelope as unknown as EnvelopeWithX402).meta ?? {}),
      x402: proof,
    },
  } as E & EnvelopeWithX402
}
