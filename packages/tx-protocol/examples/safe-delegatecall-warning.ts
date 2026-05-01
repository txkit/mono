/**
 * packages/tx-protocol/examples/safe-delegatecall-warning.ts
 *
 * Demonstrates the v0.1 delegatecall advisory. Bybit $1.4B (Feb 2025),
 * UXLINK, and Radiant were all executed by UI-concealed delegatecall flips.
 * v0.1 surfaces operation as a first-class typed field so wallets can apply
 * allowlist-based risk rules.
 *
 * This example emits an envelope with a delegatecall; strict validation
 * succeeds (shape is legal) but returns a WARN advisory that wallets MUST
 * surface.
 */

import { createEvmTx, validateEnvelope } from '@txkit/tx-protocol'
import type { EvmTxContent } from '@txkit/tx-protocol'

const SAFE = '0x1111111111111111111111111111111111111111' as const
const MULTISEND_CALL_ONLY = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2' as const

const content: EvmTxContent = {
  chain: 'eip155:1',
  from: SAFE,
  calls: [
    {
      to: MULTISEND_CALL_ONLY,
      value: '0x0',
      data: '0x8d80ff0a',
      operation: 'delegatecall',
    },
  ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 1800 },
  description: {
    short: 'Execute Safe multisend batch',
    action: 'other',
  },
  metadata: {
    protocol: 'safe',
    tokenMovements: [],
    counterparties: [
      {
        address: MULTISEND_CALL_ONLY,
        role: 'admin',
        label: 'Safe MultiSendCallOnly v1.4.1',
        labelSource: 'protocol_directory',
      },
    ],
  },
  decoderRef: 'safe/multisend/execute',
}

const envelope = createEvmTx(content, {
  origin: { url: 'https://app.safe.global', verifyStatus: 'VERIFIED' },
})

const result = validateEnvelope(envelope)
if (!result.ok) {
  console.error('Validation failed:', result.error)
  process.exit(1)
}

console.log('Envelope accepted:', result.value.content.description.short)
if (result.warnings) {
  console.log('Advisories (wallets MUST surface):')
  for (const w of result.warnings) {
    console.log(`  [${w.severity}] ${w.path}`)
    console.log(`    ${w.message}`)
  }
}
