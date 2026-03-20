import { maxUint256 } from 'viem'
import { describe, it, expect } from 'vitest'

import { isMaxApproval } from '../index'


describe('isMaxApproval', () => {
  it('returns true for maxUint256', () => {
    expect(isMaxApproval(maxUint256)).toBe(true)
  })

  it('returns false for zero', () => {
    expect(isMaxApproval(0n)).toBe(false)
  })

  it('returns false for normal amounts', () => {
    expect(isMaxApproval(1000000n)).toBe(false)
  })

  it('returns false for large but not max amount', () => {
    expect(isMaxApproval(maxUint256 - 1n)).toBe(false)
  })

  it('returns false for 1', () => {
    expect(isMaxApproval(1n)).toBe(false)
  })
})
