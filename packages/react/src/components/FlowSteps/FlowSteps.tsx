'use client'
import React, { useMemo, forwardRef } from 'react'
import { cx } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import { useFlowState, DEFAULT_FLOW_ID } from '../../hooks/useFlowState'
import FlowStepsDefault from './FlowStepsDefault'
import { defaultLabels } from './labels'
import type { FlowStepsProps, FlowStepsRenderData } from '../../types/transaction'
import './FlowSteps.css'


const FlowSteps = forwardRef<HTMLDivElement, FlowStepsProps>(({
  className,
  children,
  'data-testid': testId,
  flowId = DEFAULT_FLOW_ID,
  labels: labelOverrides,
  orientation = 'vertical',
}, ref) => {
  const flowEntry = useFlowState(flowId)
  const labels = useDeepMemo(
    () => ({ ...defaultLabels, ...labelOverrides }),
    [ labelOverrides ],
  )

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

    return {
      steps: stepsData,
      currentStepIndex: flow.currentStepIndex,
      totalSteps: flow.totalSteps,
      completedCount: flow.steps.filter((step) => step.status === 'completed').length,
    }
  }, [ flowEntry ])

  const isIdle = flowEntry?.flow.status === 'idle'
  const hasVisibleFlow = Boolean(renderData) && (renderData?.totalSteps ?? 0) > 1 && !isIdle
  const summary = hasVisibleFlow && renderData
    ? `Step ${renderData.currentStepIndex + 1} of ${renderData.totalSteps}: ${renderData.completedCount} completed`
    : ''

  let content: React.ReactNode = null
  if (hasVisibleFlow && renderData) {
    content = typeof children === 'function'
      ? children(renderData)
      : <FlowStepsDefault {...renderData} labels={labels} orientation={orientation} />
  }


  return (
    <div
      ref={ref}
      className={cx('tx-fs', className)}
      data-testid={testId}
      data-active={hasVisibleFlow ? 'true' : undefined}
      data-orientation={orientation}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="tx-fs-sr">
        {summary}
      </div>
      <div className="tx-fs-inner">
        {content}
      </div>
    </div>
  )
})

FlowSteps.displayName = 'FlowSteps'


export default FlowSteps
