'use client'
import React, { useMemo, useCallback, useEffect, useRef, useState, forwardRef } from 'react'
import type { StepStatus } from '@txkit/core'
import { cx, getExplorerUrl } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import useTransactionFlow from '../../hooks/useTransactionFlow'
import { defaultLabels } from './labels'
import TransactionButtonDefault, { type TransactionButtonDefaultProps } from './TransactionButtonDefault'
import type { TransactionButtonLabels } from './labels'
import type { TransactionButtonProps, TransactionButtonRenderData } from '../../types/transaction'
import './TransactionButton.css'


export { type TransactionButtonLabels }

const processingStates: readonly StepStatus[] = [ 'simulating', 'signing', 'tx-pending' ]

type ButtonLabelInput = {
  label: string | undefined
  status: StepStatus | undefined
  labels: Required<TransactionButtonLabels>
}

const STEP_BUTTON_LABEL_KEY: Partial<Record<StepStatus, keyof Required<TransactionButtonLabels>>> = {
  simulating: 'simulating',
  'confirming-risk': 'confirm',
  'simulation-failed': 'forceSubmit',
  signing: 'awaitingSignature',
  'tx-pending': 'pending',
  waiting: 'pending',
  completed: 'success',
  error: 'retry',
  rejected: 'retry',
  canceled: 'retry',
}

const mapStepStatusToButtonLabel = ({ label, status, labels }: ButtonLabelInput): string => {
  const key = status !== undefined ? STEP_BUTTON_LABEL_KEY[status] : undefined

  return key ? labels[key] : (label || labels.send)
}

type StatusMessageInput = {
  status: StepStatus | undefined
  stepLabel: string | undefined
  errorMessage: string | undefined
  labels: Required<TransactionButtonLabels>
}

const mapStepStatusToMessage = ({ status, stepLabel, errorMessage, labels }: StatusMessageInput): string => {
  const errorSuffix = errorMessage ? `: ${errorMessage}` : ''

  switch (status) {
    case 'simulating':
      return labels.statusSimulating.replace('{step}', stepLabel || labels.fallbackTransaction)
    case 'confirming-risk':
      return labels.statusConfirmingRisk
    case 'simulation-failed':
      return labels.statusSimulationFailed.replace('{error}', errorSuffix)
    case 'signing':
      return labels.awaitingSignature
    case 'tx-pending':
      return labels.statusTxPending.replace('{step}', stepLabel || labels.fallbackTransaction)
    case 'waiting':
      return labels.statusWaiting.replace('{step}', stepLabel || labels.fallbackCondition)
    case 'completed':
      return labels.statusCompleted
    case 'error':
      return labels.statusError.replace('{error}', errorSuffix)
    case 'rejected':
      return labels.statusRejected
    case 'canceled':
      return labels.statusCanceled
    default:
      return ''
  }
}


const TransactionButton = forwardRef<HTMLDivElement, TransactionButtonProps>(({
  className,
  children,
  'data-testid': testId,
  steps,
  flowId,
  safety,
  chainId,
  label,
  description,
  labels: labelOverrides,
  confirmations,
  resetDelay = 0,
  disabled = false,
  showExplorerLink = true,
  onFlowComplete,
  onStepComplete,
  onError,
  onFlowStatusChange,
}, ref) => {
  const mergedLabels = useDeepMemo(
    () => ({ ...defaultLabels, ...labelOverrides }),
    [ labelOverrides ],
  )

  const {
    flow,
    steps: stepDefs,
    start,
    confirm,
    cancel,
    retry,
    retryFrom,
    forceSubmit,
    reset,
    skipStep,
  } = useTransactionFlow({
    steps,
    flowId,
    safety,
    chainId,
    confirmations,
    resetDelay,
    onFlowComplete,
    onStepComplete,
    onStepError: onError,
    onFlowStatusChange,
  })

  const currentStep = flow.steps[flow.currentStepIndex]
  const currentStepDef = stepDefs[flow.currentStepIndex]
  const currentStatus = currentStep?.status ?? 'pending'

  const explorerUrl = useMemo(() => {
    if (!currentStep?.hash || !chainId) {
      return undefined
    }
    return getExplorerUrl(chainId, currentStep.hash, 'tx')
  }, [ currentStep?.hash, chainId ])

  const buttonLabel = useMemo(
    () => mapStepStatusToButtonLabel({ label, status: currentStatus, labels: mergedLabels }),
    [ label, mergedLabels, currentStatus ],
  )

  const statusMessage = useMemo(
    () => mapStepStatusToMessage({
      status: currentStatus,
      stepLabel: currentStepDef?.label,
      errorMessage: currentStep?.error?.message,
      labels: mergedLabels,
    }),
    [ mergedLabels, currentStatus, currentStepDef?.label, currentStep?.error?.message ],
  )

  const isProcessing = processingStates.includes(currentStatus) || currentStatus === 'waiting'

  const isButtonDisabled = disabled
    || isProcessing
    || (currentStatus === 'confirming-risk' && (currentStep?.confirmCountdown ?? 0) > 0)

  const handleClick = useCallback(() => {
    switch (flow.status) {
      case 'idle':
        start()
        break
      case 'running':
        if (currentStatus === 'confirming-risk') {
          confirm()
        }
        break
      case 'error':
        if (currentStatus === 'simulation-failed') {
          forceSubmit()
        } else {
          retry()
        }
        break
      case 'rejected':
      case 'canceled':
        retry()
        break
      case 'completed':
        reset()
        break
    }
  }, [ flow.status, currentStatus, start, confirm, retry, reset, forceSubmit ])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && currentStatus === 'confirming-risk') {
      cancel()
    }
  }, [ cancel, currentStatus ])

  const renderData: TransactionButtonRenderData = useMemo(() => ({
    flow,
    currentStep,
    steps: stepDefs,
    explorerUrl,
    start,
    confirm,
    cancel,
    retry,
    retryFrom,
    forceSubmit,
    reset,
    skipStep,
  }), [
    flow, cancel, confirm, reset, retry, start, stepDefs, explorerUrl,
    currentStep, forceSubmit, retryFrom, skipStep,
  ])

  const defaultProps: TransactionButtonDefaultProps = useMemo(() => ({
    state: currentStatus,
    buttonLabel,
    description,
    explorerUrl,
    statusMessage,
    error: currentStep?.error,
    riskResult: currentStep?.riskResult,
    mergedLabels,
    decodedCalldata: currentStep?.decodedCalldata,
    confirmCountdown: currentStep?.confirmCountdown ?? 0,
    isProcessing,
    showExplorerLink,
    isButtonDisabled,
    currentStepIndex: flow.currentStepIndex,
    totalSteps: stepDefs.length,
    currentStepOptional: Boolean(currentStepDef?.optional),
    onClick: handleClick,
    onCancel: cancel,
    onForceSubmit: forceSubmit,
    onSkipStep: skipStep,
  }), [
    currentStatus, buttonLabel, description, explorerUrl, statusMessage,
    currentStep, mergedLabels, isProcessing, showExplorerLink, isButtonDisabled,
    flow.currentStepIndex, stepDefs.length, currentStepDef?.optional,
    handleClick, cancel, forceSubmit, skipStep,
  ])

  const isCustomRender = typeof children === 'function'

  // First-render guard: suppress entrance animations so the button does not
  // flash a success-glow / shake when it mounts directly into a terminal state
  // (e.g. completed on rehydrate). Flips to "false" after the first paint.
  const [ isMounting, setMounting ] = useState(true)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      setMounting(false)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cx('tx-txb', className)}
      data-testid={testId}
      data-mount={isMounting ? 'true' : undefined}
      role="group"
      aria-label="Transaction"
      onKeyDown={isCustomRender ? undefined : handleKeyDown}
    >
      {
        isCustomRender
          ? children(renderData)
          : <TransactionButtonDefault {...defaultProps} />
      }
    </div>
  )
})

TransactionButton.displayName = 'TransactionButton'


export default TransactionButton
