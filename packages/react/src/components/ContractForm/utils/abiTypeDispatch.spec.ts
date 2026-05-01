import { describe, expect, it } from 'vitest'

import { getFieldType } from './abiTypeDispatch'


describe('getFieldType', () => {
  it('detects address', () => {
    expect(getFieldType('address')).toEqual({ fieldType: 'address' })
  })

  it('detects bool', () => {
    expect(getFieldType('bool')).toEqual({ fieldType: 'bool' })
  })

  it('detects string', () => {
    expect(getFieldType('string')).toEqual({ fieldType: 'string' })
  })

  it('detects dynamic bytes', () => {
    expect(getFieldType('bytes')).toEqual({ fieldType: 'bytes' })
  })

  it('classifies uint256 as uint with bitSize 256', () => {
    expect(getFieldType('uint256')).toEqual({ fieldType: 'uint', bitSize: 256 })
  })

  it('classifies uint8 with explicit bitSize', () => {
    expect(getFieldType('uint8')).toEqual({ fieldType: 'uint', bitSize: 8 })
  })

  it('classifies uint with no bit suffix as 256-bit (alias)', () => {
    expect(getFieldType('uint')).toEqual({ fieldType: 'uint', bitSize: 256 })
  })

  it('classifies signed int', () => {
    expect(getFieldType('int128')).toEqual({ fieldType: 'int', bitSize: 128 })
    expect(getFieldType('int')).toEqual({ fieldType: 'int', bitSize: 256 })
  })

  it('classifies bytesN with byteLength', () => {
    expect(getFieldType('bytes32')).toEqual({ fieldType: 'bytesN', byteLength: 32 })
    expect(getFieldType('bytes1')).toEqual({ fieldType: 'bytesN', byteLength: 1 })
  })

  it('detects tuple', () => {
    expect(getFieldType('tuple')).toEqual({ fieldType: 'tuple' })
  })

  it('detects tupleArray', () => {
    expect(getFieldType('tuple[]')).toEqual({ fieldType: 'tupleArray' })
    expect(getFieldType('tuple[3]')).toEqual({ fieldType: 'tupleArray' })
  })

  it('detects dynamic primitive arrays', () => {
    expect(getFieldType('uint256[]')).toEqual({
      fieldType: 'array',
      arrayElementType: 'uint256',
      arrayFixedLength: undefined,
    })
    expect(getFieldType('address[]')).toEqual({
      fieldType: 'array',
      arrayElementType: 'address',
      arrayFixedLength: undefined,
    })
  })

  it('detects fixed-length primitive arrays', () => {
    expect(getFieldType('bytes32[5]')).toEqual({
      fieldType: 'array',
      arrayElementType: 'bytes32',
      arrayFixedLength: 5,
    })
  })

  it('returns unsupported for unrecognized types', () => {
    expect(getFieldType('unknownThing')).toEqual({ fieldType: 'unsupported' })
    expect(getFieldType('mapping(address => uint256)')).toEqual({ fieldType: 'unsupported' })
  })
})
