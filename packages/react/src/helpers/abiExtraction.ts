import type { Abi, AbiFunction, AbiParameter } from 'viem'

import type { FieldDescriptor } from '../types/contract'

import { getFieldType } from './abiTypeDispatch'


// --- ABI Extraction ---

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
