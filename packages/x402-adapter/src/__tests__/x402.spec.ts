import { describe, expect, it } from 'vitest'

import { attachX402Intent, attachX402Proof } from '../attach'
import { extractX402, isX402Intent, isX402Proof } from '../extract'
import type { X402Intent, X402PaymentProof } from '../types'


const MINIMAL_ENVELOPE = {
  version: '0.1' as const,
  kind: 'evm-tx' as const,
  content: {
    chain: 'eip155:8453' as const,
    calls: [{ to: '0x0000000000000000000000000000000000000001' as `0x${string}`, data: '0x' as `0x${string}` }],
    validity: { notAfter: 9999999999 },
  },
}

const SAMPLE_INTENT: X402Intent = {
  paymentRequirementsHash: '0xabc',
  resource: '/api/v1/agent/skill',
  expiresAt: 9999999999,
}

const SAMPLE_PROOF: X402PaymentProof = {
  version: '0.1',
  paymentRequirementsHash: '0xabc',
  paymentReceipt: '0xdef',
  chain: 'eip155:8453',
  asset: 'native',
  amount: '0xde0b6b3a7640000',
  payee: '0x0000000000000000000000000000000000000099',
  paidAt: 1714200000,
}

describe('x402-adapter', () => {
  it('attachX402Intent populates meta.x402', () => {
    const envelope = attachX402Intent(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachX402Intent>[0], SAMPLE_INTENT)
    expect(envelope.meta?.x402).toEqual(SAMPLE_INTENT)
  })

  it('attachX402Proof populates meta.x402', () => {
    const envelope = attachX402Proof(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachX402Proof>[0], SAMPLE_PROOF)
    expect(envelope.meta?.x402).toEqual(SAMPLE_PROOF)
  })

  it('extractX402 returns intent when meta.x402 is an intent', () => {
    const envelope = { meta: { x402: SAMPLE_INTENT } }
    expect(extractX402(envelope)).toEqual(SAMPLE_INTENT)
  })

  it('extractX402 returns proof when meta.x402 is a proof', () => {
    const envelope = { meta: { x402: SAMPLE_PROOF } }
    expect(extractX402(envelope)).toEqual(SAMPLE_PROOF)
  })

  it('extractX402 returns null when meta missing', () => {
    expect(extractX402({})).toBeNull()
    expect(extractX402({ meta: {} })).toBeNull()
    expect(extractX402({ meta: { x402: { wrong: 'shape' } as never } })).toBeNull()
  })

  it('isX402Proof and isX402Intent narrow correctly', () => {
    expect(isX402Proof(SAMPLE_PROOF)).toBe(true)
    expect(isX402Proof(SAMPLE_INTENT)).toBe(false)
    expect(isX402Intent(SAMPLE_INTENT)).toBe(true)
    expect(isX402Intent(SAMPLE_PROOF)).toBe(false)
  })

  it('attach preserves existing meta keys', () => {
    const envelope = attachX402Intent(
      { ...MINIMAL_ENVELOPE, meta: { foo: 'bar' } } as unknown as Parameters<typeof attachX402Intent>[0],
      SAMPLE_INTENT,
    )
    expect(envelope.meta?.foo).toBe('bar')
    expect(envelope.meta?.x402).toEqual(SAMPLE_INTENT)
  })

  it('isX402Intent rejects objects bearing a paymentReceipt (would be a proof)', () => {
    const intentLikeButProof = {
      paymentRequirementsHash: '0xabc',
      paymentReceipt: '0xdef',
    }
    expect(isX402Intent(intentLikeButProof)).toBe(false)
  })

  it('isX402Intent allows undefined paymentReceipt fields (only present-with-value rejects)', () => {
    const intent = {
      paymentRequirementsHash: '0xabc',
      paymentReceipt: undefined,
    }
    expect(isX402Intent(intent)).toBe(true)
  })

  it('isX402Intent rejects objects missing paymentRequirementsHash', () => {
    expect(isX402Intent({ resource: '/foo' })).toBe(false)
    expect(isX402Intent({ paymentRequirementsHash: 123 })).toBe(false)
  })

  it('isX402Proof requires payee, paymentReceipt, and paymentRequirementsHash to be strings', () => {
    expect(isX402Proof({ paymentReceipt: '0xdef', paymentRequirementsHash: '0xabc' })).toBe(false)
    expect(isX402Proof({ paymentReceipt: '0xdef', paymentRequirementsHash: '0xabc', payee: '0x99' })).toBe(true)
    expect(isX402Proof({ paymentReceipt: 1, paymentRequirementsHash: '0xabc', payee: '0x99' })).toBe(false)
  })

  it('isX402Intent and isX402Proof reject null and primitives', () => {
    expect(isX402Intent(null)).toBe(false)
    expect(isX402Intent(undefined)).toBe(false)
    expect(isX402Intent('not-an-object')).toBe(false)
    expect(isX402Proof(null)).toBe(false)
    expect(isX402Proof([])).toBe(false)
  })

  it('extractX402 prefers proof shape over intent shape (proof check runs first)', () => {
    const ambiguous = { ...SAMPLE_INTENT, ...SAMPLE_PROOF }
    expect(extractX402({ meta: { x402: ambiguous } })).toEqual(ambiguous)
  })
})
