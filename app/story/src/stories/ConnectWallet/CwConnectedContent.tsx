import React from 'react'

import { hashGradient, hashPixelAvatar } from '../../helpers/hashColor'


type CwConnectedContentProps = {
  fiat: string
  address: `0x${string}`
  balance: string
  avatarStyle: string
  displayAddress: string
  showFiat: boolean
  showAvatar: boolean
  showBalance: boolean
}

const CwConnectedContent: React.FC<CwConnectedContentProps> = ({
  fiat,
  address,
  balance,
  avatarStyle,
  displayAddress,
  showFiat,
  showAvatar,
  showBalance,
}) => {
  const pixel = avatarStyle === 'pixel' ? hashPixelAvatar(address) : null

  return (
    <>
      {
        showAvatar && (
          pixel
            ? (
              <span className="txkit-cw-avatar-fallback" style={{ background: pixel.background, overflow: 'hidden' }} aria-hidden="true">
                <svg viewBox="0 0 5 5" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
                  {
                    pixel.pattern.flatMap((row, rowIndex) => (
                      row.map((filled, colIndex) => (
                        filled
                          ? <rect key={`${rowIndex}-${colIndex}`} x={colIndex} y={rowIndex} width={1} height={1} fill={pixel.foreground} />
                          : null
                      ))
                    ))
                  }
                </svg>
              </span>
            )
            : <span className="txkit-cw-avatar-fallback" style={{ background: hashGradient(address) }} aria-hidden="true" />
        )
      }
      <span className="txkit-cw-address">{displayAddress}</span>
      {
        showBalance && (
          <span className="txkit-cw-balance-wrap">
            <span className="txkit-cw-balance">{balance}</span>
            {showFiat && <span className="txkit-cw-fiat">{fiat}</span>}
          </span>
        )
      }
    </>
  )
}


export default CwConnectedContent
