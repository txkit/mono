import { describe, expect, it } from 'vitest'
import { erc20Abi } from 'viem'
import type { AbiFunction } from 'viem'

import { getAbiFunction, buildFields, getInitialValues } from './abiExtraction'


describe('getAbiFunction', () => {
  it('returns the matching ABI function for a write call', () => {
    const result = getAbiFunction(erc20Abi, 'approve')
    expect(result.fn?.name).toBe('approve')
    expect(result.error).toBeUndefined()
  })

  it('returns an error when the function is not in the ABI', () => {
    const result = getAbiFunction(erc20Abi, 'doesNotExist')
    expect(result.fn).toBeUndefined()
    expect(result.error).toContain('not found')
  })

  it('rejects view functions (read-only) - they are not write surface', () => {
    const result = getAbiFunction(erc20Abi, 'balanceOf')
    expect(result.fn).toBeUndefined()
    expect(result.error).toContain('view/pure')
  })

  it('rejects pure functions', () => {
    const pureAbi = [
      {
        type: 'function',
        name: 'add',
        stateMutability: 'pure',
        inputs: [{ name: 'a', type: 'uint256' }, { name: 'b', type: 'uint256' }],
        outputs: [{ type: 'uint256' }],
      },
    ] as const
    const result = getAbiFunction(pureAbi, 'add')
    expect(result.error).toContain('view/pure')
  })

  it('reports overloaded functions instead of guessing', () => {
    const overloadedAbi = [
      {
        type: 'function',
        name: 'doIt',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'x', type: 'uint256' }],
        outputs: [],
      },
      {
        type: 'function',
        name: 'doIt',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'x', type: 'uint256' }, { name: 'y', type: 'address' }],
        outputs: [],
      },
    ] as const
    const result = getAbiFunction(overloadedAbi, 'doIt')
    expect(result.error).toContain('overloaded')
  })
})


describe('buildFields', () => {
  it('extracts a flat field per primitive ABI input', () => {
    const fn = (erc20Abi as ReadonlyArray<AbiFunction>).find((item) => item.name === 'approve')
    if (!fn) {
      throw new Error('expected approve in erc20Abi')
    }
    const fields = buildFields(fn)
    expect(fields).toHaveLength(2)
    expect(fields[0]?.solidityType).toBe('address')
    expect(fields[1]?.solidityType).toBe('uint256')
  })

  it('prepends a __value__ field for payable functions', () => {
    const payableAbi = [
      {
        type: 'function',
        name: 'deposit',
        stateMutability: 'payable',
        inputs: [{ name: 'recipient', type: 'address' }],
        outputs: [],
      },
    ] as const
    const fn = payableAbi[0] as AbiFunction
    const fields = buildFields(fn)
    expect(fields).toHaveLength(2)
    expect(fields[0]?.name).toBe('__value__')
    expect(fields[0]?.isPayableValue).toBe(true)
    expect(fields[1]?.name).toBe('recipient')
  })

  it('uses arg{index} when an input is unnamed', () => {
    const anonymousAbi: AbiFunction = {
      type: 'function',
      name: 'noop',
      stateMutability: 'nonpayable',
      inputs: [
        { name: '', type: 'uint256' },
      ],
      outputs: [],
    }
    const fields = buildFields(anonymousAbi)
    expect(fields[0]?.name).toBe('arg0')
  })
})


describe('getInitialValues', () => {
  it('seeds bool fields to "false" and everything else to ""', () => {
    const fields = [
      { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
      { name: 'enabled', solidityType: 'bool', fieldType: 'bool' },
      { name: 'recipient', solidityType: 'address', fieldType: 'address' },
    ] as const
    const values = getInitialValues(fields as never)
    expect(values).toEqual({
      amount: '',
      enabled: 'false',
      recipient: '',
    })
  })

  it('returns an empty object for an empty field set', () => {
    expect(getInitialValues([])).toEqual({})
  })
})
