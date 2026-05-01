'use client'
import React, { useState, useEffect, useMemo, useCallback, useContext, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import { useFlowState, DEFAULT_FLOW_ID } from '../../hooks/useFlowState'
import { TxKitContext } from '../TxKitProvider/TxKitProvider'
import FlowToastDefault from './FlowToastDefault'
import { defaultLabels } from './labels'
import {
  registerToast,
  unregisterToast,
  getStackIndex,
  subscribeToastStack,
} from './toastStack'
import type { FlowToastProps, FlowToastRenderData } from '../../types/transaction'
import './FlowToast.css'


const completedStatuses: readonly string[] = [ 'completed', 'error', 'rejected', 'canceled' ]

const FlowToast = forwardRef<HTMLDivElement, FlowToastProps>(({
  className,
  children,
  'data-testid': testId,
  flowId = DEFAULT_FLOW_ID,
  labels: labelOverrides,
  autoDismiss = 5000,
  position = 'bottom-right',
}, ref) => {
  const txkit = useContext(TxKitContext)
  const themeClass = txkit?.theme ? `tx-${txkit.theme}` : undefined
  const flowEntry = useFlowState(flowId)
  const labels = useDeepMemo(
    () => ({ ...defaultLabels, ...labelOverrides }),
    [ labelOverrides ],
  )
  const [ visible, setVisible ] = useState(false)
  const [ toastMessage, setToastMessage ] = useState('')
  const [ toastDescription, setToastDescription ] = useState<string | undefined>()
  const [ toastType, setToastType ] = useState<'success' | 'error' | 'info' | 'warning'>('info')
  const [ toastStepId, setToastStepId ] = useState<string | undefined>()
  const [ hovered, setHovered ] = useState(false)
  const [ focused, setFocused ] = useState(false)

  const flowStatus = flowEntry?.flow.status

  useEffect(() => {
    if (!flowStatus || !completedStatuses.includes(flowStatus)) {
      setVisible(false)
      return
    }

    if (flowStatus === 'completed') {
      setToastMessage(labels.successMessage)
      setToastDescription(labels.successDescription)
      setToastType('success')
    }
    else if (flowStatus === 'error') {
      const currentStep = flowEntry?.flow.steps[flowEntry.flow.currentStepIndex]
      setToastMessage(labels.errorMessage)
      setToastDescription(currentStep?.error?.message)
      setToastType('error')
      setToastStepId(currentStep?.id)
    }
    else if (flowStatus === 'rejected') {
      setToastMessage(labels.rejectedMessage)
      setToastDescription(labels.rejectedDescription)
      setToastType('info')
    }
    else if (flowStatus === 'canceled') {
      setToastMessage(labels.canceledMessage)
      setToastDescription(labels.canceledDescription)
      setToastType('info')
    }

    setVisible(true)
  }, [ flowStatus, flowEntry, labels ])

  const isErrorToast = toastType === 'error'
  const isPaused = hovered || focused
  // Errors never auto-dismiss: user must acknowledge. WCAG 2.2.1 Timing Adjustable.
  const shouldAutoDismiss = visible && autoDismiss > 0 && !isErrorToast && !isPaused

  useEffect(() => {
    if (!shouldAutoDismiss) {
      return
    }
    const timer = setTimeout(() => setVisible(false), autoDismiss)
    return () => clearTimeout(timer)
  }, [ shouldAutoDismiss, autoDismiss, toastMessage ])

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

  const [ stackIndex, setStackIndex ] = useState(0)

  useEffect(() => {
    if (!visible) {
      return
    }
    registerToast(position, flowId)
    setStackIndex(getStackIndex(position, flowId))
    const unsubscribe = subscribeToastStack(() => {
      setStackIndex(getStackIndex(position, flowId))
    })
    return () => {
      unsubscribe()
      unregisterToast(position, flowId)
    }
  }, [ visible, position, flowId ])

  // Step is approximate toast height + gap; real heights vary slightly with
  // description but 96px reads cleanly for one- and two-line toasts.
  const stackDirection = position.startsWith('bottom') ? -1 : 1
  const stackOffsetPx = stackIndex * 96 * stackDirection
  const stackTransform = stackOffsetPx === 0 ? undefined : `translateY(${stackOffsetPx}px)`

  const dismiss = useCallback(() => setVisible(false), [])

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])
  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setFocused(false)
    }
  }, [])

  const renderData: FlowToastRenderData = useMemo(() => ({
    visible,
    message: toastMessage,
    description: toastDescription,
    type: toastType,
    stepId: toastStepId,
    dismiss,
  }), [ visible, toastMessage, toastDescription, toastType, toastStepId, dismiss ])

  let content: React.ReactNode = null
  if (visible) {
    content = typeof children === 'function'
      ? children(renderData)
      : <FlowToastDefault {...renderData} dismissLabel={labels.dismiss} />
  }

  const viewport = (
    <div
      ref={ref}
      className={cx(themeClass, 'tx-ft', `tx-ft-${position}`, className)}
      data-testid={testId}
      data-visible={visible ? 'true' : undefined}
      style={stackTransform ? { transform: stackTransform } : undefined}
      role={isErrorToast ? 'alert' : 'status'}
      aria-live={isErrorToast ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {content}
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(viewport, document.body)
  }

  return viewport
})

FlowToast.displayName = 'FlowToast'


export default FlowToast
