import React from 'react'

import maskStyle from '../../helpers/maskStyle'
import externalLinkIcon from '../../assets/icons/external-link.svg'

import './ExternalLinkIcon.css'


type ExternalLinkIconProps = {
  size?: number
  className?: string
}

const externalLinkMaskStyle = maskStyle(externalLinkIcon)

const ExternalLinkIcon: React.FC<ExternalLinkIconProps> = (props) => {
  const {
    size = 14,
    className,
  } = props

  return (
    <span
      className={className ? `tx-external-link ${className}` : 'tx-external-link'}
      style={{ ...externalLinkMaskStyle, width: size, height: size }}
      aria-hidden="true"
    />
  )
}


export default ExternalLinkIcon
