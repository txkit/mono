import { encodeFunctionData, keccak256, toHex } from 'viem'

import { ARBITRUM_SEPOLIA_CHAIN_ID, ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import { getAgentPolicyGateAddress } from '@/src/config/deployed'

import { AGENT_POLICY_GATE_ABI } from './policy-gate-abi'
import type { PreparePendleYieldSwapArgs, PrepareRwaBuyArgs } from './tools'


/**
 * Single canonical envelope shape used by the example. Mirrors the
 * @txkit/tx-protocol PreparedEnvelope shape closely; we keep a local
 * type here so the demo compiles even when the workspace type evolves.
 *
 * When @txkit/tx-protocol v0.2 stabilises the canonical type, swap this
 * for `import { PreparedEnvelope } from '@txkit/tx-protocol'`.
 */
export type DemoEnvelope = {
  kind: 'evm-tx',
  chain: `eip155:${number}`,
  call: {
    to: `0x${string}`,
    data: `0x${string}`,
    value: `0x${string}`,
  },
  inner: {
    to: `0x${string}`,
    data: `0x${string}`,
    value: `0x${string}`,
    label: string,
  },
  meta: {
    envelopeHash: `0x${string}`,
    validity: { notAfter: number },
    builder: 'arbitrum-london-buildathon',
  },
}

/**
 * Mock Pendle Router selector (placeholder). When the real MockPendleRouter
 * or live Pendle V2 Router shipper is wired, swap this for the proper ABI.
 *
 * The shape mimics Pendle V2's swapExactTokenForPt(receiver, market, minPtOut, ...)
 * but compressed to (tokenOut, amountIn, minPtOut) for the demo.
 */
const MOCK_PENDLE_ROUTER_ABI = [
  {
    type: 'function',
    name: 'swapExactTokenForPt',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'ptOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minPtOut', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/**
 * Address of the deployed MockPendleRouter on Arbitrum Sepolia. Pending
 * deploy - the envelope builder will throw a clear error if called before
 * Mike fills this in.
 */
const MOCK_PENDLE_ROUTER_ADDRESS = '0x__PENDING_PENDLE_DEPLOY__' as const

const TWO_HOURS_SECONDS = 7200

const computeEnvelopeHash = (chainId: number, inner: DemoEnvelope['inner']): `0x${string}` => {
  // Demo hash: keccak256(chainId || to || data || value). The real envelope
  // hash should be the canonical hash from @txkit/tx-protocol once stable.
  const payload = `${chainId}:${inner.to.toLowerCase()}:${inner.data}:${inner.value}`
  return keccak256(toHex(payload))
}

export const buildPendleEnvelope = (args: PreparePendleYieldSwapArgs, receiverAddress: `0x${string}`): DemoEnvelope => {
  if (MOCK_PENDLE_ROUTER_ADDRESS.includes('PENDING')) {
    throw new Error(
      'MockPendleRouter not deployed yet. Deploy via forge script and update envelope-builder.ts.',
    )
  }

  // Conservative minPtOut: assume 1:1 base rate minus declared slippage.
  // Production builder would query a quoter; for the mock 1:0.995 router this works.
  const amountInBigInt = BigInt(args.amountIn)
  const slippageMultiplier = 10000n - BigInt(args.slippageBps)
  const minPtOut = (amountInBigInt * slippageMultiplier) / 10000n

  const innerCallData = encodeFunctionData({
    abi: MOCK_PENDLE_ROUTER_ABI,
    functionName: 'swapExactTokenForPt',
    args: [ receiverAddress, args.tokenOut as `0x${string}`, amountInBigInt, minPtOut ],
  })
  const innerValueHex = '0x0' as `0x${string}`
  const innerLabel = `Pendle: swap ${args.amountIn} of ${args.tokenIn} for PT ${args.tokenOut} (min ${minPtOut.toString()})`

  const inner = {
    to: MOCK_PENDLE_ROUTER_ADDRESS as `0x${string}`,
    data: innerCallData,
    value: innerValueHex,
    label: innerLabel,
  }

  const envelopeHash = computeEnvelopeHash(ARBITRUM_SEPOLIA_CHAIN_ID, inner)

  // Outer call wraps the inner action through AgentPolicyGate.executeEnvelope.
  // Signature is intentionally left empty here - the API route will sign the
  // envelope hash with the agent key before returning to the client.
  const policyGateAddress = getAgentPolicyGateAddress(ARBITRUM_SEPOLIA_CHAIN_ID)
  const outerCallData = encodeFunctionData({
    abi: AGENT_POLICY_GATE_ABI,
    functionName: 'executeEnvelope',
    args: [ envelopeHash, '0x' as `0x${string}`, inner.to, inner.data, BigInt(inner.value) ],
  })

  return {
    kind: 'evm-tx',
    chain: `eip155:${ARBITRUM_SEPOLIA_CHAIN_ID}`,
    call: {
      to: policyGateAddress,
      data: outerCallData,
      value: innerValueHex,
    },
    inner,
    meta: {
      envelopeHash,
      validity: { notAfter: Math.floor(Date.now() / 1000) + TWO_HOURS_SECONDS },
      builder: 'arbitrum-london-buildathon',
    },
  }
}

/**
 * Placeholder RWA envelope builder for Scenario C. Implementation lands
 * Phase 2 Day 10. For now returns a structured error so the API route
 * can respond with a clear "not implemented yet" instead of a runtime crash.
 */
export const buildRwaEnvelope = (_args: PrepareRwaBuyArgs, _receiverAddress: `0x${string}`): DemoEnvelope => {
  throw new Error(
    'RWA envelope builder not implemented yet. Lands in Buildathon Phase 2 Day 10 (Sun Jun 1).',
  )
}

// Suppress unused-import warning for the chain id constant in the placeholder branch.
void ROBINHOOD_TESTNET_CHAIN_ID
