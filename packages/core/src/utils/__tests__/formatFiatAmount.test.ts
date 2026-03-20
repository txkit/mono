import { describe, it, expect } from 'vitest'
import { formatFiatAmount } from '../index'


describe('formatFiatAmount', () => {
  it('formats USD by default', () => {
    expect(formatFiatAmount(1234.56)).toBe('$1,234.56')
  })

  it('formats EUR', () => {
    const result = formatFiatAmount(1234.56, 'EUR', 'en-US')
    expect(result).toContain('1,234.56')
    expect(result).toContain('€')
  })

  it('formats GBP', () => {
    const result = formatFiatAmount(1234.56, 'GBP', 'en-US')
    expect(result).toContain('1,234.56')
    expect(result).toContain('£')
  })

  it('rounds to 2 decimals', () => {
    expect(formatFiatAmount(1234.5678)).toBe('$1,234.57')
  })

  it('handles zero', () => {
    expect(formatFiatAmount(0)).toBe('$0.00')
  })

  it('handles very small amounts', () => {
    const result = formatFiatAmount(0.001)
    expect(result).toBe('$0.00')
  })

  it('handles large amounts', () => {
    const result = formatFiatAmount(1234567.89)
    expect(result).toBe('$1,234,567.89')
  })

  it('respects locale for separators', () => {
    const result = formatFiatAmount(1234.56, 'EUR', 'de-DE')
    // German: period for thousands, comma for decimal
    expect(result).toMatch(/1\.234,56/)
  })
})
