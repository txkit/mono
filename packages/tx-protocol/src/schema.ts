import { z } from 'zod'
import { SPEC_VERSION } from './version'

const hexAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'must be a 40-char hex address with 0x prefix')

const hexBytes = z
  .string()
  .regex(/^0x[0-9a-fA-F]*$/, 'must be hex-encoded bytes with 0x prefix')

const hexTxHash = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'must be a 32-byte tx hash with 0x prefix')

export const actionTypeSchema = z.enum([
  'stake',
  'unstake',
  'swap',
  'approve',
  'mint',
  'burn',
  'claim',
  'deposit',
  'withdraw',
  'delegate',
  'transfer',
  'other',
])

export const tokenMovementSchema = z.object({
  token: z.union([hexAddress, z.literal('native')]),
  symbol: z.string().min(1),
  decimals: z.number().int().min(0).max(77),
  amount: z.bigint(),
  direction: z.enum(['in', 'out']),
  usdValue: z.number().nonnegative().optional(),
})

export const transactionDescriptionSchema = z.object({
  short: z.string().min(1, 'description.short is required'),
  long: z.string().optional(),
  action: actionTypeSchema,
})

export const simulationHintSchema = z.object({
  expectedSuccess: z.boolean(),
  estimatedGas: z.bigint().nonnegative().optional(),
  simulatedAt: z.number().int().nonnegative().optional(),
  simulator: z.string().optional(),
  notes: z.string().optional(),
})

export const preparedTransactionMetadataSchema = z.object({
  protocol: z.string().min(1),
  primaryToken: tokenMovementSchema.optional(),
  tokenMovements: z.array(tokenMovementSchema),
  counterparties: z.array(hexAddress),
  estimatedGas: z.bigint().nonnegative().optional(),
  simulation: simulationHintSchema.optional(),
})

export const preparedTransactionSequenceSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  previousTxHashes: z.array(hexTxHash).optional(),
})

export const preparedTransactionSchema = z.object({
  version: z.literal(SPEC_VERSION),
  chainId: z.number().int().positive(),
  to: hexAddress,
  data: hexBytes,
  value: z.bigint().nonnegative(),
  description: transactionDescriptionSchema,
  metadata: preparedTransactionMetadataSchema,
  sequence: preparedTransactionSequenceSchema.optional(),
  decoderRef: z
    .string()
    .regex(/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/i, 'decoderRef must be in format protocol/category/method')
    .optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
})

export type PreparedTransactionSchema = typeof preparedTransactionSchema
