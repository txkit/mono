import { decodeFunctionData } from 'viem'
import type { Abi, AbiFunction } from 'viem'

import type { DecodeCallInput, DecodeCallOptions, DecodedArg, DecodedCall } from './types'
import { registryKey } from './registry/loader'


/**
 * Result returned for envelopes whose call carries no calldata. The name
 * "ETH transfer" is misleading because empty calldata also fires the target
 * contract's `fallback()` / `receive()` function. We surface it as an
 * unknown-selector decoder result so consumers do not assume "pure transfer".
 */
const EMPTY_DATA_RESULT = (): DecodedCall => ({
  selector: null,
  functionName: null,
  args: [],
  source: 'unknown' satisfies DecodedCall['source'],
})

/**
 * Decode a single EvmCall into a structured DecodedCall.
 *
 * Lookup order (first match wins):
 * 1. inline `abi` from options
 * 2. `registry` entry for (chain, to)
 * 3. `fourByte` async resolver
 * 4. unknown - returns selector only, no args
 *
 * Pure value-in / value-out, no network unless `fourByte` is async.
 */
export const decodeCall = async (input: DecodeCallInput, options: DecodeCallOptions = {}): Promise<DecodedCall> => {
  const { call, chain } = input
  const { data } = call

  // Reject odd-length hex too: a malformed `0x...` (e.g. dropped nibble) would
  // otherwise sail past viem's regex and throw inside decodeFunctionData.
  if (!data || data === '0x' || data.length < 10 || data.length % 2 !== 0) {
    return EMPTY_DATA_RESULT()
  }

  const selector = data.slice(0, 10) as `0x${string}`

  if (options.abi) {
    const decoded = tryDecodeWithAbi(data, options.abi)
    if (decoded) {
      return { selector, ...decoded, source: 'abi-prop' }
    }
  }

  if (options.registry) {
    const descriptor = options.registry[registryKey(chain, call.to)]
    if (descriptor) {
      const decoded = tryDecodeWithAbi(data, descriptor.abi)
      if (decoded) {
        return {
          selector,
          ...decoded,
          clearSigning: descriptor.clearSigning?.[decoded.functionName],
          source: 'registry',
        }
      }
    }
  }

  if (options.fourByte) {
    const lookup = await options.fourByte(selector)
    if (lookup) {
      return {
        selector,
        functionName: lookup.name,
        args: [],
        source: 'fourbyte',
      }
    }
  }

  return {
    selector,
    functionName: null,
    args: [],
    source: 'unknown',
  }
}

const tryDecodeWithAbi = (data: `0x${string}`, abi: Abi): { functionName: string; args: ReadonlyArray<DecodedArg> } | null => {
  try {
    const decoded = decodeFunctionData({ abi, data })
    const abiFunction = abi.find((item): item is AbiFunction => {
      return item.type === 'function' && item.name === decoded.functionName
    })

    if (!abiFunction) {
      return null
    }

    const decodedArgs = decoded.args
    const args: DecodedArg[] = abiFunction.inputs.map((input, index) => ({
      name: input.name ?? null,
      type: input.type,
      value: Array.isArray(decodedArgs) ? decodedArgs[index] : undefined,
    }))

    return { functionName: decoded.functionName, args }
  } catch {
    return null
  }
}
