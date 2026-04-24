'use client'
import React, { useMemo, forwardRef } from 'react'
import { cx } from '@txkit/core'

import { useFlowState, DEFAULT_FLOW_ID } from '../../hooks/useFlowState'
import FlowStepsDefault from './FlowStepsDefault'
import type { FlowStepsProps, FlowStepsRenderData } from '../../types/transaction'
import './FlowSteps.css'


const FlowSteps = forwardRef<HTMLDivElement, FlowStepsProps>(({
  className,
  children,
  'data-testid': testId,
  flowId = DEFAULT_FLOW_ID,
  orientation = 'horizontal',
  showCompleted = true,
}, ref) => {
  const flowEntry = useFlowState(flowId)

  const renderData: FlowStepsRenderData | undefined = useMemo(() => {
    if (!flowEntry) {
      return undefined
    }

    const { flow, steps: stepDefs } = flowEntry

    const stepsData = flow.steps.map((stepState, index) => ({
      id: stepState.id,
      label: stepDefs[index]?.label ?? stepState.id,
      description: stepDefs[index]?.description,
      status: stepState.status,
      isCurrent: index === flow.currentStepIndex,
    }))

    const visibleSteps = showCompleted
      ? stepsData
      : stepsData.filter((step) => step.status !== 'completed' && step.status !== 'skipped')

    return {
      steps: visibleSteps,
      currentStepIndex: flow.currentStepIndex,
      totalSteps: flow.totalSteps,
      completedCount: flow.steps.filter((step) => step.status === 'completed').length,
    }
  }, [ flowEntry, showCompleted ])

  const hasVisibleFlow = Boolean(renderData) && (renderData?.totalSteps ?? 0) > 1
  const summary = hasVisibleFlow && renderData
    ? `Step ${renderData.currentStepIndex + 1} of ${renderData.totalSteps}: ${renderData.completedCount} completed`
    : ''

  let content: React.ReactNode = null
  if (hasVisibleFlow && renderData) {
    content = typeof children === 'function'
      ? children(renderData)
      : <FlowStepsDefault {...renderData} orientation={orientation} />
  }

  // Root stays mounted so the aria-live summary region pre-exists content — SRs
  // only announce changes inside a live region that already existed in the DOM.
  return (
    <div
      ref={ref}
      className={cx('txkit-fs', className)}
      data-testid={testId}
      data-orientation={orientation}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="txkit-fs-sr">
        {summary}
      </div>
      {content}
    </div>
  )
})

FlowSteps.displayName = 'FlowSteps'


export default FlowSteps
