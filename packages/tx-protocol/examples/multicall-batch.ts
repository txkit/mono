/**
 * packages/tx-protocol/examples/multicall-batch.ts
 *
 * Example: PreparedEnvelope (kind: 'evm-batch') for an atomic
 * approve + swap flow via ERC-5792 wallet_sendCalls.
 *
 * Demonstrates:
 *  - evm-batch kind with calls.length >= 2 (Spec §5.1)
 *  - atomicRequired capability per ERC-5792 (Spec §8.1)
 *  - Multi-call tokenMovements enumeration covering approve + transfer
 *    in the same envelope (Spec §5.6)
 *
 * Run:
 *   pnpm exec tsx packages/tx-protocol/examples/multicall-batch.ts
 */

import {
  createEvmBatch,
  deserialize,
  serialize,
  validateEnvelope,
} from '@txkit/tx-protocol'
import type { EvmTxContent } from '@txkit/tx-protocol'

const USER = '0xdeadBeefdeaDbEEfDEaDbeefdEADBEeFDEaDBEEf' as const
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564' as const

// 1,000 USDC = 1_000 * 10^6 (USDC has 6 decimals)
const AMOUNT_RAW = '1000000000'

const content: EvmTxContent = {
  chain: 'eip155:1',
  chainId: 1,
  from: USER,
  calls: [
    {
      // Call 1: approve USDC for 1000 to Uniswap V3 Router.
      // approve(spender=router, amount=1_000_000_000)
      to: USDC,
      data: '0x095ea7b3000000000000000000000000e592427a0aece92de3edee1f18e0157c0586156400000000000000000000000000000000000000000000000000000000003b9aca00',
      value: '0x0',
      operation: 'call',
    },
    {
      // Call 2: exactInputSingle USDC -> ETH on Uniswap V3 (0.05% pool).
      // Calldata truncated for brevity; in production the consumer decodes
      // the full selector + struct against the canonical Router ABI.
      to: UNISWAP_V3_ROUTER,
      data: '0x414bf389000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeef000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003b9aca0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      value: '0x0',
      operation: 'call',
    },
  ],
  validity: {
    notAfter: Math.floor(Date.now() / 1000) + 1800,
    nonceKind: 'sequential',
  },
  description: {
    short: 'Swap 1000 USDC for ETH (atomic approve + swap)',
    long: 'Atomic batch: approve 1000 USDC to Uniswap V3 Router, then swap 1000 USDC for ETH via exactInputSingle on the 0.05% pool. Either both calls execute or both revert per ERC-5792 atomicRequired.',
    action: 'swap',
  },
  metadata: {
    protocol: 'uniswap-v3',
    tokenMovements: [
      {
        token: USDC,
        standard: 'erc20',
        symbol: 'USDC',
        decimals: 6,
        amount: AMOUNT_RAW,
        kind: 'approve',
        from: USER,
        to: UNISWAP_V3_ROUTER,
        isUnlimited: false,
      },
      {
        token: USDC,
        standard: 'erc20',
        symbol: 'USDC',
        decimals: 6,
        amount: AMOUNT_RAW,
        kind: 'transfer',
        from: USER,
        to: UNISWAP_V3_ROUTER,
      },
    ],
    counterparties: [
      {
        address: USDC,
        role: 'unknown',
        label: 'USDC',
        labelSource: 'protocol_directory',
      },
      {
        address: UNISWAP_V3_ROUTER,
        role: 'swap-venue',
        label: 'Uniswap V3 Router',
        labelSource: 'protocol_directory',
      },
    ],
    estimatedGas: '180000',
  },
  decoderRef: 'uniswap-v3/router/exactInputSingle',
}

const envelope = createEvmBatch(content, {
  origin: { url: 'https://app.uniswap.org', verifyStatus: 'VERIFIED' },
  producer: {
    id: 'did:web:uniswap.org#agent-tools',
    name: 'uniswap/agent-tools',
  },
  capabilities: {
    atomicRequired: true,
  },
})

const result = validateEnvelope(envelope)
if (!result.ok) {
  console.error('Validation failed:', result.error)
  console.error(result.issues)
  process.exit(1)
}

console.log('Valid PreparedEnvelope:', result.value.content.description.short)
console.log('Kind:', result.value.kind)
console.log('Chain:', result.value.content.chain)
console.log('Calls:', result.value.content.calls.length)
console.log('Atomic required:', result.value.capabilities?.atomicRequired)
console.log('Origin verify status:', result.value.origin?.verifyStatus ?? 'none')
console.log('Expires at:', result.value.expiresAt)
if (result.warnings) {
  console.log('Advisories:')
  for (const warning of result.warnings) {
    console.log(`  [${warning.severity}] ${warning.path}: ${warning.message}`)
  }
}

const json = serialize(envelope)
console.log('\nSerialized payload (first 200 chars):')
console.log(json.slice(0, 200) + '...')

const restored = deserialize(json)
console.log('\nRoundtrip kind preserved:', restored.kind === envelope.kind)
