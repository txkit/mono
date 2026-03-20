'use client'
import React, { useMemo, forwardRef } from 'react'
import { cx } from '@txkit/core'

import { useFlowState, DEFAULT_FLOW_ID } from './FlowContext'
import FlowProgressDefault from './FlowProgressDefault'
import type { FlowProgressProps, FlowProgressRenderData } from './flow-types'
import './FlowProgress.css'


const FlowProgress = forwardRef<HTMLDivElement, FlowProgressProps>(({
  className,
  children,
  'data-testid': testId,
  flowId = DEFAULT_FLOW_ID,
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

  // Don't render if no flow or idle
  if (!renderData || renderData.status === 'idle') {
    return null
  }

  return (
    <div
      ref={ref}
      className={cx('txkit-fp', className)}
      data-testid={testId}
    >
      {
        typeof children === 'function'
          ? children(renderData)
          : <FlowProgressDefault {...renderData} />
      }
    </div>
  )
})

FlowProgress.displayName = 'FlowProgress'


export default FlowProgress
