import { describe, it, expect } from 'vitest'
import { formatDecodedCalldata } from '../index'

import type { DecodedCalldata } from '../../types'


describe('formatDecodedCalldata', () => {
  it('formats a simple transfer call', () => {
    const decoded: DecodedCalldata = {
      functionName: 'transfer',
      args: [
        { name: 'to', type: 'address', value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
        { name: 'amount', type: 'uint256', value: 1000000n },
      ],
    }

    const result = formatDecodedCalldata(decoded)
    expect(result).toContain('transfer(')
    expect(result).toContain('to (address)')
    expect(result).toContain('0xd8dA...6045')
    expect(result).toContain('amount (uint256): 1000000')
  })

  it('formats a call with no args', () => {
    const decoded: DecodedCalldata = {
      functionName: 'totalSupply',
      args: [],
    }

    const result = formatDecodedCalldata(decoded)
    expect(result).toContain('totalSupply(')
  })

  it('formats boolean args', () => {
    const decoded: DecodedCalldata = {
      functionName: 'setApproval',
      args: [
        { name: 'approved', type: 'bool', value: true },
      ],
    }

    const result = formatDecodedCalldata(decoded)
    expect(result).toContain('approved (bool): true')
  })

  it('shortens addresses', () => {
    const decoded: DecodedCalldata = {
      functionName: 'approve',
      args: [
        { name: 'spender', type: 'address', value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
        { name: 'amount', type: 'uint256', value: 500000000n },
      ],
    }

    const result = formatDecodedCalldata(decoded)
    expect(result).toContain('0xA0b8...eB48')
    expect(result).not.toContain('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  })

  it('converts bigint values to string', () => {
    const decoded: DecodedCalldata = {
      functionName: 'deposit',
      args: [
        { name: 'value', type: 'uint256', value: 123456789012345678901234n },
      ],
    }

    const result = formatDecodedCalldata(decoded)
    expect(result).toContain('123456789012345678901234')
  })
})
