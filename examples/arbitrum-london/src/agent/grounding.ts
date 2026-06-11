import { formatUnits } from 'viem'

import { KNOWN_TOKENS } from './envelope-builder'
import type { PreparePendleYieldSwapArgs, PrepareRwaBuyArgs } from './tools'


/**
 * Deterministic input-grounding guard for LLM tool calls. Even at temperature
 * 0 the model occasionally invents a missing parameter (e.g. defaults the swap
 * amount to the system prompt's "100 USDC" conversion example) instead of
 * asking for it. Before an envelope is built, every user-supplied parameter
 * must literally appear in the user's side of the conversation; when one does
 * not, the route rejects the tool call and replies with the clarifying
 * question the model should have asked. Same family of checks as the on-chain
 * policy gate: do not trust the agent, verify its output against the source
 * of truth.
 */

// Every decimal number in the text. Digit-group commas ("1,000") are joined
// first so a thousands separator never splits one number into two. Exact ===
// comparison downstream is safe: formatUnits output for amounts a human types
// ("0.3", "1.5", "1000") round-trips through Number losslessly.
const extractNumbers = (text: string): number[] => {
  const matches = text.replace(/(\d),(?=\d)/g, '$1').match(/\d+(?:\.\d+)?/g) || []

  return matches.map(Number)
}

/**
 * The user may name the underlying company instead of the ticker the model
 * normalizes to - both count as having stated the asset.
 */
const ASSET_ALIASES: Record<PrepareRwaBuyArgs['asset'], string[]> = {
  TSLA: [ 'TSLA', 'TESLA' ],
  AMZN: [ 'AMZN', 'AMAZON' ],
  PLTR: [ 'PLTR', 'PALANTIR' ],
}

/**
 * Returns the clarifying question to send instead of an envelope when the
 * swap amount is not grounded in the user's messages, or null when grounded.
 */
export const resolvePendleClarify = (args: PreparePendleYieldSwapArgs, userText: string): string | null => {
  const { symbol, decimals } = KNOWN_TOKENS[args.tokenIn.toLowerCase()] || { symbol: 'tokens', decimals: 18 }

  const humanAmount = Number(formatUnits(BigInt(args.amountIn), decimals))
  const isAmountGrounded = extractNumbers(userText).includes(humanAmount)
  if (!isAmountGrounded) {
    return `How much ${symbol} would you like to swap?`
  }

  return null
}

/**
 * Returns the clarifying question to send instead of an envelope when the
 * asset or the amount is not grounded in the user's messages, or null when
 * both are grounded.
 */
export const resolveRwaClarify = (args: PrepareRwaBuyArgs, userText: string): string | null => {
  const upperText = userText.toUpperCase()

  const isAssetGrounded = ASSET_ALIASES[args.asset].some((alias) => upperText.includes(alias))
  if (!isAssetGrounded) {
    return 'Which asset would you like to buy - TSLA, AMZN, or PLTR?'
  }

  const isAmountGrounded = extractNumbers(userText).includes(args.amount)
  if (!isAmountGrounded) {
    return `How many ${args.asset} units would you like to buy?`
  }

  return null
}
