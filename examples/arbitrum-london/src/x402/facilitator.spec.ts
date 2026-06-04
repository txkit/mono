import { privateKeyToAccount } from 'viem/accounts'
import { describe, expect, it } from 'vitest'

import {
  X402_MERCHANT_ADDRESS,
  X402_REQUIRED_AMOUNT,
  signPayment,
  verifyPayment,
} from './facilitator'


const PAYER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const
const NONCE = ('0x' + '11'.repeat(32)) as `0x${string}`

const buildSigned = (overrides: { amount?: bigint, validUntil?: number, key?: `0x${string}` } = {}) => {
  return signPayment(
    {
      payee: X402_MERCHANT_ADDRESS,
      amount: overrides.amount ?? X402_REQUIRED_AMOUNT,
      validUntil: overrides.validUntil ?? Math.floor(Date.now() / 1000) + 600,
      nonce: NONCE,
    },
    overrides.key ?? PAYER_KEY,
  )
}

describe('x402 facilitator', () => {
  it('verifies a well-formed signed payment and returns an X402PaymentProof', async () => {
    const signed = await buildSigned()
    const result = await verifyPayment(signed)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.proof.version).toBe('0.1')
      expect(result.proof.paymentReceipt).toBe(signed.signature)
      expect(result.proof.payee.toLowerCase()).toBe(X402_MERCHANT_ADDRESS)
      expect(result.proof.chain).toBe('eip155:46630')
      expect(result.proof.paymentRequirementsHash).toBe(signed.paymentRequirementsHash)
    }
  })

  it('rejects a signature whose recovered signer is not the payer', async () => {
    const signed = await buildSigned()
    const tampered = { ...signed, payer: '0x1111111111111111111111111111111111111111' as const }
    const result = await verifyPayment(tampered)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('signer')
    }
  })

  it('rejects an expired payment', async () => {
    const signed = await buildSigned({ validUntil: Math.floor(Date.now() / 1000) - 1 })
    const result = await verifyPayment(signed)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('expired')
    }
  })

  it('rejects an underpayment', async () => {
    const signed = await buildSigned({ amount: X402_REQUIRED_AMOUNT - 1n })
    const result = await verifyPayment(signed)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('amount')
    }
  })
})
