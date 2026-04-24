import React from 'react'

import type { FlowToastRenderData } from '../../types/transaction'

import checkCircleIcon from '../../assets/icons/check-circle.svg'
import alertCircleIcon from '../../assets/icons/alert-circle.svg'
import infoIcon from '../../assets/icons/info.svg'
import alertTriangleIcon from '../../assets/icons/alert-triangle.svg'
import xIcon from '../../assets/icons/x.svg'


const iconByType: Record<FlowToastRenderData['type'], string> = {
  success: checkCircleIcon,
  error: alertCircleIcon,
  info: infoIcon,
  warning: alertTriangleIcon,
}

const FlowToastDefault: React.FC<FlowToastRenderData> = ({
  message,
  description,
  type,
  dismiss,
}) => {
  const iconUrl = iconByType[type]
  const iconMaskStyle = {
    WebkitMaskImage: `url("${iconUrl}")`,
    maskImage: `url("${iconUrl}")`,
  }
  const dismissMaskStyle = {
    WebkitMaskImage: `url("${xIcon}")`,
    maskImage: `url("${xIcon}")`,
  }

  return (
    <div className="txkit-ft-content" data-type={type} data-has-description={description ? 'true' : undefined}>
      <span
        className="txkit-ft-icon"
        aria-hidden="true"
        style={iconMaskStyle}
      />
      <div className="txkit-ft-text">
        <span className="txkit-ft-message">{message}</span>
        {description && (
          <span className="txkit-ft-description">{description}</span>
        )}
      </div>
      <button
        type="button"
        className="txkit-ft-dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <span
          className="txkit-ft-dismiss-icon"
          aria-hidden="true"
          style={dismissMaskStyle}
        />
      </button>
    </div>
  )
}


export default FlowToastDefault
