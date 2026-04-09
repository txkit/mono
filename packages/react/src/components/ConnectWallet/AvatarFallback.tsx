import React from 'react'

import hashColor from '../../helpers/hashColor'


type AvatarFallbackProps = {
  address: string
}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ address }) => {
  const bgColor = hashColor(address)
  const letter = address.slice(2, 4).toUpperCase()

  return (
    <span className="txkit-cw-avatar-fallback" style={{ backgroundColor: bgColor }}>
      {letter}
    </span>
  )
}


export default AvatarFallback
