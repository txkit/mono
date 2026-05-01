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
  showSummary = true,
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
    const isRunning = flow.status === 'running' || flow.status === 'paused' || flow.status === 'simulating-all'
    const isFailed = flow.status === 'error' || flow.status === 'rejected'
    const inProgressBoost = isRunning && flow.currentStepIndex < flow.totalSteps ? 0.5 : 0
    const baseProgress = flow.totalSteps > 0 ? (completedCount + inProgressBoost) / flow.totalSteps : 0
    const progress = isFailed ? 1 : baseProgress
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


  return (
    <div
      ref={ref}
      className={cx('tx-fp', className)}
      data-testid={testId}
      data-active={hasActiveFlow ? 'true' : undefined}
    >
      <div className="tx-fp-inner">
        {content}
      </div>
    </div>
  )
})

FlowProgress.displayName = 'FlowProgress'


export default FlowProgress
