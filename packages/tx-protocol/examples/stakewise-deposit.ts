/**
 * packages/tx-protocol/examples/stakewise-deposit.ts
 *
 * Minimal example: construct and validate a PreparedEnvelope (kind: 'evm-tx')
 * for depositing 1 ETH into the StakeWise Genesis Vault.
 *
 * Run:
 *   pnpm exec tsx packages/tx-protocol/examples/stakewise-deposit.ts
 */

import {
  createEvmTx,
  deserialize,
  serialize,
  validateEnvelope,
} from '@txkit/tx-protocol'
import type { EvmTxContent } from '@txkit/tx-protocol'

const GENESIS_VAULT = '0xAC0F906E433d58FA868F936E8A43230473652885' as const
const USER = '0xdeadBeefdeaDbEEfDEaDbeefdEADBEeFDEaDBEEf' as const

const content: EvmTxContent = {
  chain: 'eip155:1',
  chainId: 1,
  from: USER,
  calls: [
    {
      to: GENESIS_VAULT,
      // encoded deposit(assets=1e18, receiver=USER, referrer=0x0)
      data: '0x6e553f650000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000deadbeef0000000000000000000000000000000000000000000000000000000000000000',
      value: '0xde0b6b3a7640000',
      operation: 'call',
    },
  ],
  validity: {
    notAfter: Math.floor(Date.now() / 1000) + 3600,
    nonceKind: 'sequential',
  },
  description: {
    short: 'Stake 1 ETH in Genesis Vault',
    long: 'Deposits 1 ETH into StakeWise Genesis Vault. Mints vault shares representing your stake. Earns staking rewards.',
    action: 'stake',
  },
  metadata: {
    protocol: 'stakewise-v3',
    tokenMovements: [
      {
        token: 'native',
        standard: 'native',
        symbol: 'ETH',
        decimals: 18,
        amount: '1000000000000000000',
        kind: 'transfer',
        from: USER,
        to: GENESIS_VAULT,
      },
    ],
    counterparties: [
      {
        address: GENESIS_VAULT,
        role: 'pool',
        label: 'StakeWise Genesis Vault',
        labelSource: 'protocol_directory',
      },
    ],
    estimatedGas: '120000',
  },
  decoderRef: 'stakewise-v3/vault/deposit',
}

const envelope = createEvmTx(content, {
  origin: { url: 'https://app.stakewise.io', verifyStatus: 'VERIFIED' },
  producer: {
    id: 'did:web:stakewise.io#llm-tools',
    name: 'stakewise/llm-tools (prepare_stake_tx)',
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
console.log('Origin verify status:', result.value.origin?.verifyStatus ?? 'none')
console.log('Expires at:', result.value.expiresAt)
if (result.warnings) {
  console.log('Advisories:')
  for (const w of result.warnings) {
    console.log(`  [${w.severity}] ${w.path}: ${w.message}`)
  }
}

const json = serialize(envelope)
console.log('\nSerialized payload (first 200 chars):')
console.log(json.slice(0, 200) + '...')

const restored = deserialize(json)
console.log('\nRoundtrip kind preserved:', restored.kind === envelope.kind)
