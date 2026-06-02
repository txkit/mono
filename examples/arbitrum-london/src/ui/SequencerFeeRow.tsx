'use client'

import { previewSequencerFee, type ArbitrumChainId } from '@txkit/arbitrum-adapter'
import { useQuery } from '@tanstack/react-query'
import { createPublicClient, formatGwei, http } from 'viem'

import { arbitrumSepolia } from '@/src/chains'


type SequencerFeeRowProps = {
  chain: ArbitrumChainId,
  to: `0x${string}`,
  calldata: `0x${string}`,
}

/**
 * Dedicated, un-batched client for the NodeInterface precompile read.
 *
 * The Arbitrum NodeInterface (0xC8) is a virtual precompile resolved by the
 * node only on a DIRECT eth_call. wagmi's shared public client batches reads
 * through Multicall3, which routes the call as a Multicall3 sub-call and makes
 * the precompile return empty data, so we read it through a plain viem client
 * instead (viem does not multicall unless asked).
 *
 * demo: Arbitrum Sepolia only - the Pendle flow is the only caller.
 * NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL overrides the public default RPC when set.
 */
const feeClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL),
})

const formatFeeGwei = (weiHex: `0x${string}`): string => {
  const gwei = formatGwei(BigInt(weiHex))

  return `${gwei} gwei`
}

/**
 * Live Arbitrum sequencer-fee breakdown for the outer policy-gate call: the
 * L1 calldata-posting cost, the L2 compute cost, and their total. Reads
 * NodeInterface.gasEstimateComponents via @txkit/arbitrum-adapter, fetched
 * with react-query. Pendle flow only (value=0 = a clean L1 + L2 split).
 *
 * Failure modes degrade gracefully: an "estimating" hint while the RPC is in
 * flight, and a null preview (RPC unreachable or the simulated call reverts)
 * renders nothing rather than blocking the envelope preview.
 */
export const SequencerFeeRow = (props: SequencerFeeRowProps) => {
  const { chain, to, calldata } = props

  const { data: preview, isLoading } = useQuery({
    queryKey: [ 'sequencerFee', chain, to, calldata ],
    queryFn: async () => previewSequencerFee(feeClient, { chain, to, calldata }),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <p className="text-sm text-muted">Estimating sequencer fee...</p>
    )
  }

  if (preview === null || preview === undefined) {
    return null
  }

  const { l1FeeWei, l2FeeWei, totalFeeWei } = preview

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Estimated sequencer fee</p>
      <div className="rounded-lg border border-border bg-card-sunken p-4 space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted">L1 calldata</span>
          <span className="font-mono">{formatFeeGwei(l1FeeWei)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between gap-3">
          <span className="text-muted">L2 compute</span>
          <span className="font-mono">{formatFeeGwei(l2FeeWei)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between gap-3">
          <span className="text-foreground">Total</span>
          <span className="font-mono">{formatFeeGwei(totalFeeWei)}</span>
        </div>
      </div>
    </div>
  )
}
