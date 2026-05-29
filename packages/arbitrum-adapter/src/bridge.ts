import type { PreparedEnvelope } from '@txkit/tx-protocol'

import type { EnvelopeWithArbitrum, L1ToL2BridgeIntent } from './types'


/**
 * Attach an L1->L2 bridge intent to a PreparedEnvelope's
 * `meta.arbitrum.bridge` slot. Pure - returns a new envelope, does not
 * mutate. Existing meta and other arbitrum sub-keys are preserved.
 *
 * Use when the envelope is the L1 deposit / lock transaction and the
 * producer wants the wallet preview to show the L2-side outcome
 * ("you will receive X on Arbitrum One via Y").
 */
export const attachBridgeIntent = <E extends PreparedEnvelope>(envelope: E, intent: L1ToL2BridgeIntent): E & EnvelopeWithArbitrum => {
  const meta = ((envelope as unknown as EnvelopeWithArbitrum).meta ?? {})

  return {
    ...envelope,
    meta: {
      ...meta,
      arbitrum: {
        ...(meta.arbitrum ?? {}),
        bridge: intent,
      },
    },
  } as E & EnvelopeWithArbitrum
}

export const isBridgeIntent = (value: unknown): value is L1ToL2BridgeIntent => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.provider === 'string'
    && typeof candidate.l1ChainId === 'string'
    && typeof candidate.l2ChainId === 'string'
    && typeof candidate.tokenIn === 'string'
    && typeof candidate.amount === 'string'
}

/**
 * Read the L1->L2 bridge intent from an envelope, if present. Returns
 * null when `meta.arbitrum.bridge` is missing or malformed.
 */
export const extractBridgeIntent = (envelope: EnvelopeWithArbitrum): L1ToL2BridgeIntent | null => {
  const intent = envelope.meta?.arbitrum?.bridge
  return isBridgeIntent(intent) ? intent : null
}
