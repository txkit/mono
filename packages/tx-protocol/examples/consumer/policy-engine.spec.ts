/**
 * packages/tx-protocol/examples/consumer/policy-engine.spec.ts
 *
 * Test-first specification for the reference consumer policy engine.
 *
 * Each case encodes one clause of the ERC-8265 consumer thesis: a consumer
 * re-verifies an envelope against the RAW calls[] / signature content and its
 * own policy, and NEVER trusts the presentational description / metadata
 * (Spec Sec 5.5, Sec 7, and the Rationale "Re-preparation at consumption time").
 *
 * The centerpiece is the adversarial case: a benign-looking description.short
 * over a raw delegatecall to an unknown target. The engine MUST block on the
 * raw call and ignore the description entirely.
 */

import { describe, expect, it } from 'vitest'
import { assessEnvelope, TRUSTED_DELEGATECALL_TARGETS } from './policy-engine'
import {
  cleanTransferEnvelope,
  delegatecallToUnknownEnvelope,
  lyingDescriptionEnvelope,
  unboundedApprovalEnvelope,
  rawMaxUintApprovalEnvelope,
  expiredEnvelope,
  unsignedProducerEnvelope,
  originMismatchEnvelope,
  originUnverifiedEnvelope,
} from './fixtures'

/* A fixed "now" so expiry assertions are deterministic regardless of wall clock. */
const FIXED_NOW_SECONDS = 1_900_000_000

const findWarning = (
  assessment: { warnings: { code: string }[] },
  code: string,
): boolean => assessment.warnings.some((warning) => warning.code === code)

describe('clean transfer -> ALLOW', () => {
  it('allows a signed, verified, in-validity plain transfer with no risky raw calls', () => {
    const assessment = assessEnvelope(cleanTransferEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('ALLOW')
    expect(assessment.warnings).toHaveLength(0)
  })
})

describe('delegatecall to unknown target -> BLOCK on the raw call', () => {
  it('blocks a delegatecall whose to-address is not in the allowlist', () => {
    const assessment = assessEnvelope(delegatecallToUnknownEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('BLOCK')
    expect(findWarning(assessment, 'delegatecall-to-unknown')).toBe(true)
  })

  it('does NOT block a delegatecall whose to-address is in the allowlist', () => {
    const allowedTarget = [...TRUSTED_DELEGATECALL_TARGETS][0] as `0x${string}`
    const envelope = delegatecallToUnknownEnvelope()
    envelope.content.calls[0]!.to = allowedTarget

    const assessment = assessEnvelope(envelope, { nowSeconds: FIXED_NOW_SECONDS })

    expect(findWarning(assessment, 'delegatecall-to-unknown')).toBe(false)
  })
})

describe('lying description over a raw delegatecall -> BLOCK on raw, ignore description', () => {
  it('blocks despite a benign description.short and a benign description.action', () => {
    const envelope = lyingDescriptionEnvelope()

    /* Sanity: the presentational layer really does claim something benign. */
    expect(envelope.content.description.short.toLowerCase()).toContain('approve')
    expect(envelope.content.description.action).toBe('approve')
    /* ...while the raw call is a delegatecall to an unknown address. */
    expect(envelope.content.calls[0]!.operation).toBe('delegatecall')

    const assessment = assessEnvelope(envelope, { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('BLOCK')
    expect(findWarning(assessment, 'delegatecall-to-unknown')).toBe(true)
  })
})

describe('unbounded approval -> WARN', () => {
  it('warns when a token movement is flagged isUnlimited', () => {
    const assessment = assessEnvelope(unboundedApprovalEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('WARN')
    expect(findWarning(assessment, 'unbounded-approval')).toBe(true)
  })

  it('warns on a raw approve(spender, MAX_UINT256) even when metadata omits isUnlimited', () => {
    const assessment = assessEnvelope(rawMaxUintApprovalEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(findWarning(assessment, 'unbounded-approval')).toBe(true)
  })
})

describe('expired envelope -> BLOCK', () => {
  it('blocks when nowSeconds is past validity.notAfter', () => {
    const assessment = assessEnvelope(expiredEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('BLOCK')
    expect(findWarning(assessment, 'expired')).toBe(true)
  })
})

describe('unsigned producer -> WARN', () => {
  it('warns when producer.signature is absent', () => {
    const assessment = assessEnvelope(unsignedProducerEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('WARN')
    expect(findWarning(assessment, 'unsigned-producer')).toBe(true)
  })
})

describe('origin verifyStatus', () => {
  it('blocks on origin.verifyStatus MISMATCH', () => {
    const assessment = assessEnvelope(originMismatchEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('BLOCK')
    expect(findWarning(assessment, 'origin-mismatch')).toBe(true)
  })

  it('warns on origin.verifyStatus UNVERIFIED', () => {
    const assessment = assessEnvelope(originUnverifiedEnvelope(), { nowSeconds: FIXED_NOW_SECONDS })

    expect(assessment.action).toBe('WARN')
    expect(findWarning(assessment, 'origin-unverified')).toBe(true)
  })
})

describe('schema gate runs before raw evaluation', () => {
  it('blocks a structurally invalid envelope without trusting any field', () => {
    const assessment = assessEnvelope({ kind: 'evm-tx', not: 'a valid envelope' }, {
      nowSeconds: FIXED_NOW_SECONDS,
    })

    expect(assessment.action).toBe('BLOCK')
    expect(findWarning(assessment, 'schema-invalid')).toBe(true)
  })
})
