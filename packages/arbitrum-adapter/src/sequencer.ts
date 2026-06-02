import { toHex, type PublicClient } from 'viem'

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

const checkIsNova = (chainId: ArbitrumChainId): boolean => chainId === 'eip155:42170'

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
 * NodeInterface is a virtual precompile (0xC8) the Arbitrum node resolves
 * via eth_call - it is not actually deployed. `gasEstimateComponents`
 * simulates the (to, data) call and splits the estimate into the L2
 * compute portion plus the L1 calldata-posting component.
 *
 * The canonical method is `payable`, but we own this ABI and mark it
 * `view` so viem's `readContract` accepts it; eth_call ignores the
 * declared mutability. Verified live against Arbitrum One mainnet.
 */
const NODE_INTERFACE_ADDRESS = '0x00000000000000000000000000000000000000C8' as const

const NODE_INTERFACE_GAS_ESTIMATE_COMPONENTS_ABI = [
  {
    type: 'function',
    name: 'gasEstimateComponents',
    stateMutability: 'view',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'contractCreation', type: 'bool' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [
      { name: 'gasEstimate', type: 'uint64' },
      { name: 'gasEstimateForL1', type: 'uint64' },
      { name: 'baseFee', type: 'uint256' },
      { name: 'l1BaseFeeEstimate', type: 'uint256' },
    ],
  },
] as const

/**
 * Compute a live sequencer-fee preview for a calldata payload on the given
 * Arbitrum chain. Reads NodeInterface.gasEstimateComponents (precompile
 * 0xC8) through the supplied viem client, which simulates the `to` + `data`
 * call and splits the cost into the L2 compute portion and the L1
 * calldata-posting portion. Both portions are priced at the L2 base fee
 * returned by the same call - the L1 component is expressed in L2 gas units,
 * so `l1FeeWei = gasEstimateForL1 * baseFee`.
 *
 * Returns `null` on any failure - RPC unreachable, the simulated call
 * reverts, or malformed calldata. The preview is advisory wallet UX and
 * must never block signing, so failures degrade to `null` rather than throw.
 *
 * Reference contract addresses (precompiles, identical across Arbitrum
 * One / Sepolia / Nova):
 * - ArbSys           0x0000000000000000000000000000000000000064
 * - ArbGasInfo       0x000000000000000000000000000000000000006C
 * - NodeInterface    0x00000000000000000000000000000000000000C8
 */
export const previewSequencerFee = async (
  client: PublicClient,
  args: {
    chain: ArbitrumChainId,
    to: `0x${string}`,
    calldata: `0x${string}`,
    from?: `0x${string}`,
    l1BaseFeeWei?: `0x${string}`,
  },
): Promise<SequencerFeePreview | null> => {
  const { chain, to, calldata, from, l1BaseFeeWei } = args

  try {
    const [ gasEstimate, gasEstimateForL1, baseFee, l1BaseFeeEstimate ] = await client.readContract({
      address: NODE_INTERFACE_ADDRESS,
      abi: NODE_INTERFACE_GAS_ESTIMATE_COMPONENTS_ABI,
      functionName: 'gasEstimateComponents',
      args: [ to, false, calldata ],
      account: from,
    })

    const blockNumber = await client.getBlockNumber()
    const l2GasUnits = gasEstimate - gasEstimateForL1
    const l1BaseFeeWeiValue = l1BaseFeeWei ? BigInt(l1BaseFeeWei) : l1BaseFeeEstimate
    const calldataByteCount = (calldata.length - 2) / 2

    return {
      l2GasEstimate: toHex(l2GasUnits),
      l1CalldataBytes: calldataByteCount,
      l1BaseFeeWei: toHex(l1BaseFeeWeiValue),
      l1FeeWei: toHex(gasEstimateForL1 * baseFee),
      l2FeeWei: toHex(l2GasUnits * baseFee),
      totalFeeWei: toHex(gasEstimate * baseFee),
      isCompressed: checkIsNova(chain),
      previewBlock: Number(blockNumber),
    }
  } catch {
    return null
  }
}
