import type { DecodedCalldata } from '../../types'

import { shortenAddress } from '../address'


/** Format a decoded arg value into human-readable string */
const formatArgValue = (value: unknown, type: string): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (type === 'address' && typeof value === 'string') {
    return shortenAddress(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((element) => formatArgValue(element, type.replace('[]', ''))).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value, (_key, jsonValue) => typeof jsonValue === 'bigint' ? jsonValue.toString() : jsonValue)
  }
  return String(value)
}

/** Format decoded calldata into human-readable lines */
export const formatDecodedCalldata = (decoded: DecodedCalldata): string => {
  const formattedArgs = decoded.args
    .map((arg) => `  ${arg.name} (${arg.type}): ${formatArgValue(arg.value, arg.type)}`)
    .join('\n')

  return `${decoded.functionName}(\n${formattedArgs}\n)`
}
