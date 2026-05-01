import { createEvmTx } from '@txkit/tx-protocol'
import { z } from 'zod'

import { sanitize } from '../sanitize'
import type { ToolDefinition } from '../types'


const hexAddress = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'expected 0x-prefixed 40-hex address')
const hexBytes = z.string().regex(/^0x[0-9a-fA-F]*$/, 'expected 0x-prefixed hex bytes')
const hexQuantity = z.string().regex(/^0x[0-9a-fA-F]+$/, 'expected 0x-prefixed hex quantity')
const caip2Chain = z.string().regex(/^[a-z0-9-]{3,8}:[a-zA-Z0-9-]{1,32}$/, 'expected CAIP-2 chain id')

const actionType = z.enum([
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

const schema = z.object({
  chain: caip2Chain,
  from: hexAddress.optional(),
  calls: z
    .array(
      z.object({
        to: hexAddress,
        data: hexBytes.optional(),
        value: hexQuantity.optional(),
        operation: z.enum([ 'call', 'delegatecall' ]).optional(),
      }),
    )
    .min(1)
    .max(1, 'prepare_evm_tx accepts a single call - use prepare_evm_batch for multiple'),
  validity: z.object({
    notAfter: z.number().int().positive(),
    notBefore: z.number().int().positive().optional(),
  }),
  description: z.object({
    short: z.string().min(1).max(200),
    long: z.string().max(2000).optional(),
    action: actionType,
  }),
  metadata: z
    .object({
      protocol: z.string().max(80).optional(),
    })
    .optional(),
})

type Input = z.infer<typeof schema>

export const prepareEvmTxTool: ToolDefinition<Input> = {
  name: 'prepare_evm_tx',
  description: 'Build a PreparedEnvelope (kind: evm-tx) for a single EVM transaction. Does not sign or broadcast.',
  schema,
  handler: async (input) => {
    const sanitized = sanitize(schema, input)
    if (!sanitized.ok) {
      return { ok: false, error: sanitized.error }
    }

    /* Regex schemas above validate the formats but Zod erases the template-literal
     * types, so we cast at this trust boundary. The shapes are guaranteed by the
     * preceding sanitize() call.
     */
    const envelope = createEvmTx({
      chain: sanitized.value.chain as `${string}:${string}`,
      from: sanitized.value.from as `0x${string}` | undefined,
      calls: sanitized.value.calls.map((call) => ({
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}` | undefined,
        value: call.value as `0x${string}` | undefined,
        operation: call.operation,
      })),
      validity: sanitized.value.validity,
      description: sanitized.value.description,
      metadata: {
        protocol: sanitized.value.metadata?.protocol ?? 'unknown',
        tokenMovements: [],
        counterparties: [],
      },
    })

    return { ok: true, value: envelope }
  },
}
