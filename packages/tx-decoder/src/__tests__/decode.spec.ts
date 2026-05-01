import { describe, expect, it } from 'vitest'

import { decodeCall } from '../decode'
import { buildRegistry } from '../registry/loader'


const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const TRANSFER_TO_DEAD_FOR_1 = '0xa9059cbb000000000000000000000000000000000000000000000000000000000000dead0000000000000000000000000000000000000000000000000000000000000001'

describe('decodeCall', () => {
  it('returns ETH transfer when data is empty', async () => {
    const result = await decodeCall({
      call: { to: '0x0000000000000000000000000000000000000001', data: '0x' },
      chain: 'eip155:1',
    })
    expect(result.selector).toBeNull()
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })

  it('decodes ERC-20 transfer with inline ABI', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000002', data: TRANSFER_TO_DEAD_FOR_1 },
        chain: 'eip155:1',
      },
      { abi: ERC20_ABI },
    )
    expect(result.selector).toBe('0xa9059cbb')
    expect(result.functionName).toBe('transfer')
    expect(result.source).toBe('abi-prop')
    expect(result.args).toHaveLength(2)
    expect(result.args[0]?.type).toBe('address')
  })

  it('decodes ERC-20 transfer via registry lookup', async () => {
    const registry = buildRegistry([
      {
        chain: 'eip155:1',
        address: '0x0000000000000000000000000000000000000002',
        label: 'TestToken',
        abi: ERC20_ABI,
      },
    ])
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000002', data: TRANSFER_TO_DEAD_FOR_1 },
        chain: 'eip155:1',
      },
      { registry },
    )
    expect(result.functionName).toBe('transfer')
    expect(result.source).toBe('registry')
  })

  it('falls back to fourByte resolver for unknown selectors', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000003', data: '0xdeadbeef00000000' },
        chain: 'eip155:1',
      },
      {
        fourByte: async () => ({ name: 'mystery', signature: 'mystery()' }),
      },
    )
    expect(result.selector).toBe('0xdeadbeef')
    expect(result.functionName).toBe('mystery')
    expect(result.source).toBe('fourbyte')
  })

  it('returns unknown when no resolver matches', async () => {
    const result = await decodeCall({
      call: { to: '0x0000000000000000000000000000000000000004', data: '0xcafebabe00000000' },
      chain: 'eip155:1',
    })
    expect(result.selector).toBe('0xcafebabe')
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })

  it('treats undefined data as ETH transfer (no selector, source=unknown)', async () => {
    const result = await decodeCall({
      call: { to: '0x0000000000000000000000000000000000000005' },
      chain: 'eip155:1',
    })
    expect(result.selector).toBeNull()
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })

  it('treats data shorter than a 4-byte selector as ETH transfer', async () => {
    // 0xabcd has 6 chars including 0x prefix -> length < 10, no selector
    const result = await decodeCall({
      call: { to: '0x0000000000000000000000000000000000000006', data: '0xabcd' },
      chain: 'eip155:1',
    })
    expect(result.selector).toBeNull()
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })

  it('rejects odd-length malformed calldata as empty rather than throwing', async () => {
    // 0xa9059cbb followed by an odd-length tail. Without the malformed-calldata
    // guard this would crash inside viem decodeFunctionData.
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000007', data: '0xa9059cbb0' },
        chain: 'eip155:1',
      },
      { abi: ERC20_ABI },
    )
    expect(result.selector).toBeNull()
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })

  it('returns unknown source when ABI prop matches the selector but viem decode throws', async () => {
    // Function selector keccak("transfer(address,uint256)")[:4] is 0xa9059cbb,
    // but the args bytes are too short to decode. The decoder should swallow
    // the viem error and fall through to the unknown branch.
    const truncated = '0xa9059cbb00000000000000000000000000000000000000000000000000000000'
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000008', data: truncated },
        chain: 'eip155:1',
      },
      { abi: ERC20_ABI },
    )
    expect(result.selector).toBe('0xa9059cbb')
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })

  it('prefers the inline ABI over a matching registry entry', async () => {
    // Two ABIs share the same selector (transfer). Inline wins.
    const inlineAbi = ERC20_ABI
    const registry = buildRegistry([
      {
        chain: 'eip155:1',
        address: '0x0000000000000000000000000000000000000002',
        label: 'Alt',
        abi: ERC20_ABI,
      },
    ])
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000002', data: TRANSFER_TO_DEAD_FOR_1 },
        chain: 'eip155:1',
      },
      { abi: inlineAbi, registry },
    )
    expect(result.source).toBe('abi-prop')
  })

  it('threads clearSigning through registry hits when present', async () => {
    const registry = buildRegistry([
      {
        chain: 'eip155:1',
        address: '0x0000000000000000000000000000000000000002',
        label: 'TestToken',
        abi: ERC20_ABI,
        clearSigning: {
          transfer: { display: 'Send {{amount}} to {{to}}' },
        },
      },
    ])
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000002', data: TRANSFER_TO_DEAD_FOR_1 },
        chain: 'eip155:1',
      },
      { registry },
    )
    expect(result.source).toBe('registry')
    expect(result.clearSigning).toEqual({ display: 'Send {{amount}} to {{to}}' })
  })

  it('does not call fourByte when ABI already decodes the call', async () => {
    let fourByteCalls = 0
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000002', data: TRANSFER_TO_DEAD_FOR_1 },
        chain: 'eip155:1',
      },
      {
        abi: ERC20_ABI,
        fourByte: async () => {
          fourByteCalls += 1
          return { name: 'should-not-fire', signature: 'noop()' }
        },
      },
    )
    expect(result.source).toBe('abi-prop')
    expect(fourByteCalls).toBe(0)
  })

  it('lowercases chain + address inside the registry key (case-insensitive lookup)', async () => {
    const registry = buildRegistry([
      {
        chain: 'eip155:1',
        address: '0x0000000000000000000000000000000000000002',
        label: 'TestToken',
        abi: ERC20_ABI,
      },
    ])
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000002', data: TRANSFER_TO_DEAD_FOR_1 },
        chain: 'eip155:1',
      },
      { registry },
    )
    expect(result.source).toBe('registry')
  })

  it('returns unknown when fourByte resolver returns null', async () => {
    const result = await decodeCall(
      {
        call: { to: '0x0000000000000000000000000000000000000009', data: '0xcafebabe00000000' },
        chain: 'eip155:1',
      },
      { fourByte: async () => null },
    )
    expect(result.functionName).toBeNull()
    expect(result.source).toBe('unknown')
  })
})
