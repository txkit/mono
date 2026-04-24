'use client'
import React, { useMemo, forwardRef } from 'react'
import { cx } from '@txkit/core'

import { useFlowState, DEFAULT_FLOW_ID } from '../../hooks/useFlowState'
import FlowProgressDefault from './FlowProgressDefault'
import type { FlowProgressProps, FlowProgressRenderData } from '../../types/transaction'
import './FlowProgress.css'


const FlowProgress = forwardRef<HTMLDivElement, FlowProgressProps>(({
  className,
  children,
  'data-testid': testId,
  flowId = DEFAULT_FLOW_ID,
  showSummary = false,
  summaryLabel = 'Overall Progress',
}, ref) => {
  const flowEntry = useFlowState(flowId)

  const renderData: FlowProgressRenderData | undefined = useMemo(() => {
    if (!flowEntry) {
      return undefined
    }

    const { flow, steps: stepDefs } = flowEntry
    const completedCount = flow.steps.filter(
      (step) => step.status === 'completed' || step.status === 'skipped',
    ).length
    const progress = flow.totalSteps > 0 ? completedCount / flow.totalSteps : 0
    const currentStepLabel = stepDefs[flow.currentStepIndex]?.label

    return {
      progress,
      status: flow.status,
      currentStepLabel,
    }
  }, [ flowEntry ])

  const hasActiveFlow = Boolean(renderData) && renderData?.status !== 'idle'

  let content: React.ReactNode = null
  if (hasActiveFlow && renderData) {
    content = typeof children === 'function'
      ? children(renderData)
      : (
        <FlowProgressDefault
          {...renderData}
          showSummary={showSummary}
          summaryLabel={summaryLabel}
        />
      )
  }

  // Root stays mounted so the progressbar appears INTO a stable container —
  // avoids remount churn and keeps ref identity stable across flow lifecycles.
  return (
    <div
      ref={ref}
      className={cx('txkit-fp', className)}
      data-testid={testId}
      data-active={hasActiveFlow ? 'true' : undefined}
    >
      {content}
    </div>
  )
})

FlowProgress.displayName = 'FlowProgress'


export default FlowProgress
