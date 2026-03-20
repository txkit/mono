import React from 'react'

import type { FlowProgressRenderData } from './flow-types'


const FlowProgressDefault: React.FC<FlowProgressRenderData> = ({
  progress,
  status,
  currentStepLabel,
}) => (
  <>
    <div
      className="txkit-fp-bar"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={currentStepLabel ? `Progress: ${currentStepLabel}` : 'Transaction progress'}
    >
      <div
        className="txkit-fp-fill"
        data-status={status}
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>

    {
      currentStepLabel && status === 'running' && (
        <span className="txkit-fp-label">{currentStepLabel}</span>
      )
    }
  </>
)


export default FlowProgressDefault
