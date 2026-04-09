import React from 'react'


const VariantButton: React.FC<{
  label?: string
  size?: 'default' | 'compact'
  variant?: string
}> = ({ label = 'Connect Wallet', size = 'default', variant = 'default' }) => (
  <div className="txkit-cw" data-size={size} data-variant={variant}>
    <button
      type="button"
      className="txkit-cw-button"
      data-state="disconnected"
    >
      <span>{label}</span>
    </button>
  </div>
)

export const SizeVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <VariantButton size="default" />
    <VariantButton size="compact" />
  </div>
)

export const ButtonVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <VariantButton variant="default" />
    <VariantButton variant="outline" />
    <VariantButton variant="ghost" />
    <VariantButton variant="soft" />
  </div>
)

export const CompactVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <VariantButton size="compact" variant="default" />
    <VariantButton size="compact" variant="outline" />
    <VariantButton size="compact" variant="ghost" />
    <VariantButton size="compact" variant="soft" />
  </div>
)

export const DotLoadingDemo = () => (
  <div
    className="txkit-root txkit-dark"
    style={{ display: 'inline-block' }}
  >
    <button
      type="button"
      className="txkit-cw-button"
      data-state="connecting"
      disabled
      style={{ cursor: 'wait' }}
    >
      <span className="txkit-cw-dots">
        <span className="txkit-cw-dot" />
        <span className="txkit-cw-dot" />
        <span className="txkit-cw-dot" />
      </span>
      <span>Connecting</span>
    </button>
  </div>
)

export const AvatarFallbackDemo = () => {
  const addresses = [
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xDEADBEEF00000000000000000000000000000000',
  ]

  const hashColor = (str: string): string => {
    let hash = 0
    for (let index = 0; index < str.length; index++) {
      hash = str.charCodeAt(index) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 55%, 45%)`
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {
        addresses.map((address) => (
          <div
            key={address}
            className="txkit-root txkit-dark"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span
              className="txkit-cw-avatar-fallback"
              style={{ backgroundColor: hashColor(address) }}
            >
              {address.slice(2, 4).toUpperCase()}
            </span>
            <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              {address.slice(0, 8)}...
            </span>
          </div>
        ))
      }
    </div>
  )
}
