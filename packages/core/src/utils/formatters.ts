import { formatUnits } from 'viem'

import type { DecodedCalldata } from '../types'

import { shortenAddress } from './address'


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
