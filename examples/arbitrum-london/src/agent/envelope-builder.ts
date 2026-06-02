import { encodeAbiParameters, encodeFunctionData, keccak256, type Hex } from 'viem'

import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import {
  getAgentPolicyGateAddress,
  getMockPendleRouterAddress,
} from '@/src/config/deployed'

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
    /** Per-call nonce as decimal string (bigint losslessly serialisable). */
    nonce: string,
    validity: { notAfter: number },
    builder: 'arbitrum-london-buildathon',
  },
}

/**
 * MockPendleRouter ABI subset (only the function we call). Matches the
 * deterministic 1:0.995 mock in
 * examples/arbitrum-london/contracts/src/MockPendleRouter.sol.
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
    outputs: [{ name: 'ptOutReturned', type: 'uint256' }],
  },
] as const

const TWO_HOURS_SECONDS = 7200

/**
 * Compute the opaque `envelopeHash` used as the on-chain replay-protection
 * key. The AgentPolicyGate.executeEnvelope mapping `usedEnvelopes[hash]`
 * treats this as an opaque identifier - no canonical schema is required.
 *
 * We include a per-call nonce so retries (Loom recording, repeated demos)
 * get unique hashes and avoid `EnvelopeAlreadyUsed` reverts.
 */
const computeReplayEnvelopeHash = (
  chainId: number,
  inner: DemoEnvelope['inner'],
  nonce: bigint,
): `0x${string}` => {
  const dataHash = keccak256(inner.data)
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'uint256' },
        { type: 'address' },
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'uint256' },
      ],
      [ BigInt(chainId), inner.to, dataHash, BigInt(inner.value), nonce ],
    ),
  )
}

/**
 * Generate a unique nonce per envelope build. Combines millisecond time +
 * 32-bit random so concurrent requests in the same millisecond stay unique.
 */
const generateNonce = (): bigint => {
  const millis = BigInt(Date.now())
  const random = BigInt(Math.floor(Math.random() * 2 ** 32))
  return (millis << 32n) | random
}

/**
 * Build a Pendle yield-swap envelope. Returns the envelope with a
 * placeholder signature - the caller (server-side /api/agent route) signs
 * the EIP-712 digest via signEnvelope() and re-encodes the outer call data
 * via attachAgentSignature().
 */
export const buildPendleEnvelope = (
  args: PreparePendleYieldSwapArgs,
  receiverAddress: `0x${string}`,
): DemoEnvelope => {
  // getMockPendleRouterAddress throws a clear error before deploy lands -
  // bubble up unchanged so /api/agent renders a useful 503.
  const routerAddress = getMockPendleRouterAddress(ARBITRUM_SEPOLIA_CHAIN_ID)

  // Conservative minPtOut: assume 1:1 base rate minus declared slippage.
  // Matches MockPendleRouter's deterministic 1:0.995 conversion for any
  // slippage <= 50 bps; tighter slippage will revert as expected.
  const amountInBigInt = BigInt(args.amountIn)
  const slippageMultiplier = 10000n - BigInt(args.slippageBps)
  const minPtOut = (amountInBigInt * slippageMultiplier) / 10000n

  const innerCallData = encodeFunctionData({
    abi: MOCK_PENDLE_ROUTER_ABI,
    functionName: 'swapExactTokenForPt',
    args: [ receiverAddress, args.tokenOut as `0x${string}`, amountInBigInt, minPtOut ],
  })
  const innerValueHex = '0x0' as `0x${string}`
  const innerLabel =
    `Pendle: swap ${args.amountIn} of ${args.tokenIn} for PT ${args.tokenOut} (min ${minPtOut.toString()})`

  const inner = {
    to: routerAddress,
    data: innerCallData,
    value: innerValueHex,
    label: innerLabel,
  }

  const nonce = generateNonce()
  const envelopeHash = computeReplayEnvelopeHash(ARBITRUM_SEPOLIA_CHAIN_ID, inner, nonce)

  const policyGateAddress = getAgentPolicyGateAddress(ARBITRUM_SEPOLIA_CHAIN_ID)

  // Outer call wraps the inner action through AgentPolicyGate.executeEnvelope.
  // Signature is filled by the caller (signEnvelope + attachAgentSignature).
  const outerCallData = encodeFunctionData({
    abi: AGENT_POLICY_GATE_ABI,
    functionName: 'executeEnvelope',
    args: [ envelopeHash, '0x' as Hex, inner.to, inner.data, BigInt(inner.value) ],
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
      nonce: nonce.toString(),
      validity: { notAfter: Math.floor(Date.now() / 1000) + TWO_HOURS_SECONDS },
      builder: 'arbitrum-london-buildathon',
    },
  }
}

/**
 * Inject an agent EIP-712 signature into an already-built envelope by
 * re-encoding the outer executeEnvelope call data. Pure - returns a new
 * envelope object; inputs are not mutated.
 */
export const attachAgentSignature = (
  envelope: DemoEnvelope,
  signature: Hex,
): DemoEnvelope => {
  const { chain, inner, meta, call } = envelope
  const chainId = Number(chain.split(':')[1])
  const policyGateAddress = getAgentPolicyGateAddress(chainId)

  const outerCallData = encodeFunctionData({
    abi: AGENT_POLICY_GATE_ABI,
    functionName: 'executeEnvelope',
    args: [
      meta.envelopeHash,
      signature,
      inner.to,
      inner.data,
      BigInt(inner.value),
    ],
  })

  return {
    ...envelope,
    call: {
      to: policyGateAddress,
      data: outerCallData,
      value: call.value,
    },
  }
}

/**
 * Placeholder RWA envelope builder for Scenario C. Implementation lands
 * Phase 2 Day 10. For now returns a structured error so the API route
 * can respond with a clear "not implemented yet" instead of a runtime crash.
 */
export const buildRwaEnvelope = (
  _args: PrepareRwaBuyArgs,
  _receiverAddress: `0x${string}`,
): DemoEnvelope => {
  throw new Error('RWA envelope builder is not implemented in this build.')
}
