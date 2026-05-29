import type { PreparedEnvelope } from '@txkit/tx-protocol'

import type { ArbitrumChainId, EnvelopeWithArbitrum, SequencerFeePreview } from './types'


/**
 * AnyTrust data-availability committee on Arbitrum Nova compresses
 * posted calldata with Brotli before publishing the digest to L1, which
 * is why Nova's L1 calldata cost component is typically a small fraction
 * of Arbitrum One's. This constant is informational and surfaced by
 * `previewSequencerFee` via the `isCompressed` flag.
 */
export const NOVA_USES_COMPRESSED_CALLDATA = true

const isNova = (chainId: ArbitrumChainId): boolean => chainId === 'eip155:42170'

/**
 * Attach a sequencer-fee preview to a PreparedEnvelope's
 * `meta.arbitrum.sequencerFee` slot. Pure - returns a new envelope.
 * Existing meta and other arbitrum sub-keys are preserved.
 */
export const attachSequencerFeePreview = <E extends PreparedEnvelope>(envelope: E, preview: SequencerFeePreview): E & EnvelopeWithArbitrum => {
  const meta = ((envelope as unknown as EnvelopeWithArbitrum).meta ?? {})

  return {
    ...envelope,
    meta: {
      ...meta,
      arbitrum: {
        ...(meta.arbitrum ?? {}),
        sequencerFee: preview,
      },
    },
  } as E & EnvelopeWithArbitrum
}

export const isSequencerFeePreview = (value: unknown): value is SequencerFeePreview => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.l2GasEstimate === 'string'
    && typeof candidate.l1FeeWei === 'string'
    && typeof candidate.l2FeeWei === 'string'
    && typeof candidate.totalFeeWei === 'string'
    && typeof candidate.l1CalldataBytes === 'number'
    && typeof candidate.isCompressed === 'boolean'
}

export const extractSequencerFeePreview = (envelope: EnvelopeWithArbitrum): SequencerFeePreview | null => {
  const preview = envelope.meta?.arbitrum?.sequencerFee
  return isSequencerFeePreview(preview) ? preview : null
}

/**
 * Compute a sequencer-fee preview for a calldata payload on the given
 * Arbitrum chain. Skeleton stub - returns `null` until alpha.1, when the
 * estimation will use viem's `arbGasInfo.getPricesInWei` precompile read
 * plus `NodeInterface.gasEstimateL1Component`.
 *
 * Reference contract addresses (precompiles, identical across Arbitrum
 * One / Sepolia / Nova):
 * - ArbSys           0x0000000000000000000000000000000000000064
 * - ArbGasInfo       0x000000000000000000000000000000000000006C
 * - NodeInterface    0x00000000000000000000000000000000000000C8
 */
export const previewSequencerFee = (_args: {
  chain: ArbitrumChainId,
  calldata: `0x${string}`,
  l1BaseFeeWei?: `0x${string}`,
}): SequencerFeePreview | null => {
  // Skeleton: surface the chain compression flag so callers can still
  // render the Nova vs One distinction even before live estimation lands.
  const { chain } = _args
  void chain
  void isNova
  return null
}
