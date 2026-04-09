import { describe, it, expect } from 'vitest'
import { formatTokenAmount } from './index'


// Helper: create bigint from human-readable value
const toBigInt = (value: number, decimals: number): bigint =>
  BigInt(Math.round(value * 10 ** decimals))

describe('formatTokenAmount', () => {
  describe('zero and dust', () => {
    it('returns "0" for zero value', () => {
      expect(formatTokenAmount(0n, 18)).toBe('0')
    })

    it('returns dust indicator for very small values', () => {
      expect(formatTokenAmount(toBigInt(0.00001, 18), 18)).toBe('< 0.0001')
    })

    it('returns dust indicator at threshold boundary', () => {
      expect(formatTokenAmount(toBigInt(0.00009, 18), 18)).toBe('< 0.0001')
    })

    it('does not show dust for values at threshold', () => {
      const result = formatTokenAmount(toBigInt(0.0001, 18), 18)
      expect(result).not.toContain('<')
    })

    it('supports custom dust threshold', () => {
      expect(formatTokenAmount(toBigInt(0.001, 18), 18, { dustThreshold: 0.01 })).toBe('< 0.01')
    })
  })

  describe('progressive scaling', () => {
    it('shows 5 decimals for values 0-9', () => {
      const result = formatTokenAmount(toBigInt(1.23456, 18), 18)
      expect(result).toBe('1.23456')
    })

    it('shows 4 decimals for values 10-99', () => {
      const result = formatTokenAmount(toBigInt(12.3456, 18), 18)
      expect(result).toBe('12.3456')
    })

    it('shows 3 decimals for values 100-999', () => {
      const result = formatTokenAmount(toBigInt(123.456, 18), 18)
      expect(result).toBe('123.456')
    })

    it('shows 2 decimals with separators for 1,000-9,999', () => {
      const result = formatTokenAmount(toBigInt(1234.56, 18), 18, { locale: 'en-US' })
      expect(result).toBe('1,234.56')
    })

    it('shows k suffix for 10,000+', () => {
      const result = formatTokenAmount(toBigInt(12345, 18), 18, { locale: 'en-US' })
      expect(result).toBe('12.35k')
    })

    it('shows m suffix for 1,000,000+', () => {
      const result = formatTokenAmount(toBigInt(1234567, 18), 18, { locale: 'en-US' })
      expect(result).toBe('1.23m')
    })

    it('shows b suffix for 1,000,000,000+', () => {
      const result = formatTokenAmount(toBigInt(1234567890, 18), 18, { locale: 'en-US' })
      expect(result).toBe('1.23b')
    })
  })

  describe('different decimal tokens', () => {
    it('handles 6 decimals (USDC-like)', () => {
      const value = BigInt(1_234_567) // 1.234567 USDC
      expect(formatTokenAmount(value, 6)).toBe('1.23457')
    })

    it('handles 18 decimals (ETH-like)', () => {
      const value = BigInt('1500000000000000000') // 1.5 ETH
      const result = formatTokenAmount(value, 18)
      expect(result).toBe('1.5')
    })

    it('handles 0 decimals', () => {
      expect(formatTokenAmount(42n, 0)).toBe('42')
    })
  })

  describe('edge cases', () => {
    it('handles very large values', () => {
      const value = BigInt('100000000000000000000000000') // 100M ETH
      const result = formatTokenAmount(value, 18, { locale: 'en-US' })
      expect(result).toBe('100m')
    })

    it('handles negative values', () => {
      // Negative bigints are rare but possible
      const result = formatTokenAmount(-1500000000000000000n, 18)
      expect(result).toContain('-')
    })
  })
})
