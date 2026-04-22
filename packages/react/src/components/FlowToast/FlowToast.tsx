'use client'
import React, { useState, useEffect, useMemo, useCallback, useContext, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@txkit/core'

import { useFlowState, DEFAULT_FLOW_ID } from '../../hooks/useFlowState'
import { TxKitContext } from '../TxKitProvider/TxKitProvider'
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
  const txkit = useContext(TxKitContext)
  const themeClass = txkit?.theme ? `txkit-${txkit.theme}` : undefined
  const flowEntry = useFlowState(flowId)
  const [ visible, setVisible ] = useState(false)
  const [ toastMessage, setToastMessage ] = useState('')
  const [ toastDescription, setToastDescription ] = useState<string | undefined>()
  const [ toastType, setToastType ] = useState<'success' | 'error' | 'info' | 'warning'>('info')
  const [ toastStepId, setToastStepId ] = useState<string | undefined>()

  const flowStatus = flowEntry?.flow.status

  // Show toast when flow completes, errors, or is rejected
  useEffect(() => {
    if (!flowStatus || !completedStatuses.includes(flowStatus)) {
      return
    }

    if (flowStatus === 'completed') {
      setToastMessage('Transaction confirmed')
      setToastDescription('Your transaction has been confirmed on the blockchain.')
      setToastType('success')
    } else if (flowStatus === 'error') {
      const currentStep = flowEntry?.flow.steps[flowEntry.flow.currentStepIndex]
      setToastMessage('Transaction failed')
      setToastDescription(currentStep?.error?.message)
      setToastType('error')
      setToastStepId(currentStep?.id)
    } else if (flowStatus === 'rejected') {
      setToastMessage('Transaction rejected')
      setToastDescription('The transaction was declined in the wallet.')
      setToastType('info')
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

  // ESC to dismiss active toast
  useEffect(() => {
    if (!visible) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setVisible(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ visible ])

  const dismiss = useCallback(() => setVisible(false), [])

  const renderData: FlowToastRenderData = useMemo(() => ({
    visible,
    message: toastMessage,
    description: toastDescription,
    type: toastType,
    stepId: toastStepId,
    dismiss,
  }), [ visible, toastMessage, toastDescription, toastType, toastStepId, dismiss ])

  if (!visible) {
    return null
  }

  const isErrorToast = toastType === 'error'
  const toastElement = (
    <div
      ref={ref}
      className={cx('txkit-root', themeClass, 'txkit-ft', `txkit-ft-${position}`, className)}
      data-testid={testId}
      role={isErrorToast ? 'alert' : 'status'}
      aria-live={isErrorToast ? 'assertive' : 'polite'}
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
