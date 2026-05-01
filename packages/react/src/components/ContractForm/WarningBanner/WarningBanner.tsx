import React from 'react'

import maskStyle from '../../../helpers/maskStyle'
import dangerIcon from '../../../assets/icons/danger.svg'
import warningIcon from '../../../assets/icons/warning.svg'
import type { SecurityWarning } from '../../../types/contract'


const WarningBanner: React.FC<{ warning: SecurityWarning }> = ({ warning }) => {
  const iconUrl = warning.level === 'danger' ? dangerIcon : warningIcon
  const iconMaskStyle = maskStyle(iconUrl)

  return (
    <div
      className="tx-cf-warning"
      data-level={warning.level}
      role={warning.level === 'danger' ? 'alert' : 'status'}
      aria-live={warning.level === 'danger' ? 'assertive' : 'polite'}
    >
      <span className="tx-cf-warning-icon" aria-hidden="true" style={iconMaskStyle} />
      <span className="tx-cf-warning-message">{warning.message}</span>
    </div>
  )
}


export default WarningBanner
