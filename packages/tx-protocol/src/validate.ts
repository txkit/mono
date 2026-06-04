import { preparedEnvelopeSchema, checkIsImplementedKind, checkIsReservedKind } from './schema'
import type { PreparedEnvelope, ValidationIssue, ValidationResult } from './types'

const checkIsRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractKind = (input: unknown): string | undefined => {
  if (!checkIsRecord(input)) {
    return undefined
  }
  const kind = input['kind']
  return typeof kind === 'string' ? kind : undefined
}

export const validateEnvelope = (input: unknown): ValidationResult<PreparedEnvelope> => {
  const postParseIssues: ValidationIssue[] = []

  const kind = extractKind(input)
  if (typeof kind === 'string' && !checkIsImplementedKind(kind)) {
    if (checkIsReservedKind(kind)) {
      return {
        ok: false,
        error: `kind: '${kind}' is reserved for a future spec version and cannot be validated in v0.1`,
        issues: [
          {
            path: 'kind',
            message: `reserved kind '${kind}' is not yet implemented`,
            severity: 'ERROR',
          },
        ],
      }
    }
    return {
      ok: false,
      error: `kind: '${kind}' is unknown`,
      issues: [
        { path: 'kind', message: `unknown kind '${kind}'`, severity: 'ERROR' },
      ],
    }
  }

  const parsed = preparedEnvelopeSchema.safeParse(input)
  if (!parsed.success) {
    const issues: ValidationIssue[] = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      severity: 'ERROR',
    }))
    const primary = issues[0]
    const error = primary ? `${primary.path || 'root'}: ${primary.message}` : 'invalid envelope'
    return { ok: false, error, issues }
  }

  const value: PreparedEnvelope = parsed.data

  const expiryIssue = checkExpiryAlignment(value, postParseIssues)
  if (expiryIssue) {
    postParseIssues.push(expiryIssue)
  }

  if (value.kind === 'evm-tx' || value.kind === 'evm-batch') {
    postParseIssues.push(...deriveEvmAdvisories(value))
  }

  const errors = postParseIssues.filter((issue) => issue.severity === 'ERROR')
  if (errors.length > 0) {
    const primary = errors[0]!
    return {
      ok: false,
      error: `${primary.path || 'root'}: ${primary.message}`,
      issues: errors,
    }
  }

  const warnings = postParseIssues.filter((issue) => issue.severity !== 'ERROR')

  return warnings.length > 0 ? { ok: true, value, warnings } : { ok: true, value }
}

const checkExpiryAlignment = (
  env: PreparedEnvelope,
  existing: ValidationIssue[],
): ValidationIssue | undefined => {
  if (!env.expiresAt) {
    return undefined
  }
  const validityNotAfter = env.content.validity?.notAfter
  if (typeof validityNotAfter !== 'number') {
    return undefined
  }
  const envelopeExpiry = Math.floor(Date.parse(env.expiresAt) / 1000)
  if (!Number.isFinite(envelopeExpiry)) {
    return {
      path: 'expiresAt',
      message: 'expiresAt is not a parseable RFC3339 timestamp',
      severity: 'WARN',
    }
  }
  const alreadyFlagged = existing.find((issue) => issue.path === 'expiresAt') !== undefined
  if (envelopeExpiry !== validityNotAfter && !alreadyFlagged) {
    return {
      path: 'expiresAt',
      message: 'envelope.expiresAt must equal content.validity.notAfter',
      severity: 'ERROR',
    }
  }
  return undefined
}

/**
 * Parse the numeric chain id out of an `eip155:<n>` CAIP-2 chain string.
 * Returns undefined for non-eip155 namespaces or non-numeric references.
 */
const parseEip155ChainId = (chain: string): number | undefined => {
  const [ namespace, reference ] = chain.split(':')
  if (namespace !== 'eip155' || reference === undefined) {
    return undefined
  }
  if (!/^[1-9]\d*$/.test(reference)) {
    return undefined
  }
  return Number(reference)
}

const deriveEvmAdvisories = (
  env: Extract<PreparedEnvelope, { kind: 'evm-tx' | 'evm-batch' }>,
): ValidationIssue[] => {
  const advisories: ValidationIssue[] = []

  const { chain, chainId } = env.content
  const chainReference = parseEip155ChainId(chain)
  const chainIdsDisagree = chainId !== undefined && chainReference !== undefined && chainReference !== chainId
  if (chainIdsDisagree) {
    advisories.push({
      path: 'content.chainId',
      message: `content.chainId (${chainId}) disagrees with content.chain (${chain}); the CAIP-2 reference is authoritative`,
      severity: 'WARN',
    })
  }

  env.content.calls.forEach((call, index) => {
    if (call.operation === 'delegatecall') {
      advisories.push({
        path: `content.calls.${index}.operation`,
        message: 'delegatecall requires explicit wallet verification against allowlisted targets',
        severity: 'WARN',
      })
    }
  })
  env.content.metadata.tokenMovements.forEach((movement, index) => {
    if (movement.kind === 'approve' && movement.isUnlimited === true) {
      advisories.push({
        path: `content.metadata.tokenMovements.${index}`,
        message: 'unlimited (MAX_UINT) approval detected; wallets MUST surface hard warning',
        severity: 'WARN',
      })
    }
  })
  return advisories
}

/**
 * Serialize an envelope to canonical JSON. All amounts in content
 * (value, token amounts, fees) are already strings, so no bigint
 * handling is required.
 */
export const serialize = (envelope: PreparedEnvelope): string => JSON.stringify(envelope)

/**
 * Parse and validate a serialized envelope. Throws if the JSON is
 * malformed or if validation fails.
 */
export const deserialize = (json: string): PreparedEnvelope => {
  const parsed: unknown = JSON.parse(json)
  const result = validateEnvelope(parsed)
  if (!result.ok) {
    throw new Error(`deserialize: ${result.error}`)
  }
  return result.value
}
