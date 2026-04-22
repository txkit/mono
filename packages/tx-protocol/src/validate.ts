import { preparedEnvelopeSchema, isImplementedKind, isReservedKind } from './schema'
import type { PreparedEnvelope, ValidationIssue, ValidationResult } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractKind(input: unknown): string | undefined {
  if (!isRecord(input)) {
    return undefined
  }
  const kind = input['kind']
  return typeof kind === 'string' ? kind : undefined
}

export function validateEnvelope(input: unknown): ValidationResult<PreparedEnvelope> {
  const warnings: ValidationIssue[] = []

  const kind = extractKind(input)
  if (typeof kind === 'string' && !isImplementedKind(kind)) {
    if (isReservedKind(kind)) {
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
    const issues: ValidationIssue[] = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      severity: 'ERROR',
    }))
    const primary = issues[0]
    const error = primary ? `${primary.path || 'root'}: ${primary.message}` : 'invalid envelope'
    return { ok: false, error, issues }
  }

  const value = parsed.data as PreparedEnvelope

  const expiryWarning = checkExpiryAlignment(value, warnings)
  if (expiryWarning) {
    warnings.push(expiryWarning)
  }

  if (value.kind === 'evm-tx' || value.kind === 'evm-batch') {
    warnings.push(...deriveEvmAdvisories(value))
  }

  return warnings.length > 0 ? { ok: true, value, warnings } : { ok: true, value }
}

function checkExpiryAlignment(
  env: PreparedEnvelope,
  existing: ValidationIssue[],
): ValidationIssue | undefined {
  if (!env.expiresAt) {
    return undefined
  }
  if (env.kind === 'signature') {
    return undefined
  }
  const validityNotAfter = env.content.validity.notAfter
  const envelopeExpiry = Math.floor(Date.parse(env.expiresAt) / 1000)
  if (!Number.isFinite(envelopeExpiry)) {
    return {
      path: 'expiresAt',
      message: 'expiresAt is not a parseable RFC3339 timestamp',
      severity: 'WARN',
    }
  }
  if (envelopeExpiry !== validityNotAfter && !existing.find((w) => w.path === 'expiresAt')) {
    return {
      path: 'expiresAt',
      message: 'envelope.expiresAt should equal content.validity.notAfter',
      severity: 'WARN',
    }
  }
  return undefined
}

function deriveEvmAdvisories(
  env: Extract<PreparedEnvelope, { kind: 'evm-tx' | 'evm-batch' }>,
): ValidationIssue[] {
  const advisories: ValidationIssue[] = []
  env.content.calls.forEach((call, idx) => {
    if (call.operation === 'delegatecall') {
      advisories.push({
        path: `content.calls.${idx}.operation`,
        message: 'delegatecall requires explicit wallet verification against allowlisted targets',
        severity: 'WARN',
      })
    }
  })
  env.content.metadata.tokenMovements.forEach((mv, idx) => {
    if (mv.kind === 'approve' && mv.isUnlimited === true) {
      advisories.push({
        path: `content.metadata.tokenMovements.${idx}`,
        message: 'unlimited (MAX_UINT) approval detected; wallets MUST surface hard warning',
        severity: 'WARN',
      })
    }
  })
  return advisories
}
