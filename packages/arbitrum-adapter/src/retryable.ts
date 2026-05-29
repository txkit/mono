import type { PreparedEnvelope } from '@txkit/tx-protocol'

import type { EnvelopeWithArbitrum, RetryableTicketHints } from './types'


/**
 * Attach retryable-ticket UX hints to a PreparedEnvelope's
 * `meta.arbitrum.retryable` slot. Pure - returns a new envelope, does
 * not mutate. Existing meta and other arbitrum sub-keys are preserved.
 *
 * Used when the underlying L1 transaction calls
 * Inbox.createRetryableTicket and the wallet should surface the L2
 * gas budget plus refund destinations.
 */
export const attachRetryableHints = <E extends PreparedEnvelope>(envelope: E, hints: RetryableTicketHints): E & EnvelopeWithArbitrum => {
  const meta = ((envelope as unknown as EnvelopeWithArbitrum).meta ?? {})

  return {
    ...envelope,
    meta: {
      ...meta,
      arbitrum: {
        ...(meta.arbitrum ?? {}),
        retryable: hints,
      },
    },
  } as E & EnvelopeWithArbitrum
}

export const isRetryableHints = (value: unknown): value is RetryableTicketHints => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.l2Gas === 'string'
    && typeof candidate.l2GasPriceBid === 'string'
    && typeof candidate.maxSubmissionCost === 'string'
}

export const extractRetryableHints = (envelope: EnvelopeWithArbitrum): RetryableTicketHints | null => {
  const hints = envelope.meta?.arbitrum?.retryable
  return isRetryableHints(hints) ? hints : null
}
