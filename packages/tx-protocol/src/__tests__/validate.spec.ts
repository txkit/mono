import { describe, expect, it } from 'vitest'
import {
  CALLS_STATUS,
  IMPLEMENTED_KINDS,
  RESERVED_KINDS,
  SPEC_SCHEMA_URL,
  createEvmBatch,
  createEvmTx,
  createSignature,
  deserialize,
  serialize,
  validateEnvelope,
} from '../index'
import type {
  EvmTxContent,
  PreparedEnvelope,
  SignatureContent,
} from '../index'

const notAfter = Math.floor(Date.now() / 1000) + 3600
const GENESIS_VAULT = '0xAC0F906E433d58FA868F936E8A43230473652885' as const
const USER = '0x1111111111111111111111111111111111111111' as const
const ATTACKER = '0x2222222222222222222222222222222222222222' as const

const validStakeCall = {
  to: GENESIS_VAULT,
  value: '0xde0b6b3a7640000' as `0x${string}`,
  data: '0x6e553f65' as `0x${string}`,
  operation: 'call' as const,
}

const validEvmContent: EvmTxContent = {
  chain: 'eip155:1',
  chainId: 1,
  from: USER,
  calls: [ validStakeCall ],
  validity: { notAfter },
  description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
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
  },
  decoderRef: 'stakewise-v3/vault/deposit',
}

const evmTx = (content: EvmTxContent = validEvmContent) => createEvmTx(content)

describe('envelope + evm-tx validation', () => {
  it('accepts a canonical evm-tx envelope', () => {
    const env = evmTx()
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
    if (result.ok && result.value.kind === 'evm-tx') {
      expect(result.value.content.calls).toHaveLength(1)
    }
  })

  it('populates $schema and issuedAt via createEvmTx (no version field per spec)', () => {
    const env = evmTx()
    expect(env.$schema).toBe(SPEC_SCHEMA_URL)
    expect((env as Record<string, unknown>).version).toBeUndefined()
    expect(typeof env.issuedAt).toBe('string')
  })

  it('rejects evm-tx with more than one call (must use evm-batch)', () => {
    const env = evmTx({
      ...validEvmContent,
      calls: [ validStakeCall, { ...validStakeCall, value: '0x0' }],
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message.includes("'evm-tx'"))).toBe(true)
    }
  })

  it('accepts evm-batch with two or more calls', () => {
    const env = createEvmBatch({
      ...validEvmContent,
      calls: [ validStakeCall, { ...validStakeCall, value: '0x0' }],
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
  })

  it('rejects evm-batch with a single call', () => {
    const env = createEvmBatch(validEvmContent)
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
  })
})

describe('required fields', () => {
  it('rejects missing description.short', () => {
    const env = evmTx({ ...validEvmContent, description: { short: '', action: 'stake' } })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('description.short'))).toBe(true)
    }
  })

  it('rejects missing validity.notAfter', () => {
    const env = evmTx({ ...validEvmContent, validity: { notAfter: 0 } as never })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
  })

  it('rejects non-CAIP-2 chain strings', () => {
    const env = evmTx({ ...validEvmContent, chain: '1' as never })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('chain'))).toBe(true)
    }
  })

  it('rejects bad hex address', () => {
    const env = evmTx({
      ...validEvmContent,
      calls: [{ ...validStakeCall, to: '0x123' as never }],
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
  })
})

describe('token movement safety', () => {
  it('warns on unlimited (MAX_UINT) approvals', () => {
    const env = evmTx({
      ...validEvmContent,
      description: { short: 'Approve USDC', action: 'approve' },
      metadata: {
        ...validEvmContent.metadata,
        tokenMovements: [
          {
            token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            standard: 'erc20',
            symbol: 'USDC',
            decimals: 6,
            amount:
              '115792089237316195423570985008687907853269984665640564039457584007913129639935',
            kind: 'approve',
            isUnlimited: true,
            from: USER,
            to: ATTACKER,
          },
        ],
      },
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(
        result.warnings?.some((warning) => warning.message.toLowerCase().includes('unlimited')),
      ).toBe(true)
    }
  })

  it('requires from and to on every token movement', () => {
    const env = evmTx({
      ...validEvmContent,
      metadata: {
        ...validEvmContent.metadata,
        tokenMovements: [
          {
            token: 'native',
            standard: 'native',
            symbol: 'ETH',
            decimals: 18,
            amount: '1',
            kind: 'transfer',
          } as never,
        ],
      },
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
  })
})

describe('delegatecall surfacing', () => {
  it('warns when operation is delegatecall', () => {
    const env = evmTx({
      ...validEvmContent,
      calls: [{ ...validStakeCall, operation: 'delegatecall' }],
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(
        result.warnings?.some((warning) => warning.message.toLowerCase().includes('delegatecall')),
      ).toBe(true)
    }
  })
})

describe('kind awareness', () => {
  it('rejects reserved kinds with a clear reason', () => {
    const env = { ...evmTx(), kind: 'evm-userop' as never }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.toLowerCase()).toContain('reserved')
    }
  })

  it('rejects unknown kinds', () => {
    const env = { ...evmTx(), kind: 'totally-made-up' as never }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
  })

  it('exposes the implemented and reserved kind lists', () => {
    expect(IMPLEMENTED_KINDS).toContain('evm-tx')
    expect(IMPLEMENTED_KINDS).toContain('evm-batch')
    expect(IMPLEMENTED_KINDS).toContain('signature')
    expect(RESERVED_KINDS).toContain('evm-userop')
    expect(RESERVED_KINDS).toContain('mandate')
  })
})

describe('signature envelope', () => {
  it('accepts an EIP-712 permit signature request', () => {
    const content: SignatureContent = {
      chain: 'eip155:1',
      from: USER,
      scheme: 'eip-712',
      domain: {
        name: 'USD Coin',
        version: '2',
        chainId: 1,
        verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      },
      types: {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'Permit',
      message: {
        owner: USER,
        spender: '0x111111125421ca6dc452d289314280a0f8842a65',
        value: '100000000',
        nonce: '0',
        deadline: notAfter.toString(),
      },
      description: { short: 'Permit 100 USDC to 1inch router', action: 'permit' },
    }
    const env = createSignature(content)
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
  })
})

describe('origin + risk + capabilities', () => {
  it('accepts origin block and risk assessment', () => {
    const env: PreparedEnvelope = {
      ...evmTx(),
      origin: { url: 'https://app.stakewise.io', verifyStatus: 'VERIFIED' },
      risk: {
        action: 'WARN',
        warnings: [
          { code: 'NEW_COUNTERPARTY', severity: 'low', message: 'first interaction' },
        ],
      },
      capabilities: { atomicRequired: true, paymasterService: { url: 'https://pm.example' } },
    }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
  })
})

describe('serialize / deserialize', () => {
  it('round-trips a canonical evm-tx envelope', () => {
    const env = evmTx()
    const json = serialize(env)
    const back = deserialize(json)
    expect(back.kind).toBe('evm-tx')
    if (back.kind === 'evm-tx') {
      expect(back.content.calls[0]!.to).toBe(GENESIS_VAULT)
      expect(back.content.validity.notAfter).toBe(notAfter)
    }
  })

  it('deserialize throws on invalid JSON shape', () => {
    expect(() => deserialize('{"kind":"evm-tx"}')).toThrow(/deserialize:/)
  })
})

describe('CALLS_STATUS taxonomy matches EIP-5792', () => {
  it('exposes the five EIP-5792 status codes', () => {
    expect(CALLS_STATUS.PENDING).toBe(100)
    expect(CALLS_STATUS.CONFIRMED).toBe(200)
    expect(CALLS_STATUS.OFFCHAIN_FAILURE).toBe(400)
    expect(CALLS_STATUS.REVERTED).toBe(500)
    expect(CALLS_STATUS.PARTIALLY_REVERTED).toBe(600)
  })
})

/* ======================================================================
 * Spec §6.2 - scheme-required fields on signature content (C1)
 * ==================================================================== */

describe('signature scheme-required fields', () => {
  const baseSignatureFields = {
    chain: 'eip155:1' as const,
    from: USER,
    description: { short: 'Sign in', action: 'other' as const },
  }

  it("rejects 'siwe' content without messageText", () => {
    const content = { ...baseSignatureFields, scheme: 'siwe' } as never as SignatureContent
    const result = validateEnvelope(createSignature(content))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('messageText'))).toBe(true)
    }
  })

  it("rejects 'personal-sign' content without messageText", () => {
    const content = { ...baseSignatureFields, scheme: 'personal-sign' } as never as SignatureContent
    const result = validateEnvelope(createSignature(content))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('messageText'))).toBe(true)
    }
  })

  it("accepts 'siwe' content once messageText is present", () => {
    const content = {
      ...baseSignatureFields,
      scheme: 'siwe',
      messageText: 'app.stakewise.io wants you to sign in with your Ethereum account',
    } as never as SignatureContent
    const result = validateEnvelope(createSignature(content))
    expect(result.ok).toBe(true)
  })

  it("rejects 'eip-712' content without domain and message", () => {
    const content = {
      ...baseSignatureFields,
      scheme: 'eip-712',
      types: { Permit: [{ name: 'owner', type: 'address' }] },
      primaryType: 'Permit',
    } as never as SignatureContent
    const result = validateEnvelope(createSignature(content))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const paths = result.issues.map((issue) => issue.path)
      expect(paths.some((path) => path.includes('domain'))).toBe(true)
      expect(paths.some((path) => path.includes('message'))).toBe(true)
    }
  })
})

/* ======================================================================
 * Spec §3.2 - content-coverage signature MUST NOT include origin
 * ==================================================================== */

describe('content-coverage origin ban', () => {
  const contentCoverageProducer = {
    id: 'did:web:producer.example',
    signature: {
      scheme: 'eip-191',
      signature: '0xabcdef',
      coverage: 'content' as const,
    },
  }
  const sampleOrigin = {
    url: 'https://app.stakewise.io',
    verifyStatus: 'VERIFIED' as const,
  }

  it("rejects an envelope with coverage 'content' that still carries origin", () => {
    const env: PreparedEnvelope = {
      ...evmTx(),
      producer: contentCoverageProducer,
      origin: sampleOrigin,
    }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('origin'))).toBe(true)
      expect(result.issues.some((issue) => issue.message.includes('§3.2'))).toBe(true)
    }
  })

  it("accepts coverage 'envelope' together with origin", () => {
    const env: PreparedEnvelope = {
      ...evmTx(),
      producer: {
        ...contentCoverageProducer,
        signature: { ...contentCoverageProducer.signature, coverage: 'envelope' },
      },
      origin: sampleOrigin,
    }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
  })

  it("accepts coverage 'content' when origin is absent", () => {
    const env: PreparedEnvelope = {
      ...evmTx(),
      producer: contentCoverageProducer,
    }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
  })
})

/* ======================================================================
 * Spec §1.2 - expiresAt MUST equal content.validity.notAfter (C2)
 * ==================================================================== */

describe('expiresAt vs validity.notAfter alignment', () => {
  it('rejects an evm-tx whose expiresAt differs from content.validity.notAfter', () => {
    const mismatchedExpiry = new Date((notAfter + 600) * 1000).toISOString()
    const env = createEvmTx(validEvmContent, { expiresAt: mismatchedExpiry })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message.includes('must equal'))).toBe(true)
      expect(result.issues.some((issue) => issue.path === 'expiresAt')).toBe(true)
    }
  })

  it('accepts an evm-tx whose expiresAt equals content.validity.notAfter', () => {
    const alignedExpiry = new Date(notAfter * 1000).toISOString()
    const env = createEvmTx(validEvmContent, { expiresAt: alignedExpiry })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(true)
  })
})

/* ======================================================================
 * Spec §5.3 - operation is required on every EvmCall (C3)
 * ==================================================================== */

describe('required operation on EvmCall', () => {
  it('rejects a call with operation omitted', () => {
    const callWithoutOperation = {
      to: GENESIS_VAULT,
      value: '0xde0b6b3a7640000',
      data: '0x6e553f65',
    }
    const env = evmTx({
      ...validEvmContent,
      calls: [ callWithoutOperation as never ],
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('operation'))).toBe(true)
    }
  })
})

/* ======================================================================
 * Reference-impl primitive tightening (C4)
 * ==================================================================== */

describe('amount and origin.url primitives', () => {
  it("rejects a tokenMovement.amount of '-5'", () => {
    const env = evmTx({
      ...validEvmContent,
      metadata: {
        ...validEvmContent.metadata,
        tokenMovements: [
          {
            token: 'native',
            standard: 'native',
            symbol: 'ETH',
            decimals: 18,
            amount: '-5',
            kind: 'transfer',
            from: USER,
            to: GENESIS_VAULT,
          },
        ],
      },
    })
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('amount'))).toBe(true)
    }
  })

  it("rejects an origin.url of 'not-a-url'", () => {
    const env: PreparedEnvelope = {
      ...evmTx(),
      origin: { url: 'not-a-url' as never, verifyStatus: 'VERIFIED' },
    }
    const result = validateEnvelope(env)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes('url'))).toBe(true)
    }
  })
})
