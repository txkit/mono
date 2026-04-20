import React from 'react'

import { hashGradient, hashPixelAvatar } from '../../helpers/hashColor'


type AvatarFallbackProps = {
  address: string
  variant?: 'gradient' | 'pixel'
}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ address, variant = 'gradient' }) => {
  if (variant === 'pixel') {
    const { pattern, background, foreground } = hashPixelAvatar(address)
    return (
      <span
        className="txkit-cw-avatar-fallback"
        style={{ background, overflow: 'hidden' }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 5 5" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
          {
            pattern.flatMap((row, rowIndex) => (
              row.map((filled, colIndex) => (
                filled
                  ? <rect key={`${rowIndex}-${colIndex}`} x={colIndex} y={rowIndex} width={1} height={1} fill={foreground} />
                  : null
              ))
            ))
          }
        </svg>
      </span>
    )
  }

  return (
    <span
      className="txkit-cw-avatar-fallback"
      style={{ background: hashGradient(address) }}
      aria-hidden="true"
    />
  )
}


export default AvatarFallback
