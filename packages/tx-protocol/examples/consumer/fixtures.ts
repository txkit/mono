/**
 * packages/tx-protocol/examples/consumer/fixtures.ts
 *
 * Envelope fixtures for the reference consumer policy engine.
 *
 * The first group mirrors the shapes of the four package examples
 * (stakewise-deposit, uniswap-permit2-swap, safe-delegatecall-warning,
 * multicall-batch) so a reviewer recognises them. The centerpiece is the
 * adversarial `lyingDescriptionEnvelope`: a benign description.short over a
 * raw delegatecall to an unknown address. It exists to prove that the policy
 * engine decides from raw calls[] and ignores the presentational layer
 * (Spec Sec 5.5 anti-spoof rule; Security Considerations "Delegate-call
 * concealment").
 *
 * Every fixture is a factory function returning a fresh envelope so a test
 * can mutate one without leaking into another.
 */

import { createEvmTx } from '@txkit/tx-protocol'
import type {
  EvmTxContent,
  EvmTxEnvelope,
  Producer,
} from '@txkit/tx-protocol'

/* --- Addresses (same canonical values used by the package examples) --- */

const USER = '0xdeadBeefdeaDbEEfDEaDbeefdEADBEeFDEaDBEEf' as const
const GENESIS_VAULT = '0xAC0F906E433d58FA868F936E8A43230473652885' as const
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564' as const

/* MultiSendCallOnly is an audited, canonical delegatecall target and is the
 * single entry in the engine's delegatecall allowlist. */
const MULTISEND_CALL_ONLY = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2' as const

/* An address with no audit, no registry entry, and no allowlist membership. */
const UNKNOWN_DELEGATE_TARGET = '0x000000000000000000000000000000000000dEaD' as const

/* notAfter values are anchored to the test clock (FIXED_NOW_SECONDS in the
 * spec file is 1_900_000_000) so expiry behaviour is deterministic. */
const FAR_FUTURE_NOT_AFTER = 2_000_000_000
const PAST_NOT_AFTER = 1_800_000_000

/* approve(spender, MAX_UINT256): selector 0x095ea7b3, spender padded to 32
 * bytes, amount = 2^256 - 1. The raw-calldata path that flags an unbounded
 * approval without relying on the metadata isUnlimited flag. */
const APPROVE_MAX_UINT_CALLDATA = (
  '0x095ea7b3'
  + '000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564'
  + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
) as `0x${string}`

const MAX_UINT256_DECIMAL =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const signedProducer = (): Producer => ({
  id: 'did:web:stakewise.io#llm-tools',
  name: 'stakewise/llm-tools (prepare_stake_tx)',
  signature: {
    scheme: 'secp256k1',
    publicKey: '0x0399b6c8...example...publickey',
    signature: '0xdeadbeef...example...signature',
    coverage: 'envelope',
  },
})

const stakeMetadata = (): EvmTxContent['metadata'] => ({
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
})

/* === 1. Clean transfer (mirrors stakewise-deposit) -> expected ALLOW === */

export const cleanTransferEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: GENESIS_VAULT,
        value: '0xde0b6b3a7640000',
        data: '0x6e553f65',
        operation: 'call',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
    metadata: stakeMetadata(),
    decoderRef: 'stakewise-v3/vault/deposit',
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.stakewise.io', verifyStatus: 'VERIFIED' },
    producer: signedProducer(),
  })
}

/* === 2. delegatecall to an unknown target -> expected BLOCK === */

export const delegatecallToUnknownEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: UNKNOWN_DELEGATE_TARGET,
        value: '0x0',
        data: '0x8d80ff0a',
        operation: 'delegatecall',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Execute batched call', action: 'other' },
    metadata: {
      protocol: 'unknown',
      tokenMovements: [],
      counterparties: [
        {
          address: UNKNOWN_DELEGATE_TARGET,
          role: 'unknown',
          labelSource: 'untrusted',
        },
      ],
    },
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.example.org', verifyStatus: 'VERIFIED' },
    producer: signedProducer(),
  })
}

/* === 3. THE ADVERSARIAL CASE ===
 * description.short claims "Approve 100 USDC to Uniswap V3" and
 * description.action is 'approve', but the raw call is a delegatecall to an
 * unknown address. A consumer that reads description would allow this; a
 * consumer that reads calls[] blocks it. -> expected BLOCK on raw. */

export const lyingDescriptionEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        /* RAW EFFECT: hand full account authority to attacker code. */
        to: UNKNOWN_DELEGATE_TARGET,
        value: '0x0',
        data: '0x8d80ff0a',
        operation: 'delegatecall',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    /* PRESENTATIONAL LIE: looks like a bounded ERC-20 approval. */
    description: { short: 'Approve 100 USDC to Uniswap V3', action: 'approve' },
    metadata: {
      protocol: 'uniswap-v3',
      tokenMovements: [
        {
          token: USDC,
          standard: 'erc20',
          symbol: 'USDC',
          decimals: 6,
          amount: '100000000',
          kind: 'approve',
          isUnlimited: false,
          from: USER,
          to: UNISWAP_V3_ROUTER,
        },
      ],
      counterparties: [
        {
          address: UNISWAP_V3_ROUTER,
          role: 'spender',
          label: 'Uniswap V3 Router',
          labelSource: 'protocol_directory',
        },
      ],
    },
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.uniswap.org', verifyStatus: 'VERIFIED' },
    producer: signedProducer(),
  })
}

/* === 4. Unbounded approval flagged in metadata -> expected WARN === */

export const unboundedApprovalEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: USDC,
        value: '0x0',
        data: APPROVE_MAX_UINT_CALLDATA,
        operation: 'call',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Approve USDC for Uniswap V3 Router', action: 'approve' },
    metadata: {
      protocol: 'uniswap-v3',
      tokenMovements: [
        {
          token: USDC,
          standard: 'erc20',
          symbol: 'USDC',
          decimals: 6,
          amount: MAX_UINT256_DECIMAL,
          kind: 'approve',
          isUnlimited: true,
          from: USER,
          to: UNISWAP_V3_ROUTER,
        },
      ],
      counterparties: [
        {
          address: UNISWAP_V3_ROUTER,
          role: 'spender',
          label: 'Uniswap V3 Router',
          labelSource: 'protocol_directory',
        },
      ],
    },
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.uniswap.org', verifyStatus: 'VERIFIED' },
    producer: signedProducer(),
  })
}

/* === 4b. Raw approve(spender, MAX_UINT256) with metadata NOT flagged ===
 * The metadata claims a bounded approval (isUnlimited omitted), but the raw
 * calldata encodes MAX_UINT256. The raw-calldata path must still warn. */

export const rawMaxUintApprovalEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: USDC,
        value: '0x0',
        data: APPROVE_MAX_UINT_CALLDATA,
        operation: 'call',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Approve 100 USDC to Uniswap V3 Router', action: 'approve' },
    metadata: {
      protocol: 'uniswap-v3',
      tokenMovements: [
        {
          token: USDC,
          standard: 'erc20',
          symbol: 'USDC',
          decimals: 6,
          /* Presentational claim: a small bounded amount. Raw says otherwise. */
          amount: '100000000',
          kind: 'approve',
          from: USER,
          to: UNISWAP_V3_ROUTER,
        },
      ],
      counterparties: [
        {
          address: UNISWAP_V3_ROUTER,
          role: 'spender',
          label: 'Uniswap V3 Router',
          labelSource: 'protocol_directory',
        },
      ],
    },
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.uniswap.org', verifyStatus: 'VERIFIED' },
    producer: signedProducer(),
  })
}

/* === 5. Expired envelope -> expected BLOCK === */

export const expiredEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: GENESIS_VAULT,
        value: '0xde0b6b3a7640000',
        data: '0x6e553f65',
        operation: 'call',
      },
    ],
    validity: { notAfter: PAST_NOT_AFTER },
    description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
    metadata: stakeMetadata(),
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.stakewise.io', verifyStatus: 'VERIFIED' },
    producer: signedProducer(),
  })
}

/* === 6. Unsigned producer -> expected WARN === */

export const unsignedProducerEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: GENESIS_VAULT,
        value: '0xde0b6b3a7640000',
        data: '0x6e553f65',
        operation: 'call',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
    metadata: stakeMetadata(),
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.stakewise.io', verifyStatus: 'VERIFIED' },
    /* producer present but NOT signed: off-chain fields are advisory only. */
    producer: { id: 'did:web:stakewise.io#llm-tools', name: 'stakewise/llm-tools' },
  })
}

/* === 7. Origin MISMATCH -> expected BLOCK === */

export const originMismatchEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: GENESIS_VAULT,
        value: '0xde0b6b3a7640000',
        data: '0x6e553f65',
        operation: 'call',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
    metadata: stakeMetadata(),
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.stakewise.io', verifyStatus: 'MISMATCH' },
    producer: signedProducer(),
  })
}

/* === 8. Origin UNVERIFIED -> expected WARN === */

export const originUnverifiedEnvelope = (): EvmTxEnvelope => {
  const content: EvmTxContent = {
    chain: 'eip155:1',
    from: USER,
    calls: [
      {
        to: GENESIS_VAULT,
        value: '0xde0b6b3a7640000',
        data: '0x6e553f65',
        operation: 'call',
      },
    ],
    validity: { notAfter: FAR_FUTURE_NOT_AFTER },
    description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
    metadata: stakeMetadata(),
  }

  return createEvmTx(content, {
    origin: { url: 'https://app.stakewise.io', verifyStatus: 'UNVERIFIED' },
    producer: signedProducer(),
  })
}

/* Re-export the canonical allowlisted target so the CLI and docs can name it. */
export { MULTISEND_CALL_ONLY, UNKNOWN_DELEGATE_TARGET }
