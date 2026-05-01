export type TokenBalanceLabels = {
  /** Text shown while balance is loading */
  loading?: string
  /** Text shown when balance fetch fails */
  error?: string
  /** Button text to retry failed fetch */
  retry?: string
}

export const defaultLabels: Required<TokenBalanceLabels> = {
  loading: 'Loading...',
  error: '-',
  retry: 'Retry',
}
