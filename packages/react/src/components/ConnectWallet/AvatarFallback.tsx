import React from 'react'

import { hashGradient } from '../../helpers/hashColor'


type AvatarFallbackProps = {
  address: string
}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ address }) => (
  <span
    className="txkit-cw-avatar-fallback"
    style={{ background: hashGradient(address) }}
    aria-hidden="true"
  />
)


export default AvatarFallback
