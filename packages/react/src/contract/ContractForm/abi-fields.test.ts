import { describe, it, expect } from 'vitest'
import type { Abi } from 'viem'
import { maxUint256 } from 'viem'

import {
  getFieldType,
  getAbiFunction,
  buildFields,
  getInitialValues,
  parseFieldValue,
  buildArgs,
  extractValue,
  validateFormat,
  validateFull,
  validateAllFields,
  isDangerousFunction,
  getSecurityWarnings,
  buildCalldataPreview,
} from './abi-fields'
import type { FieldDescriptor } from '../types'


// --- Test ABI Fixtures ---

const erc20Abi: Abi = [
  {
    type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
]

const overloadedAbi: Abi = [
  {
    type: 'function', name: 'swap', stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function', name: 'swap', stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
]

const allTypesAbi: Abi = [
  {
    type: 'function', name: 'allTypes', stateMutability: 'nonpayable',
    inputs: [
      { name: 'addr', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'small', type: 'uint8' },
      { name: 'signed', type: 'int128' },
      { name: 'flag', type: 'bool' },
      { name: 'text', type: 'string' },
      { name: 'data', type: 'bytes' },
      { name: 'hash', type: 'bytes32' },
      { name: 'shortBytes', type: 'bytes4' },
    ],
    outputs: [],
  },
]

const payableAbi: Abi = [
  {
    type: 'function', name: 'deposit', stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
]

const unnamedAbi: Abi = [
  {
    type: 'function', name: 'unnamed', stateMutability: 'nonpayable',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' },
    ],
    outputs: [],
  },
]


// --- Section A: Type Dispatch ---

describe('getFieldType', () => {

  it('should map address to address', () => {
    expect(getFieldType('address').fieldType).toBe('address')
  })

  it('should map uint256 to uint with bitSize 256', () => {
    const result = getFieldType('uint256')
    expect(result.fieldType).toBe('uint')
    expect(result.bitSize).toBe(256)
  })

  it('should map uint8 to uint with bitSize 8', () => {
    const result = getFieldType('uint8')
    expect(result.fieldType).toBe('uint')
    expect(result.bitSize).toBe(8)
  })

  it('should map uint (no size) to uint with bitSize 256', () => {
    const result = getFieldType('uint')
    expect(result.fieldType).toBe('uint')
    expect(result.bitSize).toBe(256)
  })

  it('should map int128 to int with bitSize 128', () => {
    const result = getFieldType('int128')
    expect(result.fieldType).toBe('int')
    expect(result.bitSize).toBe(128)
  })

  it('should map bool to bool', () => {
    expect(getFieldType('bool').fieldType).toBe('bool')
  })

  it('should map string to string', () => {
    expect(getFieldType('string').fieldType).toBe('string')
  })

  it('should map bytes to bytes', () => {
    expect(getFieldType('bytes').fieldType).toBe('bytes')
  })

  it('should map bytes32 to bytesN with byteLength 32', () => {
    const result = getFieldType('bytes32')
    expect(result.fieldType).toBe('bytesN')
    expect(result.byteLength).toBe(32)
  })

  it('should map bytes1 to bytesN with byteLength 1', () => {
    const result = getFieldType('bytes1')
    expect(result.fieldType).toBe('bytesN')
    expect(result.byteLength).toBe(1)
  })

  it('should map tuple to tuple', () => {
    expect(getFieldType('tuple').fieldType).toBe('tuple')
  })

  it('should map uint256[] to array', () => {
    const result = getFieldType('uint256[]')
    expect(result.fieldType).toBe('array')
    expect(result.arrayElementType).toBe('uint256')
    expect(result.arrayFixedLength).toBeUndefined()
  })

  it('should map address[5] to array with fixedLength', () => {
    const result = getFieldType('address[5]')
    expect(result.fieldType).toBe('array')
    expect(result.arrayElementType).toBe('address')
    expect(result.arrayFixedLength).toBe(5)
  })

  it('should map tuple[] to tupleArray', () => {
    expect(getFieldType('tuple[]').fieldType).toBe('tupleArray')
  })

  it('should map unknown types to unsupported', () => {
    expect(getFieldType('somethingWeird').fieldType).toBe('unsupported')
  })
})


// --- Section B: ABI Extraction ---

describe('getAbiFunction', () => {

  it('should extract function by name', () => {
    const result = getAbiFunction(erc20Abi, 'approve')
    expect(result.fn?.name).toBe('approve')
    expect(result.error).toBeUndefined()
  })

  it('should return error for view functions', () => {
    const result = getAbiFunction(erc20Abi, 'balanceOf')
    expect(result.fn).toBeUndefined()
    expect(result.error).toContain('not found')
  })

  it('should return error for non-existent function', () => {
    const result = getAbiFunction(erc20Abi, 'nonExistent')
    expect(result.fn).toBeUndefined()
    expect(result.error).toContain('not found')
  })

  it('should return error for overloaded functions', () => {
    const result = getAbiFunction(overloadedAbi, 'swap')
    expect(result.fn).toBeUndefined()
    expect(result.error).toContain('overloaded')
  })
})


describe('buildFields', () => {

  it('should map all basic Solidity types to field descriptors', () => {
    const { fn } = getAbiFunction(allTypesAbi, 'allTypes')
    const fields = buildFields(fn!)

    expect(fields).toHaveLength(9)
    expect(fields[0]).toMatchObject({ name: 'addr', fieldType: 'address' })
    expect(fields[1]).toMatchObject({ name: 'amount', fieldType: 'uint', bitSize: 256 })
    expect(fields[2]).toMatchObject({ name: 'small', fieldType: 'uint', bitSize: 8 })
    expect(fields[3]).toMatchObject({ name: 'signed', fieldType: 'int', bitSize: 128 })
    expect(fields[4]).toMatchObject({ name: 'flag', fieldType: 'bool' })
    expect(fields[5]).toMatchObject({ name: 'text', fieldType: 'string' })
    expect(fields[6]).toMatchObject({ name: 'data', fieldType: 'bytes' })
    expect(fields[7]).toMatchObject({ name: 'hash', fieldType: 'bytesN', byteLength: 32 })
    expect(fields[8]).toMatchObject({ name: 'shortBytes', fieldType: 'bytesN', byteLength: 4 })
  })

  it('should add __value__ field for payable functions', () => {
    const { fn } = getAbiFunction(payableAbi, 'deposit')
    const fields = buildFields(fn!)

    expect(fields).toHaveLength(1)
    expect(fields[0]).toMatchObject({ name: '__value__', isPayableValue: true, fieldType: 'uint' })
  })

  it('should handle unnamed parameters', () => {
    const { fn } = getAbiFunction(unnamedAbi, 'unnamed')
    const fields = buildFields(fn!)

    expect(fields[0].name).toBe('arg0')
    expect(fields[1].name).toBe('arg1')
  })
})


describe('getInitialValues', () => {

  it('should initialize all fields as empty strings except bool', () => {
    const { fn } = getAbiFunction(allTypesAbi, 'allTypes')
    const fields = buildFields(fn!)
    const values = getInitialValues(fields)

    expect(values.addr).toBe('')
    expect(values.amount).toBe('')
    expect(values.flag).toBe('false')
    expect(values.text).toBe('')
  })
})


// --- Section C: Value Parsing ---

describe('parseFieldValue', () => {

  it('should parse address as-is', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(parseFieldValue('0x1234567890abcdef1234567890abcdef12345678', descriptor))
      .toBe('0x1234567890abcdef1234567890abcdef12345678')
  })

  it('should parse uint to BigInt', () => {
    const descriptor: FieldDescriptor = { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 }
    expect(parseFieldValue('1000000', descriptor)).toBe(1000000n)
  })

  it('should parse negative int to BigInt', () => {
    const descriptor: FieldDescriptor = { name: 'val', solidityType: 'int128', fieldType: 'int', bitSize: 128 }
    expect(parseFieldValue('-128', descriptor)).toBe(-128n)
  })

  it('should parse bool string to boolean', () => {
    const descriptor: FieldDescriptor = { name: 'flag', solidityType: 'bool', fieldType: 'bool' }
    expect(parseFieldValue('true', descriptor)).toBe(true)
    expect(parseFieldValue('false', descriptor)).toBe(false)
  })

  it('should parse string as-is', () => {
    const descriptor: FieldDescriptor = { name: 'text', solidityType: 'string', fieldType: 'string' }
    expect(parseFieldValue('hello', descriptor)).toBe('hello')
  })

  it('should parse hex bytes as-is', () => {
    const descriptor: FieldDescriptor = { name: 'data', solidityType: 'bytes', fieldType: 'bytes' }
    expect(parseFieldValue('0xabcd', descriptor)).toBe('0xabcd')
  })

  it('should throw on invalid BigInt', () => {
    const descriptor: FieldDescriptor = { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 }
    expect(() => parseFieldValue('abc', descriptor)).toThrow()
  })

  it('should parse payable value with parseEther', () => {
    const descriptor: FieldDescriptor = { name: '__value__', solidityType: 'uint256', fieldType: 'uint', bitSize: 256, isPayableValue: true }
    expect(parseFieldValue('0.1', descriptor)).toBe(100000000000000000n)
  })
})


describe('buildArgs', () => {

  it('should build ordered args array skipping __value__', () => {
    const { fn } = getAbiFunction(erc20Abi, 'approve')
    const fields = buildFields(fn!)
    const values = { spender: '0x1234567890abcdef1234567890abcdef12345678', amount: '1000000' }
    const args = buildArgs(values, fields)

    expect(args).toEqual([ '0x1234567890abcdef1234567890abcdef12345678', 1000000n ])
  })
})


describe('extractValue', () => {

  it('should return undefined for non-payable functions', () => {
    const { fn } = getAbiFunction(erc20Abi, 'approve')
    const fields = buildFields(fn!)
    expect(extractValue({}, fields)).toBeUndefined()
  })

  it('should extract ETH value for payable functions', () => {
    const { fn } = getAbiFunction(payableAbi, 'deposit')
    const fields = buildFields(fn!)
    const value = extractValue({ __value__: '1.5' }, fields)
    expect(value).toBe(1500000000000000000n)
  })
})


// --- Section D: Validation ---

describe('validateFormat', () => {

  it('should accept partial address input', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(validateFormat('0xab', descriptor)).toBeNull()
  })

  it('should reject non-hex in address', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(validateFormat('0xGG', descriptor)).not.toBeNull()
  })

  it('should accept digits for uint', () => {
    const descriptor: FieldDescriptor = { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 }
    expect(validateFormat('123', descriptor)).toBeNull()
  })

  it('should reject letters for uint', () => {
    const descriptor: FieldDescriptor = { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 }
    expect(validateFormat('12a', descriptor)).not.toBeNull()
  })

  it('should accept negative sign for int', () => {
    const descriptor: FieldDescriptor = { name: 'val', solidityType: 'int128', fieldType: 'int', bitSize: 128 }
    expect(validateFormat('-', descriptor)).toBeNull()
  })

  it('should accept partial hex for bytes', () => {
    const descriptor: FieldDescriptor = { name: 'data', solidityType: 'bytes', fieldType: 'bytes' }
    expect(validateFormat('0xab', descriptor)).toBeNull()
  })

  it('should accept empty string', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(validateFormat('', descriptor)).toBeNull()
  })
})


describe('validateFull', () => {

  it('should validate address checksum', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(validateFull('0x1234567890abcdef1234567890abcdef12345678', descriptor)).toBeNull()
  })

  it('should reject invalid address', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(validateFull('0xinvalid', descriptor)).not.toBeNull()
  })

  it('should validate uint8 range (255 OK)', () => {
    const descriptor: FieldDescriptor = { name: 'small', solidityType: 'uint8', fieldType: 'uint', bitSize: 8 }
    expect(validateFull('255', descriptor)).toBeNull()
  })

  it('should reject uint8 overflow (256)', () => {
    const descriptor: FieldDescriptor = { name: 'small', solidityType: 'uint8', fieldType: 'uint', bitSize: 8 }
    expect(validateFull('256', descriptor)).not.toBeNull()
  })

  it('should validate int8 range (-128 to 127)', () => {
    const descriptor: FieldDescriptor = { name: 'val', solidityType: 'int8', fieldType: 'int', bitSize: 8 }
    expect(validateFull('-128', descriptor)).toBeNull()
    expect(validateFull('127', descriptor)).toBeNull()
  })

  it('should reject int8 overflow', () => {
    const descriptor: FieldDescriptor = { name: 'val', solidityType: 'int8', fieldType: 'int', bitSize: 8 }
    expect(validateFull('-129', descriptor)).not.toBeNull()
    expect(validateFull('128', descriptor)).not.toBeNull()
  })

  it('should reject negative uint', () => {
    const descriptor: FieldDescriptor = { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 }
    expect(validateFull('-1', descriptor)).not.toBeNull()
  })

  it('should validate bytes even length', () => {
    const descriptor: FieldDescriptor = { name: 'data', solidityType: 'bytes', fieldType: 'bytes' }
    expect(validateFull('0xabcd', descriptor)).toBeNull()
    expect(validateFull('0xabc', descriptor)).not.toBeNull()
  })

  it('should validate bytes32 exact length', () => {
    const descriptor: FieldDescriptor = { name: 'hash', solidityType: 'bytes32', fieldType: 'bytesN', byteLength: 32 }
    const valid = '0x' + 'ab'.repeat(32)
    const tooShort = '0x' + 'ab'.repeat(31)
    expect(validateFull(valid, descriptor)).toBeNull()
    expect(validateFull(tooShort, descriptor)).not.toBeNull()
  })

  it('should require non-empty value', () => {
    const descriptor: FieldDescriptor = { name: 'addr', solidityType: 'address', fieldType: 'address' }
    expect(validateFull('', descriptor)).toBe('Required')
  })

  it('should validate payable value', () => {
    const descriptor: FieldDescriptor = { name: '__value__', solidityType: 'uint256', fieldType: 'uint', bitSize: 256, isPayableValue: true }
    expect(validateFull('0.1', descriptor)).toBeNull()
    expect(validateFull('-1', descriptor)).not.toBeNull()
  })

  it('should detect parseEther precision loss (>18 decimals)', () => {
    const descriptor: FieldDescriptor = { name: '__value__', solidityType: 'uint256', fieldType: 'uint', bitSize: 256, isPayableValue: true }
    expect(validateFull('0.0000000000000000001', descriptor)).toContain('Precision')
  })
})


describe('validateAllFields', () => {

  it('should validate all fields and return error map', () => {
    const { fn } = getAbiFunction(erc20Abi, 'approve')
    const fields = buildFields(fn!)
    const errors = validateAllFields(
      { spender: '0x1234567890abcdef1234567890abcdef12345678', amount: '1000000' },
      fields,
    )

    expect(errors.spender).toBeNull()
    expect(errors.amount).toBeNull()
  })

  it('should mark empty required fields', () => {
    const { fn } = getAbiFunction(erc20Abi, 'approve')
    const fields = buildFields(fn!)
    const errors = validateAllFields({ spender: '', amount: '' }, fields)

    expect(errors.spender).toBe('Required')
    expect(errors.amount).toBe('Required')
  })
})


// --- Section E: Security ---

describe('isDangerousFunction', () => {

  it('should detect approve as dangerous', () => {
    expect(isDangerousFunction('approve')).toBe(true)
  })

  it('should detect setApprovalForAll as dangerous', () => {
    expect(isDangerousFunction('setApprovalForAll')).toBe(true)
  })

  it('should detect renounceOwnership as dangerous', () => {
    expect(isDangerousFunction('renounceOwnership')).toBe(true)
  })

  it('should detect upgradeTo as dangerous', () => {
    expect(isDangerousFunction('upgradeTo')).toBe(true)
  })

  it('should NOT detect balanceOf as dangerous', () => {
    expect(isDangerousFunction('balanceOf')).toBe(false)
  })

  it('should NOT detect custom function as dangerous', () => {
    expect(isDangerousFunction('myCustomFunction')).toBe(false)
  })
})


describe('getSecurityWarnings', () => {

  it('should return warning for approve', () => {
    const warnings = getSecurityWarnings('approve', {}, [])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].level).toBe('warning')
  })

  it('should return danger for setApprovalForAll', () => {
    const warnings = getSecurityWarnings('setApprovalForAll', {}, [])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].level).toBe('danger')
  })

  it('should detect MAX_UINT256 in approve amount', () => {
    const fields: FieldDescriptor[] = [
      { name: 'spender', solidityType: 'address', fieldType: 'address' },
      { name: 'amount', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
    ]
    const warnings = getSecurityWarnings(
      'approve',
      { spender: '0x1234567890abcdef1234567890abcdef12345678', amount: maxUint256.toString() },
      fields,
    )

    expect(warnings.length).toBeGreaterThanOrEqual(2)
    expect(warnings.some((warning) => warning.level === 'danger' && warning.message.includes('Unlimited'))).toBe(true)
  })

  it('should return empty for safe function', () => {
    const warnings = getSecurityWarnings('myFunction', {}, [])
    expect(warnings).toHaveLength(0)
  })
})


// --- Section F: Calldata Preview ---

describe('buildCalldataPreview', () => {

  it('should build readable calldata string', () => {
    const preview = buildCalldataPreview(
      erc20Abi,
      'approve',
      [ '0x1234567890abcdef1234567890abcdef12345678', 1000000n ],
    )

    expect(preview).toContain('approve(')
    expect(preview).toContain('spender')
    // viem returns checksummed address (mixed case) - verify full address present, not shortened
    expect(preview).toMatch(/0x1234567890[Aa]bcd[Ee][Ff]1234567890[Aa][Bb]cdef12345678/i)
    expect(preview).toContain('1000000')
  })

  it('should return undefined on encoding error', () => {
    const preview = buildCalldataPreview(erc20Abi, 'nonExistent', [])
    expect(preview).toBeUndefined()
  })
})


// --- Array Support ---

describe('Array support', () => {

  describe('Type dispatch', () => {

    it('should map uint256[] to array with elementType', () => {
      const result = getFieldType('uint256[]')
      expect(result.fieldType).toBe('array')
      expect(result.arrayElementType).toBe('uint256')
      expect(result.arrayFixedLength).toBeUndefined()
    })

    it('should map address[5] to array with fixedLength', () => {
      const result = getFieldType('address[5]')
      expect(result.fieldType).toBe('array')
      expect(result.arrayElementType).toBe('address')
      expect(result.arrayFixedLength).toBe(5)
    })

    it('should map tuple[] to tupleArray', () => {
      expect(getFieldType('tuple[]').fieldType).toBe('tupleArray')
    })
  })

  describe('Parsing', () => {

    it('should parse JSON array of addresses', () => {
      const descriptor: FieldDescriptor = {
        name: 'addrs', solidityType: 'address[]', fieldType: 'array',
        arrayElementType: 'address',
      }
      const result = parseFieldValue(
        '["0x1234567890abcdef1234567890abcdef12345678", "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"]',
        descriptor,
      )
      expect(result).toEqual([
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      ])
    })

    it('should parse JSON array with BigInt values', () => {
      const descriptor: FieldDescriptor = {
        name: 'amounts', solidityType: 'uint256[]', fieldType: 'array',
        arrayElementType: 'uint256',
      }
      const result = parseFieldValue('["1000000", "2000000"]', descriptor)
      expect(result).toEqual([ 1000000n, 2000000n ])
    })

    it('should accept empty array for dynamic arrays', () => {
      const descriptor: FieldDescriptor = {
        name: 'data', solidityType: 'uint256[]', fieldType: 'array',
        arrayElementType: 'uint256',
      }
      const result = parseFieldValue('[]', descriptor)
      expect(result).toEqual([])
    })
  })

  describe('Validation', () => {

    it('should validate array with all valid elements', () => {
      const descriptor: FieldDescriptor = {
        name: 'addrs', solidityType: 'address[]', fieldType: 'array',
        arrayElementType: 'address',
      }
      expect(validateFull(
        '["0x1234567890abcdef1234567890abcdef12345678"]',
        descriptor,
      )).toBeNull()
    })

    it('should reject fixed-length array with wrong count', () => {
      const descriptor: FieldDescriptor = {
        name: 'data', solidityType: 'uint256[3]', fieldType: 'array',
        arrayElementType: 'uint256', arrayFixedLength: 3,
      }
      expect(validateFull('["1", "2"]', descriptor)).toContain('3 items')
    })

    it('should report invalid element with index', () => {
      const descriptor: FieldDescriptor = {
        name: 'addrs', solidityType: 'address[]', fieldType: 'array',
        arrayElementType: 'address',
      }
      expect(validateFull('["0xinvalid"]', descriptor)).toContain('[0]')
    })
  })
})


// --- Tuple Support ---

describe('Tuple support', () => {

  const tupleAbi: Abi = [
    {
      type: 'function', name: 'doTuple', stateMutability: 'nonpayable',
      inputs: [{
        name: 'params', type: 'tuple',
        internalType: 'struct SwapParams',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
        ],
      }],
      outputs: [],
    },
  ]

  describe('Field building', () => {

    it('should build recursive components for tuple', () => {
      const { fn } = getAbiFunction(tupleAbi, 'doTuple')
      const fields = buildFields(fn!)

      expect(fields).toHaveLength(1)
      expect(fields[0].fieldType).toBe('tuple')
      expect(fields[0].components).toHaveLength(2)
      expect(fields[0].components![0]).toMatchObject({ name: 'tokenIn', fieldType: 'address' })
      expect(fields[0].components![1]).toMatchObject({ name: 'amountIn', fieldType: 'uint', bitSize: 256 })
    })

    it('should handle unnamed tuple components', () => {
      const unnamedTupleAbi: Abi = [{
        type: 'function', name: 'doTuple', stateMutability: 'nonpayable',
        inputs: [{
          name: 'params', type: 'tuple',
          components: [
            { name: '', type: 'address' },
            { name: '', type: 'uint256' },
          ],
        }],
        outputs: [],
      }]

      const { fn } = getAbiFunction(unnamedTupleAbi, 'doTuple')
      const fields = buildFields(fn!)

      expect(fields[0].components![0].name).toBe('arg0')
      expect(fields[0].components![1].name).toBe('arg1')
    })
  })

  describe('Parsing', () => {

    it('should parse JSON object with component validation', () => {
      const descriptor: FieldDescriptor = {
        name: 'params', solidityType: 'tuple', fieldType: 'tuple',
        components: [
          { name: 'tokenIn', solidityType: 'address', fieldType: 'address' },
          { name: 'amountIn', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
        ],
      }
      const result = parseFieldValue(
        '{"tokenIn": "0x1234567890abcdef1234567890abcdef12345678", "amountIn": "1000000"}',
        descriptor,
      ) as Record<string, unknown>

      expect(result.tokenIn).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(result.amountIn).toBe(1000000n)
    })

    it('should throw on missing component', () => {
      const descriptor: FieldDescriptor = {
        name: 'params', solidityType: 'tuple', fieldType: 'tuple',
        components: [
          { name: 'tokenIn', solidityType: 'address', fieldType: 'address' },
          { name: 'amountIn', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
        ],
      }
      expect(() => parseFieldValue('{"tokenIn": "0x1234567890abcdef1234567890abcdef12345678"}', descriptor))
        .toThrow('Missing component')
    })
  })

  describe('Validation', () => {

    it('should validate tuple with all valid components', () => {
      const descriptor: FieldDescriptor = {
        name: 'params', solidityType: 'tuple', fieldType: 'tuple',
        components: [
          { name: 'tokenIn', solidityType: 'address', fieldType: 'address' },
          { name: 'amountIn', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
        ],
      }
      expect(validateFull(
        '{"tokenIn": "0x1234567890abcdef1234567890abcdef12345678", "amountIn": "1000000"}',
        descriptor,
      )).toBeNull()
    })

    it('should report missing field in tuple', () => {
      const descriptor: FieldDescriptor = {
        name: 'params', solidityType: 'tuple', fieldType: 'tuple',
        components: [
          { name: 'tokenIn', solidityType: 'address', fieldType: 'address' },
        ],
      }
      expect(validateFull('{}', descriptor)).toContain('Missing')
    })
  })
})


// --- TupleArray Support ---

describe('TupleArray support', () => {

  it('should parse array of structs', () => {
    const descriptor: FieldDescriptor = {
      name: 'calls', solidityType: 'tuple[]', fieldType: 'tupleArray',
      components: [
        { name: 'target', solidityType: 'address', fieldType: 'address' },
        { name: 'value', solidityType: 'uint256', fieldType: 'uint', bitSize: 256 },
      ],
    }
    const result = parseFieldValue(
      '[{"target": "0x1234567890abcdef1234567890abcdef12345678", "value": "100"}]',
      descriptor,
    ) as Record<string, unknown>[]

    expect(result).toHaveLength(1)
    expect(result[0].target).toBe('0x1234567890abcdef1234567890abcdef12345678')
    expect(result[0].value).toBe(100n)
  })

  it('should validate each struct in array', () => {
    const descriptor: FieldDescriptor = {
      name: 'calls', solidityType: 'tuple[]', fieldType: 'tupleArray',
      components: [
        { name: 'target', solidityType: 'address', fieldType: 'address' },
      ],
    }
    expect(validateFull(
      '[{"target": "0x1234567890abcdef1234567890abcdef12345678"}]',
      descriptor,
    )).toBeNull()
  })
})
