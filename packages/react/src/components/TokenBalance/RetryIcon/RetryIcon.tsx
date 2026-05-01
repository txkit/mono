import React from 'react'

import maskStyle from '../../../helpers/maskStyle'
import refreshIcon from '../../../assets/icons/refresh.svg'


type RetryIconProps = {
  size?: number
}

const retryMaskStyle = maskStyle(refreshIcon)

const RetryIcon: React.FC<RetryIconProps> = ({ size = 14 }) => (
  <span
    className="tx-tb-retry-icon"
    style={{ ...retryMaskStyle, width: size, height: size }}
    aria-hidden="true"
  />
)


export default RetryIcon
