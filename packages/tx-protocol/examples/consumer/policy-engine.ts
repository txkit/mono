/**
 * packages/tx-protocol/examples/consumer/policy-engine.ts
 *
 * Reference CONSUMER policy engine for ERC-8265 (Prepared Transaction
 * Envelope). It implements the specification's core consumer thesis:
 *
 *   A consumer re-verifies an envelope against the RAW calls[] / signature
 *   content and its own policy, and NEVER trusts the presentational
 *   description / metadata.
 *
 * See Spec Sec 5.5 ("Description fields are presentational... policy engines,
 * allowlists, spend limits, and risk evaluations MUST NOT be based on
 * description.short or description.action alone; they MUST be evaluated
 * against the raw calls[]"), Sec 7 (consumer-injected RiskAssessment), and the
 * Rationale "Re-preparation at consumption time" (the consumer treats an
 * envelope as a claim to re-verify at the moment of use, not as producer state
 * to trust on faith).
 *
 * Every rule below reads only raw, canonically-authoritative fields:
 * calls[].operation, calls[].to, calls[].data, validity.notAfter / expiresAt,
 * origin.verifyStatus, and producer.signature. The engine deliberately never
 * inspects description.short or description.action when deciding.
 *
 * This file is reference / standards-education code. It is not a product.
 */

import { validateEnvelope } from '@txkit/tx-protocol'
import type {
  EvmCall,
  EvmTxContent,
  PreparedEnvelope,
  RiskAssessment,
  RiskWarning,
} from '@txkit/tx-protocol'

/* ======================================================================
 * Policy configuration
 * ==================================================================== */

/**
 * Allowlist of audited delegatecall targets a consumer trusts. A delegatecall
 * grants its target the full storage and authority of the signing account
 * (Spec Security Considerations, "Delegate-call concealment"), so any
 * delegatecall to a target outside this set is blocked. In a real consumer
 * this list is consumer-owned and registry-backed; here it holds the single
 * canonical Safe MultiSendCallOnly address as an illustration.
 *
 * Addresses are compared case-insensitively (see checkIsAllowlistedTarget).
 */
export const TRUSTED_DELEGATECALL_TARGETS: ReadonlySet<string> = new Set([
  '0x9641d764fc13c8B624c04430C7356C1C7C8102e2', // Safe MultiSendCallOnly v1.4.1
])

/** ERC-20 `approve(address,uint256)` selector. */
const APPROVE_SELECTOR = '0x095ea7b3'

/** 64 hex chars of 0xff: the uint256 MAX_UINT256 amount used by max approvals. */
const MAX_UINT256_HEX = 'f'.repeat(64)

export type PolicyEngineOptions = {
  /** Current time in Unix seconds. Injected so expiry checks are deterministic. */
  nowSeconds?: number
}

/* ======================================================================
 * Boolean helpers (checkIs* per the project naming rule)
 * ==================================================================== */

const checkIsEvmContent = (envelope: PreparedEnvelope): envelope is Extract<
  PreparedEnvelope,
  { kind: 'evm-tx' | 'evm-batch' }
> => envelope.kind === 'evm-tx' || envelope.kind === 'evm-batch'

const checkIsAllowlistedTarget = (address: string): boolean => {
  const normalizedTarget = address.toLowerCase()

  for (const trusted of TRUSTED_DELEGATECALL_TARGETS) {
    if (trusted.toLowerCase() === normalizedTarget) {
      return true
    }
  }

  return false
}

const checkIsDelegatecallToUnknown = (call: EvmCall): boolean => {
  const isDelegatecall = call.operation === 'delegatecall'

  return isDelegatecall && !checkIsAllowlistedTarget(call.to)
}

/**
 * True when the raw calldata is an `approve(spender, MAX_UINT256)`. This reads
 * calls[].data directly rather than trusting metadata.isUnlimited, so a lying
 * producer that omits the flag is still caught.
 */
const checkIsRawMaxUintApproval = (call: EvmCall): boolean => {
  const data = call.data ?? '0x'
  const hasApproveSelector = data.toLowerCase().startsWith(APPROVE_SELECTOR)
  if (!hasApproveSelector) {
    return false
  }
  const amountWord = data.slice(APPROVE_SELECTOR.length + 64).toLowerCase()

  return amountWord === MAX_UINT256_HEX
}

const checkIsExpired = (content: EvmTxContent, nowSeconds: number): boolean => {
  const notAfter = content.validity?.notAfter

  return typeof notAfter === 'number' && nowSeconds > notAfter
}

const checkIsBlockingSeverity = (severity: RiskWarning['severity']): boolean =>
  severity === 'critical'

/* ======================================================================
 * Raw-field rule evaluation
 * ==================================================================== */

const collectCallWarnings = (calls: EvmCall[]): RiskWarning[] => {
  const warnings: RiskWarning[] = []

  calls.forEach((call, index) => {
    if (checkIsDelegatecallToUnknown(call)) {
      warnings.push({
        code: 'delegatecall-to-unknown',
        severity: 'critical',
        message:
          `calls[${index}] is a delegatecall to ${call.to}, which is not in the trusted `
          + 'delegatecall allowlist; a delegatecall grants the target full account authority',
      })
    }
    if (checkIsRawMaxUintApproval(call)) {
      warnings.push({
        code: 'unbounded-approval',
        severity: 'high',
        message:
          `calls[${index}] raw calldata encodes an approve(spender, MAX_UINT256) unbounded `
          + 'allowance, decoded from calls[].data (not from metadata)',
      })
    }
  })

  return warnings
}

const collectTokenMovementWarnings = (content: EvmTxContent): RiskWarning[] => {
  const warnings: RiskWarning[] = []
  const isAlreadyFlaggedFromCalls = content.calls.some(checkIsRawMaxUintApproval)

  content.metadata.tokenMovements.forEach((movement, index) => {
    const isUnboundedMovement = movement.isUnlimited === true
    if (isUnboundedMovement && !isAlreadyFlaggedFromCalls) {
      warnings.push({
        code: 'unbounded-approval',
        severity: 'high',
        message:
          `tokenMovements[${index}] is flagged isUnlimited (unbounded allowance grant)`,
      })
    }
  })

  return warnings
}

const collectEvmContentWarnings = (
  content: EvmTxContent,
  nowSeconds: number,
): RiskWarning[] => {
  const warnings: RiskWarning[] = [
    ...collectCallWarnings(content.calls),
    ...collectTokenMovementWarnings(content),
  ]

  if (checkIsExpired(content, nowSeconds)) {
    warnings.push({
      code: 'expired',
      severity: 'critical',
      message:
        `envelope is past its validity.notAfter (${content.validity.notAfter}); `
        + `now is ${nowSeconds}. A consumer MUST NOT submit and SHOULD re-prepare`,
    })
  }

  return warnings
}

const collectEnvelopeWarnings = (envelope: PreparedEnvelope): RiskWarning[] => {
  const warnings: RiskWarning[] = []

  const { origin, producer } = envelope
  const originVerifyStatus = origin?.verifyStatus
  const originUrl = origin?.url

  if (originVerifyStatus === 'MISMATCH') {
    warnings.push({
      code: 'origin-mismatch',
      severity: 'critical',
      message:
        `origin.verifyStatus is MISMATCH for ${originUrl}; an attestation source `
        + 'returned a different value than the claimed origin',
    })
  }
  if (originVerifyStatus === 'UNVERIFIED') {
    warnings.push({
      code: 'origin-unverified',
      severity: 'medium',
      message: `origin.verifyStatus is UNVERIFIED for ${originUrl}; no attestation source confirmed it`,
    })
  }
  if (!producer?.signature) {
    warnings.push({
      code: 'unsigned-producer',
      severity: 'medium',
      message:
        'producer.signature is absent; off-chain fields are advisory only and only the '
        + 'raw calls[] and consumer policy are verifiable',
    })
  }

  return warnings
}

/* ======================================================================
 * Aggregation
 * ==================================================================== */

const deriveAction = (warnings: RiskWarning[]): RiskAssessment['action'] => {
  const hasBlockingWarning = warnings.some((warning) => checkIsBlockingSeverity(warning.severity))
  if (hasBlockingWarning) {
    return 'BLOCK'
  }

  return warnings.length > 0 ? 'WARN' : 'ALLOW'
}

/* ======================================================================
 * Public entry point
 * ==================================================================== */

/**
 * Re-verify an envelope and produce a consumer-injected RiskAssessment.
 *
 * Step 1 runs validateEnvelope: a structurally invalid envelope is blocked
 * outright, because a consumer that cannot parse the raw fields cannot trust
 * anything in the envelope. Step 2 evaluates the RAW fields against consumer
 * policy. description.short and description.action are never consulted.
 */
export const assessEnvelope = (
  input: unknown,
  options: PolicyEngineOptions = {},
): RiskAssessment => {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000)

  const validation = validateEnvelope(input)
  if (!validation.ok) {
    const { error } = validation

    return {
      action: 'BLOCK',
      warnings: [
        {
          code: 'schema-invalid',
          severity: 'critical',
          message: `envelope failed structural validation: ${error}`,
        },
      ],
    }
  }

  const { value } = validation
  const envelope = value

  const warnings: RiskWarning[] = [ ...collectEnvelopeWarnings(envelope) ]
  if (checkIsEvmContent(envelope)) {
    warnings.push(...collectEvmContentWarnings(envelope.content, nowSeconds))
  }

  return {
    action: deriveAction(warnings),
    warnings,
  }
}
