import PayableValueField from './PayableValueField'
import type { FieldDescriptor } from '../../types/contract'



type FieldProps = {
  field: FieldDescriptor
  value: string
  error: string | null
  touched: boolean
  disabled?: boolean
  onChange: (name: string, value: string) => void
  onBlur: (name: string) => void
}


// Helper: compute hint text per field kind. Not a render helper; returns
// a plain string for the label hint row.
const getFieldHint = (field: FieldDescriptor): string | undefined => {
  if (field.fieldType === 'address') {
    return '42 characters starting with 0x'
  }
  if (field.fieldType === 'uint' && field.bitSize && field.bitSize < 256) {
    const maxValue = (1n << BigInt(field.bitSize)) - 1n
    return `uint${field.bitSize}: 0 to ${maxValue}`
  }
  if (field.fieldType === 'int' && field.bitSize && field.bitSize < 256) {
    const minValue = -(1n << BigInt(field.bitSize - 1))
    const maxValue = (1n << BigInt(field.bitSize - 1)) - 1n
    return `int${field.bitSize}: ${minValue} to ${maxValue}`
  }
  if (field.fieldType === 'bytesN' && field.byteLength) {
    return `${field.byteLength} bytes (${field.byteLength * 2} hex characters)`
  }
  if (field.fieldType === 'bytes') {
    return 'Variable length hex data'
  }
  return undefined
}


export { getFieldHint, PayableValueField }
export type { FieldProps }
