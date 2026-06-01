'use client'

import { previewSequencerFee, type ArbitrumChainId } from '@txkit/arbitrum-adapter'
import { useQuery } from '@tanstack/react-query'
import { formatGwei } from 'viem'
import { usePublicClient } from 'wagmi'

import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'


type SequencerFeeRowProps = {
  chain: ArbitrumChainId,
  to: `0x${string}`,
  calldata: `0x${string}`,
}

const formatFeeGwei = (weiHex: `0x${string}`): string => {
  const gwei = formatGwei(BigInt(weiHex))

  return `${gwei} gwei`
}

/**
 * Live Arbitrum sequencer-fee breakdown for the outer policy-gate call.
 * Reads NodeInterface.gasEstimateComponents via @txkit/arbitrum-adapter
 * through the wagmi public client, fetched with react-query. Only used by
 * the Pendle flow (value=0 = a clean L1 calldata + L2 compute split).
 *
 * Failure modes degrade silently: while the RPC is in flight we show an
 * "estimating" hint, and a null preview (RPC unreachable or the simulated
 * call reverts) renders nothing rather than blocking the envelope preview.
 */
export const SequencerFeeRow = (props: SequencerFeeRowProps) => {
  const { chain, to, calldata } = props
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID })

  const { data: preview, isLoading } = useQuery({
    queryKey: [ 'sequencerFee', chain, to, calldata ],
    queryFn: async () => {
      if (publicClient === undefined) {
        return null
      }

      return previewSequencerFee(publicClient, { chain, to, calldata })
    },
    enabled: publicClient !== undefined,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-between gap-3">
        <span className="text-[color:var(--color-muted)]">Sequencer fee</span>
        <span className="font-mono text-[color:var(--color-muted)]">estimating...</span>
      </div>
    )
  }

  if (preview === null || preview === undefined) {
    return null
  }

  const { l1FeeWei, l2FeeWei } = preview

  return (
    <div className="flex justify-between gap-3">
      <span className="text-[color:var(--color-muted)]">Sequencer fee</span>
      <span className="font-mono text-right">
        L1 calldata {formatFeeGwei(l1FeeWei)} · L2 compute {formatFeeGwei(l2FeeWei)}
      </span>
    </div>
  )
}
