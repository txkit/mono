import type { Abi, AbiFunction, AbiParameter } from 'viem'
import { isAddress, parseEther, encodeFunctionData, decodeFunctionData } from 'viem'

import { isMaxApproval } from '@txkit/core'
import type { DecodedCalldata } from '@txkit/core'

import type { FieldDescriptor, SecurityWarning, SolidityFieldType } from './types'


// --- Section A: Type Dispatch ---

const INT_REGEX = /^(u?int)(\d*)$/
const BYTES_N_REGEX = /^bytes(\d+)$/
const ARRAY_REGEX = /^(.+?)(\[(\d*)\])$/

export const getFieldType = (solidityType: string): {
  fieldType: SolidityFieldType
  bitSize?: number
  byteLength?: number
  arrayElementType?: string
  arrayFixedLength?: number
} => {
  if (solidityType === 'address') {
    return { fieldType: 'address' }
  }
  if (solidityType === 'bool') {
    return { fieldType: 'bool' }
  }
  if (solidityType === 'string') {
    return { fieldType: 'string' }
  }
  if (solidityType === 'bytes') {
    return { fieldType: 'bytes' }
  }

  const intMatch = solidityType.match(INT_REGEX)
  if (intMatch) {
    const isUnsigned = intMatch[1] === 'uint'
    const bitSize = intMatch[2] ? Number(intMatch[2]) : 256
    return { fieldType: isUnsigned ? 'uint' : 'int', bitSize }
  }

  const bytesMatch = solidityType.match(BYTES_N_REGEX)
  if (bytesMatch) {
    return { fieldType: 'bytesN', byteLength: Number(bytesMatch[1]) }
  }

  if (solidityType.startsWith('tuple[')) {
    return { fieldType: 'tupleArray' }
  }

  if (solidityType === 'tuple') {
    return { fieldType: 'tuple' }
  }

  const arrayMatch = solidityType.match(ARRAY_REGEX)
  if (arrayMatch) {
    const elementType = arrayMatch[1]
    const fixedLength = arrayMatch[3] ? Number(arrayMatch[3]) : undefined
    return { fieldType: 'array', arrayElementType: elementType, arrayFixedLength: fixedLength }
  }

  return { fieldType: 'unsupported' }
}


// --- Section B: ABI Extraction ---

const writeStates: readonly string[] = [ 'nonpayable', 'payable' ]

export const getAbiFunction = (abi: Abi, functionName: string): { fn?: AbiFunction; error?: string } => {
  const matches = abi.filter(
    (item): item is AbiFunction =>
      item.type === 'function'
      && item.name === functionName
      && writeStates.includes(item.stateMutability),
  )

  if (matches.length === 0) {
    return { error: `Function "${functionName}" not found in ABI (or is view/pure)` }
  }

  if (matches.length > 1) {
    return { error: `Function "${functionName}" is overloaded (${matches.length} variants). Overload resolution is not yet supported.` }
  }

  return { fn: matches[0] }
}

export const buildFields = (abiFunction: AbiFunction): FieldDescriptor[] => {
  const fields = abiFunction.inputs.map((param, index) => buildFieldFromParam(param, index))

  if (abiFunction.stateMutability === 'payable') {
    fields.unshift({
      name: '__value__',
      solidityType: 'uint256',
      fieldType: 'uint',
      bitSize: 256,
      isPayableValue: true,
    })
  }

  return fields
}

const buildFieldFromParam = (param: AbiParameter, index: number): FieldDescriptor => {
  const name = param.name || `arg${index}`
  const typeInfo = getFieldType(param.type)

  const descriptor: FieldDescriptor = {
    name,
    solidityType: param.type,
    fieldType: typeInfo.fieldType,
    bitSize: typeInfo.bitSize,
    byteLength: typeInfo.byteLength,
    internalType: param.internalType ?? undefined,
    arrayElementType: typeInfo.arrayElementType,
    arrayFixedLength: typeInfo.arrayFixedLength,
  }

  if (typeInfo.fieldType === 'tuple' && 'components' in param && param.components) {
    descriptor.components = param.components.map((component, componentIndex) =>
      buildFieldFromParam(component, componentIndex),
    )
  }

  if (typeInfo.fieldType === 'tupleArray' && 'components' in param && param.components) {
    descriptor.components = param.components.map((component, componentIndex) =>
      buildFieldFromParam(component, componentIndex),
    )
  }

  return descriptor
}

export const getInitialValues = (fields: FieldDescriptor[]): Record<string, string> => {
  const values: Record<string, string> = {}
  for (const field of fields) {
    values[field.name] = field.fieldType === 'bool' ? 'false' : ''
  }
  return values
}


// --- Section C: Value Parsing ---

/** BigInt-safe JSON reviver: numeric strings that look like BigInt are converted */
const bigIntReviver = (_key: string, value: unknown): unknown => {
  if (typeof value === 'string' && /^-?\d+$/.test(value) && value.length > 15) {
    try {
      return BigInt(value)
    } catch {
      return value
    }
  }
  return value
}

/** BigInt-safe JSON replacer */
export const bigIntReplacer = (_key: string, value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value

export const parseFieldValue = (value: string, descriptor: FieldDescriptor): unknown => {
  if (descriptor.isPayableValue) {
    return parseEther(value)
  }

  switch (descriptor.fieldType) {
    case 'address':
    case 'bytes':
    case 'bytesN':
      return value

    case 'uint':
    case 'int':
      return BigInt(value)

    case 'bool':
      return value === 'true'

    case 'string':
      return value

    case 'array':
      return parseArrayValue(value, descriptor)

    case 'tuple':
      return parseTupleValue(value, descriptor)

    case 'tupleArray':
      return parseTupleArrayValue(value, descriptor)

    default:
      return value
  }
}

const parseArrayValue = (value: string, descriptor: FieldDescriptor): unknown[] => {
  const parsed = JSON.parse(value) as unknown[]
  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array')
  }

  const elementType = descriptor.arrayElementType ?? 'string'
  const elementDescriptor: FieldDescriptor = {
    name: 'element',
    solidityType: elementType,
    ...getFieldType(elementType),
  }

  return parsed.map((element) => {
    if (typeof element === 'string') {
      return parseFieldValue(element, elementDescriptor)
    }
    // Already parsed (e.g. number -> BigInt)
    if (typeof element === 'number') {
      return BigInt(element)
    }
    return element
  })
}

const parseTupleValue = (value: string, descriptor: FieldDescriptor): Record<string, unknown> => {
  const parsed = JSON.parse(value, bigIntReviver) as Record<string, unknown>
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected JSON object')
  }

  if (!descriptor.components) {
    return parsed
  }

  const result: Record<string, unknown> = {}
  for (const component of descriptor.components) {
    const rawValue = parsed[component.name]
    if (rawValue === undefined) {
      throw new Error(`Missing component: ${component.name}`)
    }
    if (typeof rawValue === 'string') {
      result[component.name] = parseFieldValue(rawValue, component)
    } else {
      result[component.name] = rawValue
    }
  }
  return result
}

const parseTupleArrayValue = (value: string, descriptor: FieldDescriptor): unknown[] => {
  const parsed = JSON.parse(value) as unknown[]
  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array of structs')
  }

  return parsed.map((element) => {
    const elementStr = typeof element === 'string' ? element : JSON.stringify(element, bigIntReplacer)
    return parseTupleValue(elementStr, descriptor)
  })
}

export const buildArgs = (values: Record<string, string>, fields: FieldDescriptor[]): unknown[] => {
  return fields
    .filter((field) => !field.isPayableValue)
    .map((field) => parseFieldValue(values[field.name], field))
}

export const extractValue = (values: Record<string, string>, fields: FieldDescriptor[]): bigint | undefined => {
  const valueField = fields.find((field) => field.isPayableValue)
  if (!valueField || !values[valueField.name]) {
    return undefined
  }
  return parseEther(values[valueField.name])
}


// --- Section D: Validation ---

const ADDRESS_FORMAT = /^(0x)?[0-9a-fA-F]{0,40}$/
const UINT_FORMAT = /^[0-9]*$/
const INT_FORMAT = /^-?[0-9]*$/
const HEX_FORMAT = /^(0x)?[0-9a-fA-F]*$/
const VALUE_FORMAT = /^[0-9]*\.?[0-9]*$/

export const validateFormat = (value: string, descriptor: FieldDescriptor): string | null => {
  if (value === '') {
    return null
  }

  if (descriptor.isPayableValue) {
    return VALUE_FORMAT.test(value) ? null : 'Invalid number format'
  }

  switch (descriptor.fieldType) {
    case 'address':
      return ADDRESS_FORMAT.test(value) ? null : 'Invalid address format'

    case 'uint':
      return UINT_FORMAT.test(value) ? null : 'Only positive numbers allowed'

    case 'int':
      return INT_FORMAT.test(value) ? null : 'Invalid number format'

    case 'bytes':
    case 'bytesN':
      return HEX_FORMAT.test(value) ? null : 'Invalid hex format'

    case 'bool':
    case 'string':
      return null

    case 'array':
    case 'tuple':
    case 'tupleArray':
      // JSON format check
      try {
        JSON.parse(value)
        return null
      } catch {
        return 'Invalid JSON format'
      }

    default:
      return null
  }
}

export const validateFull = (value: string, descriptor: FieldDescriptor): string | null => {
  if (value === '') {
    return 'Required'
  }

  if (descriptor.isPayableValue) {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) {
      return 'Must be a positive number'
    }
    // Check precision: parseEther silently truncates >18 decimals
    try {
      const parsed = parseEther(value)
      if (parsed === 0n && num > 0) {
        return 'Precision exceeds 18 decimals'
      }
    } catch {
      return 'Invalid ETH value'
    }
    return null
  }

  switch (descriptor.fieldType) {
    case 'address':
      if (value.length !== 42) {
        return 'Address must be 42 characters (0x + 40 hex)'
      }
      if (!isAddress(value)) {
        return 'Invalid Ethereum address'
      }
      return null

    case 'uint': {
      try {
        const bigintValue = BigInt(value)
        if (bigintValue < 0n) {
          return 'Must be a positive number'
        }
        const maxValue = (1n << BigInt(descriptor.bitSize ?? 256)) - 1n
        if (bigintValue > maxValue) {
          return `Value out of range (max: ${maxValue})`
        }
      } catch {
        return 'Invalid number'
      }
      return null
    }

    case 'int': {
      try {
        const bigintValue = BigInt(value)
        const bits = BigInt(descriptor.bitSize ?? 256)
        const minValue = -(1n << (bits - 1n))
        const maxValue = (1n << (bits - 1n)) - 1n
        if (bigintValue < minValue || bigintValue > maxValue) {
          return `Value out of range (${minValue} to ${maxValue})`
        }
      } catch {
        return 'Invalid number'
      }
      return null
    }

    case 'bool':
      if (value !== 'true' && value !== 'false') {
        return 'Must be true or false'
      }
      return null

    case 'string':
      return null

    case 'bytes': {
      if (!value.startsWith('0x')) {
        return 'Must start with 0x'
      }
      const hexPart = value.slice(2)
      if (hexPart.length % 2 !== 0) {
        return 'Hex must have even length'
      }
      if (!HEX_FORMAT.test(value)) {
        return 'Invalid hex characters'
      }
      return null
    }

    case 'bytesN': {
      if (!value.startsWith('0x')) {
        return 'Must start with 0x'
      }
      const expectedLength = (descriptor.byteLength ?? 0) * 2
      const hexPart = value.slice(2)
      if (hexPart.length !== expectedLength) {
        return `Expected ${descriptor.byteLength} bytes (${expectedLength} hex chars)`
      }
      if (!HEX_FORMAT.test(value)) {
        return 'Invalid hex characters'
      }
      return null
    }

    case 'array':
      return validateArrayFull(value, descriptor)

    case 'tuple':
      return validateTupleFull(value, descriptor)

    case 'tupleArray':
      return validateTupleArrayFull(value, descriptor)

    default:
      return null
  }
}

const validateArrayFull = (value: string, descriptor: FieldDescriptor): string | null => {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return 'Expected a JSON array'
    }

    if (descriptor.arrayFixedLength !== undefined && parsed.length !== descriptor.arrayFixedLength) {
      return `Expected exactly ${descriptor.arrayFixedLength} items`
    }

    const elementType = descriptor.arrayElementType ?? 'string'
    const elementDescriptor: FieldDescriptor = {
      name: 'element',
      solidityType: elementType,
      ...getFieldType(elementType),
    }

    for (let index = 0; index < parsed.length; index++) {
      const element = parsed[index]
      const elementStr = typeof element === 'string' ? element : String(element)
      const error = validateFull(elementStr, elementDescriptor)
      if (error) {
        return `Item [${index}]: ${error}`
      }
    }

    return null
  } catch {
    return 'Invalid JSON array'
  }
}

const validateTupleFull = (value: string, descriptor: FieldDescriptor): string | null => {
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return 'Expected a JSON object'
    }

    if (!descriptor.components) {
      return null
    }

    for (const component of descriptor.components) {
      if (!(component.name in parsed)) {
        return `Missing field: ${component.name}`
      }
      const componentValue = parsed[component.name]
      const componentStr = typeof componentValue === 'string' ? componentValue : String(componentValue)
      const error = validateFull(componentStr, component)
      if (error) {
        return `${component.name}: ${error}`
      }
    }

    return null
  } catch {
    return 'Invalid JSON object'
  }
}

const validateTupleArrayFull = (value: string, descriptor: FieldDescriptor): string | null => {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return 'Expected a JSON array of structs'
    }

    for (let index = 0; index < parsed.length; index++) {
      const element = parsed[index]
      const elementStr = typeof element === 'object' ? JSON.stringify(element) : String(element)
      const error = validateTupleFull(elementStr, descriptor)
      if (error) {
        return `[${index}]: ${error}`
      }
    }

    return null
  } catch {
    return 'Invalid JSON array'
  }
}

export const validateAllFields = (
  values: Record<string, string>,
  fields: FieldDescriptor[]
): Record<string, string | null> => {
  const errors: Record<string, string | null> = {}
  for (const field of fields) {
    errors[field.name] = validateFull(values[field.name] ?? '', field)
  }
  return errors
}


// --- Section E: Security ---

const DANGEROUS_FUNCTIONS: Record<string, { level: 'warning' | 'danger'; message: string }> = {
  approve: { level: 'warning', message: 'Grants token spending allowance to another address' },
  setApprovalForAll: { level: 'danger', message: 'Grants full access to ALL tokens in collection' },
  transfer: { level: 'warning', message: 'Sends tokens to another address' },
  transferFrom: { level: 'warning', message: 'Transfers tokens on behalf of another address' },
  delegateCall: { level: 'danger', message: 'Executes arbitrary code in contract context' },
  selfdestruct: { level: 'danger', message: 'Permanently destroys contract' },
  burn: { level: 'warning', message: 'Destroys tokens permanently' },
  burnFrom: { level: 'warning', message: 'Destroys tokens from another address' },
  renounceOwnership: { level: 'danger', message: 'Irreversibly removes contract ownership' },
  transferOwnership: { level: 'warning', message: 'Transfers contract ownership to another address' },
  upgradeTo: { level: 'danger', message: 'Upgrades contract implementation (arbitrary code change)' },
  upgradeToAndCall: { level: 'danger', message: 'Upgrades contract and executes arbitrary call' },
  permit: { level: 'warning', message: 'Grants gasless token spending allowance via signature' },
  multicall: { level: 'warning', message: 'Executes multiple contract calls in one transaction' },
  execute: { level: 'warning', message: 'Executes an arbitrary contract call' },
  withdraw: { level: 'warning', message: 'Withdraws funds from the contract' },
  withdrawAll: { level: 'warning', message: 'Withdraws all funds from the contract' },
  pause: { level: 'warning', message: 'Pauses contract operations' },
  unpause: { level: 'warning', message: 'Resumes contract operations' },
}

export const isDangerousFunction = (functionName: string): boolean => {
  return functionName in DANGEROUS_FUNCTIONS
}

export const getSecurityWarnings = (
  functionName: string,
  values: Record<string, string>,
  fields: FieldDescriptor[]
): SecurityWarning[] => {
  const warnings: SecurityWarning[] = []

  const dangerInfo = DANGEROUS_FUNCTIONS[functionName]
  if (dangerInfo) {
    warnings.push({ level: dangerInfo.level, message: dangerInfo.message })
  }

  // MAX_UINT256 detection for approve
  if (functionName === 'approve') {
    const amountField = fields.find((field) =>
      !field.isPayableValue && (field.fieldType === 'uint' || field.fieldType === 'int'),
    )
    if (amountField) {
      const amountValue = values[amountField.name]
      if (amountValue) {
        try {
          const amount = BigInt(amountValue)
          if (isMaxApproval(amount)) {
            warnings.push({
              level: 'danger',
              message: 'Unlimited approval - grants permanent access to all your tokens of this type',
            })
          }
        } catch {
          // Invalid BigInt, skip check
        }
      }
    }
  }

  return warnings
}


// --- Section F: Calldata Preview ---

/** Format arg value showing FULL addresses (no shortening - anti-poisoning) */
const formatArgValueFull = (value: unknown, type: string): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (type === 'address' && typeof value === 'string') {
    return value // Full address, NOT shortened
  }
  if (Array.isArray(value)) {
    return `[${value.map((element) => formatArgValueFull(element, type.replace('[]', ''))).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value, (_key, element) => typeof element === 'bigint' ? element.toString() : element)
  }
  return String(value)
}

export const buildCalldataPreview = (
  abi: Abi,
  functionName: string,
  args: unknown[]
): string | undefined => {
  try {
    const data = encodeFunctionData({ abi, functionName, args })
    const decoded = decodeFunctionData({ abi, data })

    const abiItem = abi.find(
      (item): item is AbiFunction => item.type === 'function' && item.name === decoded.functionName,
    )
    const inputs = abiItem?.inputs ?? []

    const decodedCalldata: DecodedCalldata = {
      functionName: decoded.functionName,
      args: (decoded.args ?? []).map((value, index) => ({
        name: inputs[index]?.name ?? `arg${index}`,
        type: inputs[index]?.type ?? 'unknown',
        value,
      })),
    }

    const argsStr = decodedCalldata.args
      .map((arg) => `  ${arg.name} (${arg.type}): ${formatArgValueFull(arg.value, arg.type)}`)
      .join('\n')

    return `${decodedCalldata.functionName}(\n${argsStr}\n)`
  } catch {
    return undefined
  }
}
