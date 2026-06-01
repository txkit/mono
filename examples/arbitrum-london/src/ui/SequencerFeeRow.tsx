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
 * Live Arbitrum sequencer-fee breakdown for the outer policy-gate call:
 * the L1 calldata-posting cost, the L2 compute cost, and their total. Reads
 * NodeInterface.gasEstimateComponents via @txkit/arbitrum-adapter through the
 * wagmi public client, fetched with react-query. Pendle flow only (value=0 =
 * a clean L1 + L2 split).
 *
 * Failure modes degrade gracefully: an "estimating" hint while the RPC is in
 * flight, and a null preview (RPC unreachable or the simulated call reverts)
 * renders nothing rather than blocking the envelope preview.
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
      <p className="text-sm text-[color:var(--color-muted)]">Estimating sequencer fee...</p>
    )
  }

  if (preview === null || preview === undefined) {
    return null
  }

  const { l1FeeWei, l2FeeWei, totalFeeWei } = preview

  return (
    <div className="space-y-2">
      <p className="text-sm text-[color:var(--color-muted)]">Estimated sequencer fee</p>
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card-sunken)] p-4 space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">L1 calldata</span>
          <span className="font-mono">{formatFeeGwei(l1FeeWei)}</span>
        </div>
        <div className="h-px bg-[color:var(--color-border)]" />
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-muted)]">L2 compute</span>
          <span className="font-mono">{formatFeeGwei(l2FeeWei)}</span>
        </div>
        <div className="h-px bg-[color:var(--color-border)]" />
        <div className="flex justify-between gap-3">
          <span className="text-[color:var(--color-foreground)]">Total</span>
          <span className="font-mono">{formatFeeGwei(totalFeeWei)}</span>
        </div>
      </div>
    </div>
  )
}
