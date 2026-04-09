import type { TransactionErrorCode } from '../types'


/** Classify wagmi/viem errors into TransactionErrorCode. Traverses cause chain for wrapped errors */
export const classifyError = (error: unknown): TransactionErrorCode => {
  if (!error || typeof error !== 'object') {
    return 'UNKNOWN'
  }

  const err = error as { name?: string; message?: string; shortMessage?: string; cause?: unknown }
  const name = err.name ?? ''
  const message = (err.shortMessage ?? err.message ?? '').toLowerCase()

  if (name === 'UserRejectedRequestError' || message.includes('user rejected') || message.includes('user denied')) {
    return 'USER_REJECTED'
  }
  if (message.includes('insufficient funds') || message.includes('exceeds the balance')) {
    return 'INSUFFICIENT_FUNDS'
  }
  if (message.includes('reverted') || message.includes('execution reverted')) {
    return 'EXECUTION_REVERTED'
  }
  if (message.includes('gas') && (message.includes('estimate') || message.includes('limit'))) {
    return 'GAS_ESTIMATION_FAILED'
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT'
  }
  if (name === 'ChainMismatchError' || message.includes('chain mismatch') || message.includes('wrong network')) {
    return 'CHAIN_MISMATCH'
  }
  if (message.includes('network') || message.includes('disconnected') || message.includes('fetch failed')) {
    return 'NETWORK_ERROR'
  }

  // Traverse cause chain for wrapped viem errors
  if (err.cause && typeof err.cause === 'object') {
    return classifyError(err.cause)
  }

  return 'UNKNOWN'
}

/** Error messages per error code */
const errorMessages: Record<TransactionErrorCode, string> = {
  USER_REJECTED: 'Transaction rejected in wallet',
  INSUFFICIENT_FUNDS: 'Not enough funds to cover gas and value',
  SIMULATION_FAILED: 'Transaction will likely fail',
  EXECUTION_REVERTED: 'Transaction failed on-chain',
  GAS_ESTIMATION_FAILED: 'Could not estimate gas. Transaction may fail',
  NETWORK_ERROR: 'Network error. Check your connection',
  TIMEOUT: 'Transaction is taking longer than expected',
  CHAIN_MISMATCH: 'Please switch to the correct network',
  APPROVAL_FAILED: 'Token approval failed',
  RISK_BLOCKED: 'Transaction blocked by security check',
  UNKNOWN: 'Something went wrong. Please try again',
}

/** Get human-readable error message for a given error code */
export const getErrorMessage = (code: TransactionErrorCode): string => {
  return errorMessages[code]
}
