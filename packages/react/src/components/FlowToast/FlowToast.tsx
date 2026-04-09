'use client'
import React, { useState, useEffect, useMemo, useCallback, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@txkit/core'

import { useFlowState, DEFAULT_FLOW_ID } from '../../hooks/useFlowState'
import FlowToastDefault from './FlowToastDefault'
import type { FlowToastProps, FlowToastRenderData } from '../../types/transaction'
import './FlowToast.css'


const completedStatuses: readonly string[] = [ 'completed', 'error', 'rejected' ]

const FlowToast = forwardRef<HTMLDivElement, FlowToastProps>(({
  className,
  children,
  'data-testid': testId,
  flowId = DEFAULT_FLOW_ID,
  autoDismiss = 5000,
  position = 'bottom-right',
}, ref) => {
  const flowEntry = useFlowState(flowId)
  const [ visible, setVisible ] = useState(false)
  const [ toastMessage, setToastMessage ] = useState('')
  const [ toastType, setToastType ] = useState<'success' | 'error' | 'info'>('info')
  const [ toastStepId, setToastStepId ] = useState<string | undefined>()

  const flowStatus = flowEntry?.flow.status

  // Show toast when flow completes, errors, or is rejected
  useEffect(() => {
    if (!flowStatus || !completedStatuses.includes(flowStatus)) {
      return
    }

    if (flowStatus === 'completed') {
      setToastMessage('Transaction confirmed')
      setToastType('success')
    } else if (flowStatus === 'error') {
      const currentStep = flowEntry?.flow.steps[flowEntry.flow.currentStepIndex]
      setToastMessage(currentStep?.error?.message ?? 'Transaction failed')
      setToastType('error')
      setToastStepId(currentStep?.id)
    } else if (flowStatus === 'rejected') {
      setToastMessage('Transaction rejected')
      setToastType('error')
    }

    setVisible(true)
  }, [ flowStatus, flowEntry ])

  // Auto-dismiss
  useEffect(() => {
    if (!visible || autoDismiss <= 0) {
      return
    }
    const timer = setTimeout(() => setVisible(false), autoDismiss)
    return () => clearTimeout(timer)
  }, [ visible, autoDismiss ])

  const dismiss = useCallback(() => setVisible(false), [])

  const renderData: FlowToastRenderData = useMemo(() => ({
    visible,
    message: toastMessage,
    type: toastType,
    stepId: toastStepId,
    dismiss,
  }), [ visible, toastMessage, toastType, toastStepId, dismiss ])

  if (!visible) {
    return null
  }

  const toastElement = (
    <div
      ref={ref}
      className={cx('txkit-ft', `txkit-ft-${position}`, className)}
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      {
        typeof children === 'function'
          ? children(renderData)
          : <FlowToastDefault {...renderData} />
      }
    </div>
  )

  // Portal to body for proper positioning
  if (typeof document !== 'undefined') {
    return createPortal(toastElement, document.body)
  }

  return toastElement
})

FlowToast.displayName = 'FlowToast'


export default FlowToast
