'use client'
import React, { useRef, useEffect } from 'react'

import type { FlowProgressRenderData } from '../../types/transaction'


type FlowProgressDefaultProps = FlowProgressRenderData & {
  showSummary: boolean
  summaryLabel: string
}

const FlowProgressDefault: React.FC<FlowProgressDefaultProps> = (props) => {
  const {
    status,
    progress,
    showSummary,
    summaryLabel,
    currentStepLabel,
  } = props

  const percent = Math.round(progress * 100)
  const prevPercentRef = useRef(percent)
  const isBackward = percent < prevPercentRef.current

  useEffect(() => {
    prevPercentRef.current = percent
  }, [ percent ])

  return (
    <>
      {
        showSummary && (
          <div className="tx-fp-summary">
            <span className="tx-fp-summary-label">{summaryLabel}</span>
            <span className="tx-fp-summary-percent">{`${percent}%`}</span>
          </div>
        )
      }

      <div
        className="tx-fp-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={currentStepLabel ? `Progress: ${currentStepLabel}` : 'Transaction progress'}
      >
        <div
          className="tx-fp-fill"
          data-status={status}
          data-direction={isBackward ? 'backward' : undefined}
          style={{ width: `${percent}%` }}
        />
      </div>

      {
        !showSummary && currentStepLabel && status === 'running' && (
          <span className="tx-fp-label">{currentStepLabel}</span>
        )
      }
    </>
  )
}


export default FlowProgressDefault
