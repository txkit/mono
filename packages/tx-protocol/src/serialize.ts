import type { PreparedEnvelope } from './types'
import { validateEnvelope } from './validate'

/**
 * Serialize an envelope to canonical JSON.
 *
 * All amounts in content (`value`, token amounts, fees, etc.) are already
 * strings (hex for raw EVM fields, decimal for user-facing amounts), so no
 * bigint handling is required. This is intentional: the shape does not use
 * bigint in any JSON-facing field.
 */
export function serialize(envelope: PreparedEnvelope): string {
  return JSON.stringify(envelope)
}

/**
 * Parse and validate a serialized envelope.
 * Throws if the JSON is malformed or if validation fails in strict mode.
 */
export function deserialize(json: string): PreparedEnvelope {
  const parsed: unknown = JSON.parse(json)
  const result = validateEnvelope(parsed, { mode: 'strict' })
  if (!result.ok) {
    throw new Error(`deserialize: ${result.error}`)
  }
  return result.value
}
