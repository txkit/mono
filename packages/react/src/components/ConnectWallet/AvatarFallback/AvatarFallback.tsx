import React from 'react'

import { hashGradient, hashPixelAvatar } from '../../../helpers/hashColor'


type AvatarFallbackProps = {
  address: string
  variant?: 'gradient' | 'pixel'
}

const pixelGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gridTemplateRows: 'repeat(5, 1fr)',
  width: '100%',
  height: '100%',
}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ address, variant = 'gradient' }) => {
  if (variant === 'pixel') {
    const { pattern, background, foreground } = hashPixelAvatar(address)
    return (
      <span
        className="tx-cw-avatar-fallback"
        style={{ background, overflow: 'hidden' }}
        aria-hidden="true"
      >
        <div style={pixelGridStyle}>
          {
            pattern.flatMap((row, rowIndex) => (
              row.map((filled, colIndex) => (
                <span
                  key={`${rowIndex}-${colIndex}`}
                  style={{ backgroundColor: filled ? foreground : 'transparent' }}
                />
              ))
            ))
          }
        </div>
      </span>
    )
  }

  return (
    <span
      className="tx-cw-avatar-fallback"
      style={{ background: hashGradient(address) }}
      aria-hidden="true"
    />
  )
}


export default AvatarFallback
