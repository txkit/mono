import type { SolidityFieldType } from '../types/contract'


// --- Type Dispatch ---

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
