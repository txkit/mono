import { z } from 'zod'
import { SPEC_VERSION } from './version'
import { IMPLEMENTED_KINDS, RESERVED_KINDS } from './kinds'

/* ======================================================================
 * Primitives
 * ==================================================================== */

const hexAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'must be a 40-char hex address with 0x prefix')

const hexBytes = z
  .string()
  .regex(/^0x[0-9a-fA-F]*$/, 'must be hex-encoded bytes with 0x prefix')

const hexQuantity = z
  .string()
  .regex(/^0x([0-9a-fA-F]+|0)$/, 'must be hex quantity with 0x prefix')

const caip2Chain = z
  .string()
  .regex(/^[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,41}$/, 'must be CAIP-2 chain id (namespace:reference)')

const decimalString = z
  .string()
  .regex(/^-?(0|[1-9]\d*)$/, 'must be a decimal integer as string')

const rfc3339 = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    'must be RFC3339 timestamp',
  )

/* ======================================================================
 * Envelope sub-schemas
 * ==================================================================== */

export const producerSignatureSchema = z.object({
  scheme: z.string().min(1),
  publicKey: z.string().optional(),
  signature: z.string().min(1),
  coverage: z.enum([ 'envelope', 'content' ]),
})

export const producerSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  signature: producerSignatureSchema.optional(),
})

export const originSchema = z.object({
  url: z.string().min(1),
  verifyStatus: z.enum([ 'VERIFIED', 'UNVERIFIED', 'MISMATCH' ]),
  attestation: z.string().optional(),
})

export const riskWarningSchema = z.object({
  code: z.string().min(1),
  severity: z.enum([ 'INFO', 'WARN', 'CRITICAL' ]),
  message: z.string().min(1),
})

export const scannerVerdictSchema = z.object({
  provider: z.string().min(1),
  verdict: z.string().min(1),
  url: z.string().optional(),
})

export const riskAssessmentSchema = z.object({
  action: z.enum([ 'ALLOW', 'WARN', 'BLOCK' ]),
  score: z.number().min(0).max(100).optional(),
  warnings: z.array(riskWarningSchema),
  scanners: z.array(scannerVerdictSchema).optional(),
})

export const permissionsSchema = z.object({
  context: hexBytes,
  type: z.string().min(1),
  expiry: z.number().int().positive().optional(),
})

export const paymasterServiceSchema = z.object({
  url: z.string().min(1),
  sponsor: hexAddress.optional(),
})

export const capabilitiesSchema = z
  .object({
    atomicRequired: z.boolean().optional(),
    paymasterService: paymasterServiceSchema.optional(),
    permissions: permissionsSchema.optional(),
    requiresAccountType: z.enum([ 'eoa', 'smart-account-7702', 'erc-4337' ]).optional(),
  })
  .catchall(z.unknown())

/* ======================================================================
 * Validity / Description / ActionType
 * ==================================================================== */

export const validitySchema = z.object({
  notBefore: z.number().int().nonnegative().optional(),
  notAfter: z.number().int().positive(),
  nonceKind: z.enum([ 'sequential', 'durable', 'bitmap' ]).optional(),
  blockhashRecency: z.object({ maxAge: z.number().int().positive() }).optional(),
})

export const actionTypeSchema = z.enum([
  'transfer',
  'approve',
  'permit',
  'revoke-approval',
  'swap',
  'stake',
  'unstake',
  'claim',
  'restake',
  'mint',
  'burn',
  'deposit',
  'withdraw',
  'delegate',
  'bridge',
  'admin-op',
  'other',
])

export const descriptionSchema = z.object({
  short: z.string().min(1, 'description.short is required'),
  long: z.string().optional(),
  action: actionTypeSchema,
})

/* ======================================================================
 * TokenMovement / Counterparty / Fee / Estimation / Metadata
 * ==================================================================== */

export const tokenStandardSchema = z.enum([ 'erc20', 'erc721', 'erc1155', 'native' ])

export const tokenMovementKindSchema = z.enum([
  'transfer',
  'approve',
  'permit',
  'mint',
  'burn',
  'revoke',
])

export const tokenMovementSchema = z.object({
  token: z.union([ hexAddress, z.literal('native') ]),
  standard: tokenStandardSchema,
  symbol: z.string().min(1),
  decimals: z.number().int().min(0).max(77),
  amount: decimalString,
  tokenId: decimalString.optional(),
  kind: tokenMovementKindSchema,
  isUnlimited: z.boolean().optional(),
  from: hexAddress,
  to: hexAddress,
  usdValue: z.number().nonnegative().optional(),
})

export const counterpartyRoleSchema = z.enum([
  'recipient',
  'spender',
  'swap-venue',
  'pool',
  'bridge',
  'admin',
  'unknown',
])

export const counterpartyLabelSourceSchema = z.enum([
  'contact_book',
  'protocol_directory',
  'recent_interaction',
  'untrusted',
])

export const counterpartySchema = z.object({
  address: hexAddress,
  role: counterpartyRoleSchema,
  label: z.string().optional(),
  labelSource: counterpartyLabelSourceSchema.optional(),
  similarityWarning: z
    .object({
      similarTo: hexAddress,
      distance: z.number().int().nonnegative(),
    })
    .optional(),
})

export const feeBreakdownSchema = z.object({
  serviceFee: decimalString.optional(),
  slippageCost: decimalString.optional(),
  protocolFee: decimalString.optional(),
  total: decimalString,
  denomination: z.union([ z.literal('native'), hexAddress ]),
})

export const estimationSchema = z.object({
  effectivePrice: z.string().optional(),
  minOutputAmount: decimalString.optional(),
  maxInputAmount: decimalString.optional(),
  expiration: z.number().int().positive().optional(),
  quoteTimestamp: z.number().int().nonnegative().optional(),
})

export const metadataSchema = z.object({
  protocol: z.string().min(1),
  tokenMovements: z.array(tokenMovementSchema),
  counterparties: z.array(counterpartySchema),
  feeBreakdown: feeBreakdownSchema.optional(),
  estimation: estimationSchema.optional(),
  estimatedGas: decimalString.optional(),
})

/* ======================================================================
 * EVM call + content
 * ==================================================================== */

export const callOperationSchema = z.enum([ 'call', 'delegatecall' ])

export const evmCallSchema = z.object({
  to: hexAddress,
  value: hexQuantity.optional(),
  data: hexBytes.optional(),
  operation: callOperationSchema.optional(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
})

export const evmTxContentSchema = z.object({
  chain: caip2Chain,
  chainId: z.number().int().positive().optional(),
  from: hexAddress.optional(),
  calls: z.array(evmCallSchema).min(1),
  validity: validitySchema,
  description: descriptionSchema,
  metadata: metadataSchema,
  decoderRef: z.string().optional(),
  clearSigning: z.record(z.string(), z.unknown()).optional(),
})

/* ======================================================================
 * Signature content
 * ==================================================================== */

export const eip712DomainSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  chainId: z.number().int().positive().optional(),
  verifyingContract: hexAddress.optional(),
  salt: hexBytes.optional(),
})

export const eip712TypeSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
})

export const signatureContentSchema = z.object({
  chain: caip2Chain,
  chainId: z.number().int().positive().optional(),
  from: hexAddress.optional(),
  scheme: z.enum([ 'eip-712', 'personal-sign', 'siwe' ]),
  domain: eip712DomainSchema.optional(),
  types: z.record(z.string(), z.array(eip712TypeSchema)).optional(),
  primaryType: z.string().optional(),
  message: z.record(z.string(), z.unknown()).optional(),
  messageText: z.string().optional(),
  description: descriptionSchema,
  metadata: metadataSchema.optional(),
  validity: validitySchema.optional(),
  erc6492: z.boolean().optional(),
})

/* ======================================================================
 * Base envelope + discriminated union
 * ==================================================================== */

const baseEnvelopeFields = {
  $schema: z.string().url(),
  version: z.literal(SPEC_VERSION),
  id: z.string().max(4096).optional(),
  issuedAt: rfc3339,
  expiresAt: rfc3339.optional(),
  nonce: hexBytes.optional(),
  producer: producerSchema.optional(),
  origin: originSchema.optional(),
  risk: riskAssessmentSchema.optional(),
  capabilities: capabilitiesSchema.optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}

export const evmTxEnvelopeSchema = z.object({
  ...baseEnvelopeFields,
  kind: z.literal('evm-tx'),
  content: evmTxContentSchema.refine((c) => c.calls.length === 1, {
    message: "kind 'evm-tx' requires exactly one call; use 'evm-batch' for more",
    path: [ 'calls' ],
  }),
})

export const evmBatchEnvelopeSchema = z.object({
  ...baseEnvelopeFields,
  kind: z.literal('evm-batch'),
  content: evmTxContentSchema.refine((c) => c.calls.length >= 2, {
    message: "kind 'evm-batch' requires at least 2 calls; use 'evm-tx' for a single call",
    path: [ 'calls' ],
  }),
})

export const signatureEnvelopeSchema = z.object({
  ...baseEnvelopeFields,
  kind: z.literal('signature'),
  content: signatureContentSchema,
})

export const preparedEnvelopeSchema = z.discriminatedUnion('kind', [
  evmTxEnvelopeSchema,
  evmBatchEnvelopeSchema,
  signatureEnvelopeSchema,
])

/* ======================================================================
 * Kind awareness helpers
 * ==================================================================== */

export function isImplementedKind(value: string): boolean {
  return (IMPLEMENTED_KINDS as readonly string[]).includes(value)
}

export function isReservedKind(value: string): boolean {
  return (RESERVED_KINDS as readonly string[]).includes(value)
}
