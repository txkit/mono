'use client'
import React from 'react'

import type { FlowToastRenderData } from '../../types/transaction'

import maskStyle from '../../helpers/maskStyle'
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

type FlowToastDefaultProps = FlowToastRenderData & {
  dismissLabel: string
}

const FlowToastDefault: React.FC<FlowToastDefaultProps> = (props) => {
  const { type, message, dismiss, description, dismissLabel } = props
  const iconUrl = iconByType[type]
  const iconMaskStyle = maskStyle(iconUrl)
  const dismissMaskStyle = maskStyle(xIcon)

  return (
    <div className="tx-ft-content" data-type={type} data-has-description={description ? 'true' : undefined}>
      <span
        className="tx-ft-icon"
        aria-hidden="true"
        style={iconMaskStyle}
      />
      <div className="tx-ft-text">
        <span className="tx-ft-message">{message}</span>
        {description && (
          <span className="tx-ft-description">{description}</span>
        )}
      </div>
      <button
        type="button"
        className="tx-ft-dismiss"
        onClick={dismiss}
        aria-label={dismissLabel}
      >
        <span
          className="tx-ft-dismiss-icon"
          aria-hidden="true"
          style={dismissMaskStyle}
        />
      </button>
    </div>
  )
}


export default FlowToastDefault
