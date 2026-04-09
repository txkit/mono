import React from 'react'

import ToastIcon from './ToastIcon'
import type { FlowToastRenderData } from '../../types/transaction'


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
