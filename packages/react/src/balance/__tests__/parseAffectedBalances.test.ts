import { describe, it, expect } from 'vitest'

import parseAffectedBalances from '../parseAffectedBalances'


const TRANSFER_TOPIC: `0x${string}` = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const APPROVAL_TOPIC: `0x${string}` = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'

const sender: `0x${string}` = '0x1111111111111111111111111111111111111111'
const recipient: `0x${string}` = '0x2222222222222222222222222222222222222222'
const tokenA: `0x${string}` = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const tokenB: `0x${string}` = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const pad = (addr: `0x${string}`): `0x${string}` =>
  `0x000000000000000000000000${addr.slice(2)}` as `0x${string}`

const transferLog = (
  token: `0x${string}`,
  from: `0x${string}`,
  to: `0x${string}`,
  data: `0x${string}` = '0x01' as `0x${string}`
) => ({
  address: token,
  topics: [ TRANSFER_TOPIC, pad(from), pad(to) ] as `0x${string}`[],
  data,
})


describe('parseAffectedBalances', () => {

  it('should always include sender address for native balance (gas spend)', () => {
    const result = parseAffectedBalances([], sender)

    expect(result).toEqual([
      { address: sender, token: undefined },
    ])
  })

  it('should parse ERC-20 Transfer event and extract from, to, and token', () => {
    const logs = [
      transferLog(tokenA, sender, recipient),
    ]

    const result = parseAffectedBalances(logs, sender)

    expect(result).toEqual([
      { address: sender, token: undefined },     // native (gas)
      { address: sender, token: tokenA },         // from
      { address: recipient, token: tokenA },      // to
    ])
  })

  it('should handle multiple Transfer events from different tokens', () => {
    const logs = [
      transferLog(tokenA, sender, recipient),
      transferLog(tokenB, recipient, sender),
    ]

    const result = parseAffectedBalances(logs, sender)

    expect(result).toEqual([
      { address: sender, token: undefined },     // native (gas)
      { address: sender, token: tokenA },         // transfer 1 from
      { address: recipient, token: tokenA },      // transfer 1 to
      { address: recipient, token: tokenB },      // transfer 2 from
      { address: sender, token: tokenB },         // transfer 2 to
    ])
  })

  it('should ignore Approval events (not Transfer)', () => {
    const logs = [
      {
        address: tokenA,
        topics: [ APPROVAL_TOPIC, pad(sender), pad(recipient) ] as `0x${string}`[],
        data: '0xff' as `0x${string}`,
      },
    ]

    const result = parseAffectedBalances(logs, sender)

    // Only sender native balance (gas), no token entries from Approval
    expect(result).toEqual([
      { address: sender, token: undefined },
    ])
  })

  it('should deduplicate same address+token combinations', () => {
    const logs = [
      transferLog(tokenA, sender, recipient),
      transferLog(tokenA, sender, recipient, '0x02' as `0x${string}`),
    ]

    const result = parseAffectedBalances(logs, sender)

    // Deduplicated: sender native, sender+tokenA, recipient+tokenA
    expect(result).toEqual([
      { address: sender, token: undefined },
      { address: sender, token: tokenA },
      { address: recipient, token: tokenA },
    ])
  })

  it('should handle Transfer events with fewer than 3 topics (malformed)', () => {
    const logs = [
      {
        address: tokenA,
        topics: [ TRANSFER_TOPIC, pad(sender) ] as `0x${string}`[],
        data: '0x01' as `0x${string}`,
      },
    ]

    const result = parseAffectedBalances(logs, sender)

    // Only sender native, malformed Transfer ignored
    expect(result).toEqual([
      { address: sender, token: undefined },
    ])
  })

  it('should handle empty logs array', () => {
    const result = parseAffectedBalances([], sender)

    expect(result).toEqual([
      { address: sender, token: undefined },
    ])
  })
})
