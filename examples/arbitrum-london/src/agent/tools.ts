import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'


/**
 * Tool schemas for Claude Agent SDK. Each tool has a zod-validated arg
 * shape so the envelope builder can trust the inputs without re-parsing.
 *
 * Scenario A: prepare_pendle_yield_swap (Arbitrum Sepolia)
 * Scenario C: prepare_rwa_buy (Robinhood Chain testnet)
 */

export const preparePendleYieldSwapArgs = z.object({
  tokenIn: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe('ERC-20 token to swap from (e.g. USDC on Arbitrum Sepolia)'),
  tokenOut: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe('Pendle PT (Principal Token) to receive'),
  amountIn: z
    .string()
    .regex(/^\d+$/)
    .describe('Amount in tokenIn raw units (no decimals)'),
  slippageBps: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(50)
    .describe('Slippage tolerance in basis points (50 = 0.5%)'),
})

export type PreparePendleYieldSwapArgs = z.infer<typeof preparePendleYieldSwapArgs>

export const prepareRwaBuyArgs = z.object({
  asset: z
    .enum([ 'TSLA', 'AMZN', 'PLTR' ])
    .describe('Mock RWA ticker available on Robinhood Chain testnet faucet'),
  amount: z.coerce
    .number()
    .int()
    .positive()
    .describe('Whole-token amount to buy (mock units)'),
})

export type PrepareRwaBuyArgs = z.infer<typeof prepareRwaBuyArgs>

/**
 * Anthropic tool definitions. Passed to the Claude SDK so the model
 * understands what is callable.
 */
export const PENDLE_TOOL_DEFINITION = {
  name: 'prepare_pendle_yield_swap',
  description:
    'Prepare a Pendle yield-swap envelope. Call only once the user has explicitly stated the amount to swap - never assume one. Returns a typed PreparedEnvelope that the user reviews and signs.',
  input_schema: {
    type: 'object',
    properties: {
      tokenIn: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      tokenOut: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      amountIn: {
        type: 'string',
        pattern: '^\\d+$',
        description: 'Raw token units converted from the amount the user explicitly stated. Never a default or assumed value.',
      },
      slippageBps: { type: 'string', pattern: '^\\d+$' },
    },
    required: [ 'tokenIn', 'tokenOut', 'amountIn' ],
  },
} satisfies Anthropic.Tool

export const RWA_TOOL_DEFINITION = {
  name: 'prepare_rwa_buy',
  description:
    'Prepare a mock RWA purchase envelope on Robinhood Chain testnet. Call only once the user has explicitly stated both the asset and the amount - never assume either. Requires the user to have paid the x402 challenge first.',
  input_schema: {
    type: 'object',
    properties: {
      asset: {
        type: 'string',
        enum: [ 'TSLA', 'AMZN', 'PLTR' ],
        description: 'The ticker the user explicitly asked to buy. Never a default or assumed value.',
      },
      amount: {
        type: 'string',
        pattern: '^\\d+$',
        description: 'Whole-token amount the user explicitly stated. Never a default or assumed value.',
      },
    },
    required: [ 'asset', 'amount' ],
  },
} satisfies Anthropic.Tool
