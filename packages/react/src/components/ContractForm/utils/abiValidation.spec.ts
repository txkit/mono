import { describe, expect, it } from 'vitest'

import { validateFormat, validateFull, parseFieldValue, buildArgs, extractValue, bigIntReplacer } from './abiValidation'
import type { FieldDescriptor } from '../../../types/contract'


const addressField: FieldDescriptor = { name: 'recipient', solidityType: 'address', fieldType: 'address' }
const uintField: FieldDescriptor = { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 }
const intField: FieldDescriptor = { name: 'delta', solidityType: 'int128', fieldType: 'int', bitSize: 128 }
const boolField: FieldDescriptor = { name: 'enabled', solidityType: 'bool', fieldType: 'bool' }
const stringField: FieldDescriptor = { name: 'memo', solidityType: 'string', fieldType: 'string' }
const bytesField: FieldDescriptor = { name: 'data', solidityType: 'bytes', fieldType: 'bytes' }
const bytes32Field: FieldDescriptor = { name: 'leaf', solidityType: 'bytes32', fieldType: 'bytesN', byteLength: 32 }
const arrayField: FieldDescriptor = {
  name: 'amounts',
  solidityType: 'uint256[]',
  fieldType: 'array',
  arrayElementType: 'uint256',
}
const fixedArrayField: FieldDescriptor = {
  name: 'amounts',
  solidityType: 'uint256[3]',
  fieldType: 'array',
  arrayElementType: 'uint256',
  arrayFixedLength: 3,
}
const payableField: FieldDescriptor = {
  name: '__value__',
  solidityType: 'uint256',
  fieldType: 'uint',
  bitSize: 256,
  isPayableValue: true,
}
const tupleField: FieldDescriptor = {
  name: 'pair',
  solidityType: 'tuple',
  fieldType: 'tuple',
  components: [
    { name: 'token', solidityType: 'address', fieldType: 'address' },
    { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
  ],
}


describe('validateFormat', () => {
  it('returns null for empty values (validateFormat is the lighter onChange check)', () => {
    expect(validateFormat('', addressField)).toBeNull()
  })

  it('accepts a partial address prefix while typing', () => {
    expect(validateFormat('0x12', addressField)).toBeNull()
  })

  it('rejects non-hex characters in an address', () => {
    expect(validateFormat('zzzz', addressField)).toBe('Invalid address format')
  })

  it('rejects negative integers in a uint field', () => {
    expect(validateFormat('-1', uintField)).toBe('Only positive numbers allowed')
  })

  it('accepts negative integers in an int field', () => {
    expect(validateFormat('-100', intField)).toBeNull()
  })

  it('rejects non-numeric input in numeric fields', () => {
    expect(validateFormat('abc', uintField)).toBe('Only positive numbers allowed')
  })

  it('rejects unparseable JSON for array / tuple fields', () => {
    expect(validateFormat('not-json', arrayField)).toBe('Invalid JSON format')
    expect(validateFormat('{', tupleField)).toBe('Invalid JSON format')
  })

  it('passes through bool / string fields without restriction', () => {
    expect(validateFormat('anything', boolField)).toBeNull()
    expect(validateFormat('hello', stringField)).toBeNull()
  })

  it('accepts a partial decimal in a payable value', () => {
    expect(validateFormat('1.5', payableField)).toBeNull()
  })
})


describe('validateFull', () => {
  it('reports Required for empty values', () => {
    expect(validateFull('', addressField)).toBe('Required')
  })

  it('accepts a valid checksummed address', () => {
    expect(validateFull('0x000000000000000000000000000000000000dead', addressField)).toBeNull()
  })

  it('rejects an address shorter than 42 chars', () => {
    expect(validateFull('0xabc', addressField)).toContain('42 characters')
  })

  it('rejects a uint that overflows the configured bitSize', () => {
    const uint8: FieldDescriptor = { name: 'tiny', solidityType: 'uint8', fieldType: 'uint', bitSize: 8 }
    expect(validateFull('256', uint8)).toContain('out of range')
    expect(validateFull('255', uint8)).toBeNull()
  })

  it('rejects negative uint values', () => {
    expect(validateFull('-1', uintField)).toBe('Must be a positive number')
  })

  it('accepts an int128 within range and rejects values outside', () => {
    expect(validateFull('100', intField)).toBeNull()
    expect(validateFull('170141183460469231731687303715884105728', intField)).toContain('out of range')
  })

  it('requires bool to be exactly "true" or "false"', () => {
    expect(validateFull('true', boolField)).toBeNull()
    expect(validateFull('TRUE', boolField)).toBe('Must be true or false')
  })

  it('validates dynamic bytes (must start with 0x and have even length)', () => {
    expect(validateFull('0xabcd', bytesField)).toBeNull()
    expect(validateFull('abcd', bytesField)).toContain('Must start with 0x')
    expect(validateFull('0xabc', bytesField)).toContain('even length')
  })

  it('validates fixed bytesN (exact hex length)', () => {
    const value = '0x' + 'a'.repeat(64)
    expect(validateFull(value, bytes32Field)).toBeNull()
    expect(validateFull('0xabcd', bytes32Field)).toContain('Expected 32 bytes')
  })

  it('enforces fixed array length', () => {
    expect(validateFull('["1","2","3"]', fixedArrayField)).toBeNull()
    expect(validateFull('["1","2"]', fixedArrayField)).toContain('exactly 3')
  })

  it('reports inner element errors for arrays', () => {
    expect(validateFull('["1","abc","3"]', arrayField)).toContain('Item [1]')
  })

  it('rejects payable values with too many decimals', () => {
    expect(validateFull('0.0000000000000000001', payableField)).toContain('Precision exceeds 18')
  })

  it('rejects negative payable values', () => {
    expect(validateFull('-1', payableField)).toBe('Must be a positive number')
  })

  it('reports missing tuple components', () => {
    expect(validateFull('{}', tupleField)).toContain('Missing field')
  })

  it('reports inner tuple errors', () => {
    expect(validateFull('{"token":"0xabc","amount":"100"}', tupleField)).toContain('token:')
  })
})


describe('parseFieldValue', () => {
  it('returns the address string unchanged', () => {
    expect(parseFieldValue('0xdead', addressField)).toBe('0xdead')
  })

  it('parses uint to BigInt', () => {
    expect(parseFieldValue('100', uintField)).toBe(100n)
  })

  it('parses signed int to BigInt', () => {
    expect(parseFieldValue('-100', intField)).toBe(-100n)
  })

  it('parses bool to JS boolean', () => {
    expect(parseFieldValue('true', boolField)).toBe(true)
    expect(parseFieldValue('false', boolField)).toBe(false)
  })

  it('parses payable value to wei via parseEther', () => {
    expect(parseFieldValue('1', payableField)).toBe(10n ** 18n)
  })

  it('parses an array of uint strings into BigInts', () => {
    expect(parseFieldValue('["1","2","3"]', arrayField)).toEqual([ 1n, 2n, 3n ])
  })

  it('parses a tuple into a record with typed components', () => {
    const result = parseFieldValue('{"token":"0xdead","amount":"100"}', tupleField) as Record<string, unknown>
    expect(result.token).toBe('0xdead')
    expect(result.amount).toBe(100n)
  })
})


describe('buildArgs and extractValue', () => {
  it('buildArgs skips the payable value field and parses the rest', () => {
    const fields = [ payableField, addressField, uintField ]
    const values = { __value__: '1', recipient: '0xdead', amount: '100' }
    expect(buildArgs(values, fields)).toEqual([ '0xdead', 100n ])
  })

  it('extractValue parses the payable field as ETH', () => {
    expect(extractValue({ __value__: '1' }, [ payableField, addressField ])).toBe(10n ** 18n)
  })

  it('extractValue returns undefined when no payable field exists', () => {
    expect(extractValue({}, [ addressField, uintField ])).toBeUndefined()
  })

  it('extractValue returns undefined when the payable field is empty', () => {
    expect(extractValue({ __value__: '' }, [ payableField ])).toBeUndefined()
  })
})


describe('bigIntReplacer', () => {
  it('serializes BigInt as a decimal string', () => {
    expect(JSON.stringify({ amount: 100n }, bigIntReplacer)).toBe('{"amount":"100"}')
  })

  it('passes through other values', () => {
    expect(JSON.stringify({ a: 1, b: 'x', c: true }, bigIntReplacer)).toBe('{"a":1,"b":"x","c":true}')
  })
})
