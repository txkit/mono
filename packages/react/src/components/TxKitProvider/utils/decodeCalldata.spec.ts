import { describe, expect, it } from 'vitest'
import { erc20Abi } from 'viem'

import { isContractCall, decodeCalldata } from './decodeCalldata'


const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const TOKEN = '0x1111111111111111111111111111111111111111' as const
const SPENDER = '0x2222222222222222222222222222222222222222' as const


describe('isContractCall', () => {
  it('returns true when tx carries an abi', () => {
    expect(isContractCall({
      address: TOKEN,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ SPENDER, 100n ],
    })).toBe(true)
  })

  it('returns false for raw transactions', () => {
    expect(isContractCall({ to: ZERO_ADDRESS, value: 1n })).toBe(false)
  })

  it('returns false for raw transactions with pre-encoded calldata', () => {
    expect(isContractCall({ to: ZERO_ADDRESS, data: '0xabcd' })).toBe(false)
  })
})


describe('decodeCalldata', () => {
  it('returns undefined for raw transactions (no ABI to decode against)', () => {
    expect(decodeCalldata({ to: ZERO_ADDRESS, value: 1n })).toBeUndefined()
  })

  it('decodes an ERC-20 approve call (param names match the on-chain ABI)', () => {
    const result = decodeCalldata({
      address: TOKEN,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ SPENDER, 100n ],
    })
    expect(result?.functionName).toBe('approve')
    expect(result?.args).toHaveLength(2)
    expect(result?.args[0]?.type).toBe('address')
    expect(result?.args[0]?.value).toBe(SPENDER)
    expect(result?.args[1]?.type).toBe('uint256')
    expect(result?.args[1]?.value).toBe(100n)
  })

  it('decodes a transfer call', () => {
    const result = decodeCalldata({
      address: TOKEN,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [ SPENDER, 250n ],
    })
    expect(result?.functionName).toBe('transfer')
    expect(result?.args[0]?.type).toBe('address')
    expect(result?.args[0]?.value).toBe(SPENDER)
    expect(result?.args[1]?.value).toBe(250n)
  })

  it('uses arg{index} as a fallback name when ABI input has no name property', () => {
    // Note: viem's parseAbi ignores empty-string names when reconstructing
    // typed inputs, so for the fallback to kick in the descriptor must be
    // missing the name field outright.
    const anonymousAbi = [
      {
        type: 'function',
        name: 'mystery',
        stateMutability: 'nonpayable',
        inputs: [
          { type: 'uint256' },
        ],
        outputs: [],
      },
    ] as const
    const result = decodeCalldata({
      address: TOKEN,
      abi: anonymousAbi,
      functionName: 'mystery',
      args: [ 1n ],
    })
    expect(result?.args[0]?.name).toBe('arg0')
  })

  it('returns undefined when args do not match the ABI shape (encode throws)', () => {
    const result = decodeCalldata({
      address: TOKEN,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ SPENDER ],
    })
    expect(result).toBeUndefined()
  })

  it('handles zero-arg functions', () => {
    const noopAbi = [
      {
        type: 'function',
        name: 'noop',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
      },
    ] as const
    const result = decodeCalldata({
      address: TOKEN,
      abi: noopAbi,
      functionName: 'noop',
      args: [],
    })
    expect(result?.functionName).toBe('noop')
    expect(result?.args).toHaveLength(0)
  })
})
