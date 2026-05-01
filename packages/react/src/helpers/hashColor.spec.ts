import { describe, expect, it } from 'vitest'

import hashColor, { hashGradient, hashPixelAvatar } from './hashColor'


describe('hashColor', () => {
  it('returns a deterministic CSS HSL string', () => {
    const result = hashColor('alice')
    expect(result).toMatch(/^hsl\(\d{1,3}, 55%, 45%\)$/)
  })

  it('produces the same color for the same input', () => {
    expect(hashColor('alice')).toBe(hashColor('alice'))
  })

  it('produces different colors for different inputs (probabilistic)', () => {
    expect(hashColor('alice')).not.toBe(hashColor('bob-very-different'))
  })

  it('handles empty input without throwing', () => {
    expect(hashColor('')).toMatch(/^hsl\(\d{1,3}, 55%, 45%\)$/)
  })

  it('keeps hue inside [0, 360)', () => {
    for (const value of [ 'a', 'aa', 'aaa', 'long-string', '0xdeadbeef' ]) {
      const match = hashColor(value).match(/hsl\((\d+),/)
      const hue = Number(match?.[1])
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })
})


describe('hashGradient', () => {
  it('returns a CSS linear-gradient with two HSL stops', () => {
    const result = hashGradient('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
    expect(result).toMatch(/^linear-gradient\(135deg, hsl\(\d{1,3}, 70%, 60%\), hsl\(\d{1,3}, 70%, 50%\)\)$/)
  })

  it('is deterministic for the same address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    expect(hashGradient(address)).toBe(hashGradient(address))
  })

  it('strips an optional 0x prefix', () => {
    expect(hashGradient('1234567890abcdef'))
      .toBe(hashGradient('0x1234567890abcdef'))
  })

  it('falls back to hue 0 when bytes are unparsable', () => {
    expect(hashGradient('0x')).toContain('hsl(0,')
  })
})


describe('hashPixelAvatar', () => {
  it('returns a 5x5 symmetric pattern', () => {
    const avatar = hashPixelAvatar('0xdeadbeef')
    expect(avatar.pattern).toHaveLength(5)
    for (const row of avatar.pattern) {
      expect(row).toHaveLength(5)
      // mirror invariant: col0 === col4, col1 === col3
      expect(row[0]).toBe(row[4])
      expect(row[1]).toBe(row[3])
    }
  })

  it('returns deterministic colors for the same address', () => {
    const a = hashPixelAvatar('0x1234567890abcdef')
    const b = hashPixelAvatar('0x1234567890abcdef')
    expect(a.foreground).toBe(b.foreground)
    expect(a.background).toBe(b.background)
  })

  it('foreground and background hues are 180° apart', () => {
    const avatar = hashPixelAvatar('0xabcd')
    const fg = Number(avatar.foreground.match(/hsl\((\d+)/)?.[1] ?? -1)
    const bg = Number(avatar.background.match(/hsl\((\d+)/)?.[1] ?? -1)
    expect(((bg - fg) + 360) % 360).toBe(180)
  })

  it('pads short input to 40 chars without throwing', () => {
    expect(() => hashPixelAvatar('0x1')).not.toThrow()
  })
})
