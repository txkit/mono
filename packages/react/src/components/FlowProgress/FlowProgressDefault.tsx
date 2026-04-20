import React from 'react'

import type { FlowProgressRenderData } from '../../types/transaction'


type FlowProgressDefaultProps = FlowProgressRenderData & {
  showSummary: boolean
  summaryLabel: string
}

const FlowProgressDefault: React.FC<FlowProgressDefaultProps> = ({
  progress,
  status,
  currentStepLabel,
  showSummary,
  summaryLabel,
}) => {
  const percent = Math.round(progress * 100)

  return (
    <>
      {
        showSummary && (
          <div className="txkit-fp-summary">
            <span className="txkit-fp-summary-label">{summaryLabel}</span>
            <span className="txkit-fp-summary-percent">{`${percent}%`}</span>
          </div>
        )
      }

      <div
        className="txkit-fp-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={currentStepLabel ? `Progress: ${currentStepLabel}` : 'Transaction progress'}
      >
        <div
          className="txkit-fp-fill"
          data-status={status}
          style={{ width: `${percent}%` }}
        />
      </div>

      {
        !showSummary && currentStepLabel && status === 'running' && (
          <span className="txkit-fp-label">{currentStepLabel}</span>
        )
      }
    </>
  )
}


export default FlowProgressDefault
