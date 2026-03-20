import React from 'react'

import type { FlowToastRenderData } from './flow-types'


const ToastIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'success') {
    return (
      <svg className="txkit-ft-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg className="txkit-ft-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    )
  }
  return null
}

const FlowToastDefault: React.FC<FlowToastRenderData> = ({
  message,
  type,
  dismiss,
}) => (
  <div className="txkit-ft-content" data-type={type}>
    <ToastIcon type={type} />
    <span className="txkit-ft-message">{message}</span>
    <button
      type="button"
      className="txkit-ft-dismiss"
      onClick={dismiss}
      aria-label="Dismiss"
    >
      {'\u2715'}
    </button>
  </div>
)


export default FlowToastDefault
