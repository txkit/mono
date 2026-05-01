import { describe, expect, it } from 'vitest'

import { shortenAddress, getExplorerUrl } from './address'


describe('shortenAddress', () => {
  it('truncates a full 42-char hex address with 4 chars on each side by default', () => {
    expect(shortenAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678')
  })

  it('honors the chars override', () => {
    expect(shortenAddress('0x1234567890abcdef1234567890abcdef12345678', 6)).toBe('0x123456...345678')
  })

  it('returns an empty string for empty / null-ish input', () => {
    expect(shortenAddress('')).toBe('')
  })

  it('returns input unchanged when shorter than 2*chars + 2 (length guard)', () => {
    // 4*2 + 2 = 10. Anything strictly below 10 chars must not be truncated
    // because slicing would otherwise produce a string longer than the input.
    expect(shortenAddress('0xabc')).toBe('0xabc')
    expect(shortenAddress('0x1234567')).toBe('0x1234567')
  })

  it('truncates at the threshold (length === 2*chars + 2)', () => {
    // length 10 == threshold 10. The current implementation truncates here.
    expect(shortenAddress('0xabcdef12')).toBe('0xabcd...ef12')
  })

  it('preserves checksum casing (does not lowercase)', () => {
    expect(shortenAddress('0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa')).toBe('0xAaAa...AaAa')
  })

  it('respects very small chars values', () => {
    expect(shortenAddress('0x1234567890abcdef1234567890abcdef12345678', 1)).toBe('0x1...8')
  })
})


describe('getExplorerUrl', () => {
  it('builds a tx URL by default for mainnet', () => {
    expect(getExplorerUrl(1, '0xdeadbeef')).toBe('https://etherscan.io/tx/0xdeadbeef')
  })

  it('builds an address URL when type=address', () => {
    expect(getExplorerUrl(1, '0xabc', 'address')).toBe('https://etherscan.io/address/0xabc')
  })

  it('returns undefined for an unknown chain id', () => {
    expect(getExplorerUrl(99999, '0xdeadbeef')).toBeUndefined()
  })

  it('returns undefined for chain id 0', () => {
    expect(getExplorerUrl(0, '0xdeadbeef')).toBeUndefined()
  })

  it('covers L2 mainnets (Optimism, Arbitrum, Base, Polygon)', () => {
    expect(getExplorerUrl(10, '0x1')).toContain('optimistic.etherscan.io')
    expect(getExplorerUrl(42161, '0x1')).toContain('arbiscan.io')
    expect(getExplorerUrl(8453, '0x1')).toContain('basescan.org')
    expect(getExplorerUrl(137, '0x1')).toContain('polygonscan.com')
  })

  it('covers Sepolia and L2 testnets', () => {
    expect(getExplorerUrl(11155111, '0x1')).toContain('sepolia.etherscan.io')
    expect(getExplorerUrl(11155420, '0x1')).toContain('sepolia-optimism.etherscan.io')
    expect(getExplorerUrl(84532, '0x1')).toContain('sepolia.basescan.org')
    expect(getExplorerUrl(421614, '0x1')).toContain('sepolia.arbiscan.io')
    expect(getExplorerUrl(80002, '0x1')).toContain('amoy.polygonscan.com')
  })

  it('covers other supported mainnets (Blast, Linea, Scroll, zkSync, Mantle, Mode, Unichain)', () => {
    expect(getExplorerUrl(81457, '0x1')).toContain('blastscan.io')
    expect(getExplorerUrl(59144, '0x1')).toContain('lineascan.build')
    expect(getExplorerUrl(534352, '0x1')).toContain('scrollscan.com')
    expect(getExplorerUrl(324, '0x1')).toContain('zksync.io')
    expect(getExplorerUrl(5000, '0x1')).toContain('mantlescan.xyz')
    expect(getExplorerUrl(34443, '0x1')).toContain('mode.network')
    expect(getExplorerUrl(130, '0x1')).toContain('uniscan.xyz')
  })
})
