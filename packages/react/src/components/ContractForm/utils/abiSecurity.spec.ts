import { describe, it, expect } from 'vitest'
import { maxUint256 } from 'viem'

import { classifyApproval, getSecurityWarnings } from './abiSecurity'
import type { FieldDescriptor } from '../../../types/contract'


const amountField: FieldDescriptor = {
  name: 'amount',
  solidityType: 'uint256',
  fieldType: 'uint',
  isPayableValue: false,
}

const spenderField: FieldDescriptor = {
  name: 'spender',
  solidityType: 'address',
  fieldType: 'address',
  isPayableValue: false,
}


describe('classifyApproval', () => {
  it('returns unlimited for MAX_UINT256', () => {
    expect(classifyApproval(maxUint256, 0n)).toBe('unlimited')
    expect(classifyApproval(maxUint256, 100n)).toBe('unlimited')
  })

  it('returns safe when balance is 0n (fallback to MAX-only)', () => {
    expect(classifyApproval(1000000n, 0n)).toBe('safe')
    expect(classifyApproval(1n, 0n)).toBe('safe')
  })

  it('returns unlimited when amount > balance × 100', () => {
    const balance = 100n
    expect(classifyApproval(100_001n, balance)).toBe('unlimited')
    expect(classifyApproval(10_000_000n, balance)).toBe('unlimited')
  })

  it('returns large when amount > balance × 10 but ≤ balance × 100', () => {
    const balance = 100n
    expect(classifyApproval(1_001n, balance)).toBe('large')
    expect(classifyApproval(5_000n, balance)).toBe('large')
    expect(classifyApproval(10_000n, balance)).toBe('large')
  })

  it('returns safe when amount ≤ balance × 10', () => {
    const balance = 100n
    expect(classifyApproval(0n, balance)).toBe('safe')
    expect(classifyApproval(500n, balance)).toBe('safe')
    expect(classifyApproval(1_000n, balance)).toBe('safe')
  })

  it('handles exact threshold boundaries', () => {
    const balance = 100n
    expect(classifyApproval(balance * 10n, balance)).toBe('safe')
    expect(classifyApproval(balance * 10n + 1n, balance)).toBe('large')
    expect(classifyApproval(balance * 100n, balance)).toBe('large')
    expect(classifyApproval(balance * 100n + 1n, balance)).toBe('unlimited')
  })

  it('handles small balance values', () => {
    expect(classifyApproval(11n, 1n)).toBe('large')
    expect(classifyApproval(101n, 1n)).toBe('unlimited')
  })
})


describe('getSecurityWarnings - approval risk tiers', () => {
  const values = { spender: '0x0000000000000000000000000000000000000001', amount: '' }
  const fields = [ spenderField, amountField ]

  it('emits danger warning for MAX approval regardless of balance', () => {
    const warnings = getSecurityWarnings('approve', { ...values, amount: maxUint256.toString() }, fields, 0n)
    const dangerWarning = warnings.find((w) => w.level === 'danger' && w.message.includes('Unlimited'))
    expect(dangerWarning).toBeDefined()
  })

  it('emits danger for amount > balance × 100', () => {
    const balance = 100n
    const warnings = getSecurityWarnings('approve', { ...values, amount: '1000000' }, fields, balance)
    expect(warnings.find((w) => w.level === 'danger' && w.message.includes('Unlimited'))).toBeDefined()
  })

  it('emits warning for amount > balance × 10 but not unlimited', () => {
    const balance = 100n
    const warnings = getSecurityWarnings('approve', { ...values, amount: '5000' }, fields, balance)
    const largeWarning = warnings.find((w) => w.level === 'warning' && w.message.includes('10×'))
    expect(largeWarning).toBeDefined()
    expect(warnings.find((w) => w.message.includes('Unlimited'))).toBeUndefined()
  })

  it('no approval warning for safe amount', () => {
    const balance = 100n
    const warnings = getSecurityWarnings('approve', { ...values, amount: '500' }, fields, balance)
    expect(warnings.find((w) => w.message.includes('10×'))).toBeUndefined()
    expect(warnings.find((w) => w.message.includes('Unlimited'))).toBeUndefined()
  })

  it('no approval warning for non-approve function', () => {
    const warnings = getSecurityWarnings('transfer', { ...values, amount: maxUint256.toString() }, fields, 100n)
    expect(warnings.find((w) => w.message.includes('10×'))).toBeUndefined()
    expect(warnings.find((w) => w.message.includes('Unlimited'))).toBeUndefined()
  })

  it('balance=0n falls back to MAX-only detection', () => {
    const warnings = getSecurityWarnings('approve', { ...values, amount: '100000000' }, fields, 0n)
    expect(warnings.find((w) => w.message.includes('Unlimited'))).toBeUndefined()
  })

  it('skips amount check for invalid BigInt input', () => {
    const warnings = getSecurityWarnings('approve', { ...values, amount: 'not-a-number' }, fields, 100n)
    expect(warnings.find((w) => w.message.includes('10×'))).toBeUndefined()
  })
})
