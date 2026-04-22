'use client'
import React, { useState } from 'react'

import hashColor from '../../helpers/hashColor'


type TokenIconProps = {
  icon: string | undefined
  symbol: string | undefined
}

const TokenIcon: React.FC<TokenIconProps> = ({ icon, symbol }) => {
  const [ imgError, setImgError ] = useState(false)

  if (icon && !imgError) {
    return (
      <img
        className="txkit-tb-icon"
        src={icon}
        alt=""
        onError={() => setImgError(true)}
      />
    )
  }

  const letter = (symbol || '?').charAt(0).toUpperCase()
  const bgColor = hashColor(symbol || 'default')

  return (
    <span
      className="txkit-tb-icon-fallback"
      style={{ backgroundColor: bgColor }}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}


export default TokenIcon
