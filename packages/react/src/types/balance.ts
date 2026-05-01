import type { ReactNode } from 'react'

import type { TokenBalanceLabels } from '../components/TokenBalance/labels'


/** Data passed to children render function */
export type TokenBalanceRenderData = {
  /** Token icon URL (passed via icon prop) */
  icon: string | undefined
  /** Raw balance in smallest unit (wei) */
  balance: bigint | undefined
  /** Token decimals (18 for ETH, 6 for USDC) */
  decimals: number | undefined
  /** Token symbol (ETH, USDC) */
  symbol: string | undefined
  /** Human-readable balance with progressive scaling (e.g. "1.23k") */
  formatted: string | undefined
  /** Integer part of formatted balance (e.g. "1,234") */
  integerPart: string | undefined
  /** Fractional part including dot (e.g. ".5678") */
  fractionPart: string | undefined
  /** True when balance is exactly zero */
  isZero: boolean
  /** Fiat equivalent as raw number */
  fiatValue: number | undefined
  /** Fiat equivalent formatted with currency symbol (e.g. "$1,234.57") */
  fiatFormatted: string | undefined
  /** True while balance is being fetched */
  isLoading: boolean
  /** True if balance fetch failed */
  isError: boolean
  /** Error object if fetch failed */
  error: Error | null
  /** Manually trigger balance refetch */
  refetch: () => void
}

/** Options for number formatting */
export type TokenBalanceFormatOptions = {
  /** Amounts below this show as "< 0.0001". @default 0.0001 */
  dustThreshold?: number
  /** BCP 47 locale for number formatting. @default browser locale */
  locale?: string
}

export type TokenBalanceDefaultProps = {
  icon: string | undefined
  name: string | undefined
  symbol: string | undefined
  variant: 'inline' | 'row'
  amountText: string
  statusText: string
  retryLabel: string
  integerPart: string
  fractionPart: string
  fiatFormatted: string | undefined
  isReady: boolean
  isError: boolean
  showFiat: boolean
  showIcon: boolean
  showSymbol: boolean
  onRetry: () => void
}

export type TokenBalanceProps = {
  className?: string
  children?: (data: TokenBalanceRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Layout variant: inline (default) for embedding, row for token lists */
  variant?: 'inline' | 'row'
  /** Token icon URL */
  icon?: string
  /** Token display name for row variant (e.g. "USD Coin") */
  name?: string
  /** ERC-20 contract address - omit for native token */
  token?: `0x${string}`
  /** Wallet address to check balance for - defaults to connected wallet */
  address?: `0x${string}`
  /** Fiat currency code for price display (e.g. "USD", "EUR") */
  fiatCurrency?: string
  /** Manual token price in fiat - overrides DeFiLlama auto-fetch */
  price?: number
  /** Chain to query balance on - defaults to connected chain */
  chainId?: number
  /** Balance polling interval in milliseconds */
  refetchInterval?: number
  /** Override default UI text strings */
  labels?: Partial<TokenBalanceLabels>
  /** Number formatting options (dust threshold, locale) */
  formatOptions?: TokenBalanceFormatOptions
  /** Show fiat equivalent below token balance */
  showFiat?: boolean
  /** Show token icon */
  showIcon?: boolean
  /** Show token symbol next to balance */
  showSymbol?: boolean
  /** Called when balance fetch fails */
  onError?: (error: Error) => void
  /** Called when balance changes with new and previous values */
  onBalanceChange?: (balance: bigint, prevBalance: bigint | undefined) => void
}
