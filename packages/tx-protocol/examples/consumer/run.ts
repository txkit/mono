/**
 * packages/tx-protocol/examples/consumer/run.ts
 *
 * CLI that feeds each fixture envelope through the reference consumer policy
 * engine and prints the decision plus reasons. It exists so a reviewer SEES
 * the consumer side of ERC-8265 working end to end: every decision is computed
 * from the RAW calls[] / signature content and consumer policy, never from the
 * presentational description.
 *
 * The adversarial case is rendered side by side so the anti-spoof thesis is
 * visually obvious: the description says one thing, the raw call is another,
 * and the engine blocks on the raw call.
 *
 * Run:
 *   pnpm exec tsx packages/tx-protocol/examples/consumer/run.ts
 *
 * This is reference / standards-education code, not a product.
 */

import { assessEnvelope } from './policy-engine'
import type { PolicyEngineOptions } from './policy-engine'
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
import type { EvmTxEnvelope, RiskAssessment } from '@txkit/tx-protocol'

/* A fixed clock so the printed output is deterministic for `expired` cases. */
const RUN_OPTIONS: PolicyEngineOptions = { nowSeconds: 1_900_000_000 }

type Case = {
  title: string
  envelope: EvmTxEnvelope
  expected: RiskAssessment['action']
}

const cases: Case[] = [
  { title: 'Clean transfer (StakeWise deposit)', envelope: cleanTransferEnvelope(), expected: 'ALLOW' },
  { title: 'delegatecall to unknown target', envelope: delegatecallToUnknownEnvelope(), expected: 'BLOCK' },
  { title: 'Unbounded approval (metadata flag)', envelope: unboundedApprovalEnvelope(), expected: 'WARN' },
  { title: 'Unbounded approval (raw MAX_UINT calldata)', envelope: rawMaxUintApprovalEnvelope(), expected: 'WARN' },
  { title: 'Expired envelope', envelope: expiredEnvelope(), expected: 'BLOCK' },
  { title: 'Unsigned producer', envelope: unsignedProducerEnvelope(), expected: 'WARN' },
  { title: 'Origin MISMATCH', envelope: originMismatchEnvelope(), expected: 'BLOCK' },
  { title: 'Origin UNVERIFIED', envelope: originUnverifiedEnvelope(), expected: 'WARN' },
]

const DECISION_GLYPH: Record<RiskAssessment['action'], string> = {
  ALLOW: '[ ALLOW ]',
  WARN: '[ WARN  ]',
  BLOCK: '[ BLOCK ]',
}

const printAssessment = (assessment: RiskAssessment): void => {
  const { action, warnings } = assessment

  console.log(`  decision: ${DECISION_GLYPH[action]} ${action}`)
  if (warnings.length === 0) {
    console.log('  reasons : (none - raw calls and policy cleared)')

    return
  }
  console.log('  reasons :')
  for (const warning of warnings) {
    const { severity, code, message } = warning

    console.log(`    - [${severity}] ${code}`)
    console.log(`        ${message}`)
  }
}

const runStandardCases = (): boolean => {
  let areAllMatched = true

  for (const testCase of cases) {
    const { title, envelope, expected } = testCase
    const { description, calls } = envelope.content
    const assessment = assessEnvelope(envelope, RUN_OPTIONS)
    const isMatched = assessment.action === expected
    areAllMatched = areAllMatched && isMatched

    console.log('')
    console.log(`* ${title}`)
    console.log(`  description.short: "${description.short}"`)
    console.log(`  raw call[0]      : operation=${calls[0]!.operation} to=${calls[0]!.to}`)
    printAssessment(assessment)
    console.log(`  expected ${expected} -> ${isMatched ? 'OK' : 'MISMATCH'}`)
  }

  return areAllMatched
}

const runAdversarialSpotlight = (): boolean => {
  const envelope = lyingDescriptionEnvelope()
  const { calls, description } = envelope.content
  const rawCall = calls[0]!
  const assessment = assessEnvelope(envelope, RUN_OPTIONS)
  const isMatched = assessment.action === 'BLOCK'

  console.log('')
  console.log('======================================================================')
  console.log(' ADVERSARIAL CASE - description vs raw call')
  console.log('======================================================================')
  console.log(`  description SAID : "${description.short}" (action=${description.action})`)
  console.log(`  raw call IS     : operation=${rawCall.operation} to=${rawCall.to}`)
  console.log('  a description-trusting consumer would ALLOW this benign-looking approval')
  console.log('  a raw-verifying consumer (this engine) decides from calls[]:')
  printAssessment(assessment)
  console.log(`  thesis upheld   : ${isMatched ? 'YES - blocked on the raw delegatecall, description ignored' : 'NO'}`)

  return isMatched
}

const main = (): void => {
  console.log('ERC-8265 reference CONSUMER policy engine')
  console.log('Each decision is computed from raw calls[] + consumer policy, never from description.')

  const isStandardMatched = runStandardCases()
  const isAdversarialMatched = runAdversarialSpotlight()

  console.log('')
  console.log('======================================================================')
  const areAllMatched = isStandardMatched && isAdversarialMatched
  if (!areAllMatched) {
    console.error('One or more cases did not produce the expected decision.')
    process.exit(1)
  }
  console.log('All cases produced their expected decision from raw fields.')
}

main()
