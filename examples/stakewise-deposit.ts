/**
 * examples/stakewise-deposit.ts
 *
 * Minimal example: construct and validate a PreparedTransaction for
 * depositing 1 ETH into StakeWise Genesis Vault.
 *
 * Run:
 *   pnpm exec tsx examples/stakewise-deposit.ts
 */

import { SPEC_VERSION, serialize, deserialize, validatePreparedTx } from '@txkit/tx-protocol'
import type { PreparedTransaction } from '@txkit/tx-protocol'

const GENESIS_VAULT = '0xAC0F906E433d58FA868F936E8A43230473652885' as const

const deposit: PreparedTransaction = {
  version: SPEC_VERSION,
  chainId: 1,
  to: GENESIS_VAULT,
  // encoded deposit(assets=1e18, receiver=0x...deadbeef, referrer=0x0)
  data: '0x6e553f650000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000deadbeef0000000000000000000000000000000000000000000000000000000000000000',
  value: 1_000_000_000_000_000_000n,
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
        symbol: 'ETH',
        decimals: 18,
        amount: 1_000_000_000_000_000_000n,
        direction: 'out',
      },
    ],
    counterparties: [GENESIS_VAULT],
    estimatedGas: 120_000n,
  },
  decoderRef: 'stakewise-v3/vault/deposit',
}

// 1. Validate shape against spec v0.1
const result = validatePreparedTx(deposit)
if (!result.ok) {
  console.error('Validation failed:', result.error)
  if (result.issues) console.error(result.issues)
  process.exit(1)
}

console.log('Valid PreparedTransaction:', result.value.description.short)
console.log('Chain:', result.value.chainId)
console.log('To:', result.value.to)
console.log('Value:', `${Number(result.value.value) / 1e18} ETH`)

// 2. Serialize for transport (e.g., over MCP tool response)
const json = serialize(deposit)
console.log('\nSerialized payload (first 200 chars):')
console.log(json.slice(0, 200) + '...')

// 3. Roundtrip back from JSON
const restored = deserialize(json)
console.log('\nRoundtrip bigint value preserved:', restored.value === deposit.value)
