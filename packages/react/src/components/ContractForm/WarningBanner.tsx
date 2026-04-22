import React from 'react'

import dangerIcon from '../../assets/icons/contract-form/danger.svg'
import warningIcon from '../../assets/icons/contract-form/warning.svg'
import type { SecurityWarning } from '../../types/contract'


const WarningBanner: React.FC<{ warning: SecurityWarning }> = ({ warning }) => {
  const iconUrl = warning.level === 'danger' ? dangerIcon : warningIcon
  const iconMaskStyle = {
    maskImage: `url("${iconUrl}")`,
    WebkitMaskImage: `url("${iconUrl}")`,
  }

  return (
    <div
      className="txkit-cf-warning"
      data-level={warning.level}
      role={warning.level === 'danger' ? 'alert' : 'status'}
      aria-live={warning.level === 'danger' ? 'assertive' : 'polite'}
    >
      <span className="txkit-cf-warning-icon" aria-hidden="true" style={iconMaskStyle} />
      <span className="txkit-cf-warning-message">{warning.message}</span>
    </div>
  )
}


export default WarningBanner
