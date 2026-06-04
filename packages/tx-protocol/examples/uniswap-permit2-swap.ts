/**
 * packages/tx-protocol/examples/uniswap-permit2-swap.ts
 *
 * Two-step DeFi flow:
 *   Step 1: EIP-712 Permit2 signature (kind: 'signature')
 *   Step 2: Uniswap Universal Router swap (kind: 'evm-tx')
 *
 * Producers that need a Permit2 approval MUST emit a 'signature' envelope
 * first, NOT an 'evm-tx' with action: 'permit'. Off-chain signatures and
 * transactions are categorically different for the signer.
 */

import {
  createEvmTx,
  createSignature,
  validateEnvelope,
} from '@txkit/tx-protocol'
import type { EvmTxContent, SignatureContent } from '@txkit/tx-protocol'

const USER = '0xdeadBeefdeaDbEEfDEaDbeefdEADBEeFDEaDBEEf' as const
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const
const UNIVERSAL_ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD' as const
const DEADLINE = Math.floor(Date.now() / 1000) + 1800
// §5.4: validity.notAfter MUST sit strictly below the earliest on-chain expiry
// (here the Permit2 sigDeadline == DEADLINE) by a >=60s safety buffer, so a
// consumer stops submitting before the on-chain deadline can lapse mid-flight.
const NOT_AFTER = DEADLINE - 60

/* --- Step 1: Permit2 signature envelope --- */

const permitContent: SignatureContent = {
  chain: 'eip155:1',
  from: USER,
  scheme: 'eip-712',
  domain: {
    name: 'Permit2',
    chainId: 1,
    verifyingContract: PERMIT2,
  },
  types: {
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
  },
  primaryType: 'PermitSingle',
  message: {
    details: {
      token: USDC,
      amount: '1000000000',
      expiration: DEADLINE.toString(),
      nonce: '0',
    },
    spender: UNIVERSAL_ROUTER,
    sigDeadline: DEADLINE.toString(),
  },
  description: {
    short: 'Permit Uniswap Universal Router to spend up to 1000 USDC',
    action: 'permit',
  },
  validity: { notAfter: NOT_AFTER },
}

const permit = createSignature(permitContent, {
  origin: { url: 'https://app.uniswap.org', verifyStatus: 'VERIFIED' },
})

/* --- Step 2: Universal Router swap tx --- */

const swapContent: EvmTxContent = {
  chain: 'eip155:1',
  from: USER,
  calls: [
    {
      to: UNIVERSAL_ROUTER,
      value: '0x0',
      data: '0x3593564c',
      operation: 'call',
    },
  ],
  validity: { notAfter: NOT_AFTER },
  description: {
    short: 'Swap 1000 USDC for ETH via Uniswap',
    action: 'swap',
  },
  metadata: {
    protocol: 'uniswap-universal-router',
    tokenMovements: [
      {
        token: USDC,
        standard: 'erc20',
        symbol: 'USDC',
        decimals: 6,
        amount: '1000000000',
        kind: 'transfer',
        from: USER,
        to: UNIVERSAL_ROUTER,
      },
      {
        token: 'native',
        standard: 'native',
        symbol: 'ETH',
        decimals: 18,
        amount: '280000000000000000',
        kind: 'transfer',
        from: UNIVERSAL_ROUTER,
        to: USER,
      },
    ],
    counterparties: [
      {
        address: UNIVERSAL_ROUTER,
        role: 'swap-venue',
        label: 'Uniswap Universal Router',
        labelSource: 'protocol_directory',
      },
    ],
    estimation: {
      effectivePrice: '3571.43',
      minOutputAmount: '275000000000000000',
      expiration: DEADLINE,
    },
    feeBreakdown: {
      protocolFee: '2500000',
      total: '2500000',
      denomination: USDC,
    },
  },
  decoderRef: 'uniswap/universal-router/V3_SWAP_EXACT_IN',
}

const swap = createEvmTx(swapContent, {
  origin: { url: 'https://app.uniswap.org', verifyStatus: 'VERIFIED' },
})

/* --- Validate both --- */

for (const [ label, envelope ] of [[ 'permit', permit ], [ 'swap', swap ]] as const) {
  const result = validateEnvelope(envelope)
  if (!result.ok) {
    console.error(`${label} failed:`, result.error)
    console.error(result.issues)
    process.exit(1)
  }
  console.log(
    `[${label}] ok: ${envelope.kind} -- ${envelope.content.description.short}`,
  )
}
