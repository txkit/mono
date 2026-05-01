import type { EvmBatchEnvelope, EvmTxEnvelope } from '@txkit/tx-protocol'

import type { OwsSignAndSendResult } from './types'


/**
 * Merge an OWS sign-and-send result back into the originating envelope's
 * `meta` slot under `meta.owsResult`. Pure - returns a new envelope.
 *
 * Use this when downstream consumers need to trace a broadcast tx hash
 * back to the PreparedEnvelope that produced it (audit log, event feed).
 */
export const annotateWithOwsResult = <E extends EvmTxEnvelope | EvmBatchEnvelope>(
  envelope: E,
  result: OwsSignAndSendResult,
): E => {
  return {
    ...envelope,
    meta: {
      ...(envelope.meta ?? {}),
      owsResult: result,
    },
  }
}
