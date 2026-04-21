import type { PreparedTransaction } from './types'
import { validatePreparedTx } from './validate'

const BIGINT_SUFFIX = 'n'

function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString() + BIGINT_SUFFIX
  }
  return value
}

function bigintReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1))
  }
  return value
}

export function serialize(tx: PreparedTransaction): string {
  return JSON.stringify(tx, bigintReplacer)
}

export function deserialize(json: string): PreparedTransaction {
  const parsed: unknown = JSON.parse(json, bigintReviver)
  const result = validatePreparedTx(parsed)
  if (!result.ok) {
    throw new Error(`deserialize: ${result.error}`)
  }
  return result.value
}
