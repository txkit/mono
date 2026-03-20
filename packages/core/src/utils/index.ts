import { maxUint256, formatUnits } from 'viem'

import type { TransactionErrorCode, DecodedCalldata } from '../types'


type CxValue = string | undefined | null | false | Record<string, boolean | undefined>

/** Lightweight className builder. Accepts strings, falsy values, and { class: condition } objects */
export const cx = (...args: CxValue[]): string => {
  const classes: string[] = []

  for (const arg of args) {
    if (!arg) {
      continue
    }
    if (typeof arg === 'string') {
      classes.push(arg)
    } else {
      for (const key of Object.keys(arg)) {
        if (arg[key]) {
          classes.push(key)
        }
      }
    }
  }

  return classes.join(' ')
}

/** Truncate an Ethereum address to 0x1234...5678 format */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) {
    return ''
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/** Format a raw bigint token amount with progressive decimal precision */
export const formatTokenAmount = (
  value: bigint,
  decimals: number,
  options?: { dustThreshold?: number; locale?: string },
): string => {
  const { dustThreshold = 0.0001, locale } = options ?? {}
  const formatted = formatUnits(value, decimals)
  const num = Number(formatted)

  if (num === 0) {
    return '0'
  }
  if (num > 0 && num < dustThreshold) {
    return `< ${dustThreshold}`
  }

  const absolute = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  const formatNumber = (value: number, maxFractionDigits: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value)

  if (absolute >= 1_000_000_000) {
    return `${sign}${formatNumber(absolute / 1_000_000_000, 2)}b`
  }
  if (absolute >= 1_000_000) {
    return `${sign}${formatNumber(absolute / 1_000_000, 2)}m`
  }
  if (absolute >= 10_000) {
    return `${sign}${formatNumber(absolute / 1_000, 2)}k`
  }
  if (absolute >= 1_000) {
    return formatNumber(num, 2)
  }
  if (absolute >= 100) {
    return formatNumber(num, 3)
  }
  if (absolute >= 10) {
    return formatNumber(num, 4)
  }
  return formatNumber(num, 5)
}

/** Split a formatted token amount into integer and fractional parts */
export const formatTokenAmountSplit = (
  value: bigint,
  decimals: number,
  options?: { dustThreshold?: number; locale?: string }
): { integer: string; fraction: string; full: string } => {
  const full = formatTokenAmount(value, decimals, options)
  const dotIndex = full.indexOf('.')
  if (dotIndex === -1) {
    return { integer: full, fraction: '', full }
  }
  return {
    integer: full.slice(0, dotIndex),
    fraction: full.slice(dotIndex),
    full,
  }
}

/** Format a number as fiat currency using Intl.NumberFormat */
export const formatFiatAmount = (
  value: number,
  currency = 'USD',
  locale?: string,
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Deep equality comparison for plain objects and arrays */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true
  }
  if (a === null || b === null) {
    return false
  }
  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>

    if (Array.isArray(aObj) !== Array.isArray(bObj)) {
      return false
    }

    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length) {
      return false
    }

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  return false
}

/** Build a block explorer URL for a given chain, hash, and type */
export const getExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string | undefined => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    10: 'https://optimistic.etherscan.io',
    42161: 'https://arbiscan.io',
    8453: 'https://basescan.org',
    137: 'https://polygonscan.com',
  }
  const base = explorers[chainId]
  if (!base) {
    return undefined
  }
  return `${base}/${type}/${hash}`
}

/** Check if approval amount is MAX_UINT256 (unlimited) */
export const isMaxApproval = (amount: bigint): boolean => {
  return amount === maxUint256
}

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

/** Format a decoded arg value into human-readable string */
const formatArgValue = (value: unknown, type: string): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (type === 'address' && typeof value === 'string') {
    return shortenAddress(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((element) => formatArgValue(element, type.replace('[]', ''))).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value, (_key, jsonValue) => typeof jsonValue === 'bigint' ? jsonValue.toString() : jsonValue)
  }
  return String(value)
}

/** Format decoded calldata into human-readable lines */
export const formatDecodedCalldata = (decoded: DecodedCalldata): string => {
  const formattedArgs = decoded.args
    .map((arg) => `  ${arg.name} (${arg.type}): ${formatArgValue(arg.value, arg.type)}`)
    .join('\n')

  return `${decoded.functionName}(\n${formattedArgs}\n)`
}


// --- pollUntil ---

export type PollUntilOptions = {
  /** Polling interval in ms. @default 2000 */
  interval?: number
  /** Timeout in ms. 0 = no timeout. @default 120000 */
  timeout?: number
  /** AbortSignal for cancelation */
  signal?: AbortSignal
}

/** Poll a function until it returns a truthy value or timeout/abort */
export const pollUntil = async <T>(
  fn: () => T | Promise<T>,
  options?: PollUntilOptions
): Promise<NonNullable<T>> => {
  const interval = options?.interval ?? 2000
  const timeout = options?.timeout ?? 120_000
  const start = Date.now()

  while (true) {
    if (options?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const result = await fn()

    if (result) {
      return result as NonNullable<T>
    }

    if (timeout > 0 && Date.now() - start >= timeout) {
      throw new Error('pollUntil timeout')
    }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, interval)

      // If signal aborts during sleep, resolve immediately
      if (options?.signal) {
        const onAbort = () => {
          clearTimeout(timer)
          resolve()
        }
        options.signal.addEventListener('abort', onAbort, { once: true })
      }
    })
  }
}
