export type IconSource = 'none' | 'trustwallet' | 'oneinch' | 'custom'

export type IconSourceValue = {
  source: IconSource
  customUrl: string
}

export const ICON_SOURCE_DEFAULT: IconSourceValue = {
  source: 'none',
  customUrl: '',
}

export const ICON_SOURCE_LABELS: Record<IconSource, string> = {
  none: 'None',
  trustwallet: 'Trust Wallet',
  oneinch: '1inch',
  custom: 'Custom URL',
}

export const ICON_SOURCE_OPTIONS: readonly IconSource[] = [ 'none', 'trustwallet', 'oneinch', 'custom' ]

const TRUSTWALLET_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum'
const ONEINCH_BASE = 'https://tokens.1inch.io'
const NATIVE_PSEUDO_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const isNativeToken = (tokenAddress: string): boolean => {
  if (tokenAddress === '') {
    return true
  }
  return tokenAddress.toLowerCase() === NATIVE_PSEUDO_ADDRESS
}

export const resolveTokenIconUrl = (tokenAddress: string, value: IconSourceValue): string | undefined => {
  if (value.source === 'none') {
    return undefined
  }
  if (value.source === 'custom') {
    const trimmed = value.customUrl.trim()
    return trimmed === '' ? undefined : trimmed
  }
  const native = isNativeToken(tokenAddress)
  if (value.source === 'trustwallet') {
    return native
      ? `${TRUSTWALLET_BASE}/info/logo.png`
      : `${TRUSTWALLET_BASE}/assets/${tokenAddress}/logo.png`
  }
  if (value.source === 'oneinch') {
    const address = native ? NATIVE_PSEUDO_ADDRESS : tokenAddress.toLowerCase()
    return `${ONEINCH_BASE}/${address}.png`
  }
  return undefined
}

export const isIconSourceDefault = (value: IconSourceValue): boolean =>
  value.source === ICON_SOURCE_DEFAULT.source && value.customUrl === ICON_SOURCE_DEFAULT.customUrl

export const isIconSourceValue = (value: unknown): value is IconSourceValue => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.source === 'string' && typeof candidate.customUrl === 'string'
}
