import React from 'react'

import BoolField from './BoolField'
import TupleField from './TupleField'
import BytesField from './BytesField'
import ArrayField from './ArrayField'
import StringField from './StringField'
import AddressField from './AddressField'
import IntegerField from './IntegerField'
import UnsupportedField from './UnsupportedField'
import PayableValueField from './PayableValueField'
import type { ContractFormLabels } from './labels'
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


// --- Helper: get hint text ---

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


// --- Helper: render field input by type ---

const renderFieldInput = (props: FieldProps, labels: ContractFormLabels) => {
  switch (props.field.fieldType) {
    case 'address':
      return <AddressField {...props} />
    case 'uint':
    case 'int':
      return <IntegerField {...props} />
    case 'bool':
      return <BoolField {...props} />
    case 'string':
      return <StringField {...props} />
    case 'bytes':
    case 'bytesN':
      return <BytesField {...props} />
    case 'array':
    case 'tupleArray':
      return <ArrayField {...props} />
    case 'tuple':
      return <TupleField {...props} />
    default:
      return <UnsupportedField labels={labels} />
  }
}


export { renderFieldInput, getFieldHint, PayableValueField }
export type { FieldProps }
