'use client'
import React, { useMemo, useCallback, forwardRef } from 'react'
import type { StepStatus } from '@txkit/core'
import { cx, getExplorerUrl } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import useTransactionFlow from '../../hooks/useTransactionFlow'
import { defaultLabels } from './labels'
import TransactionButtonDefault from './TransactionButtonDefault'
import type { TransactionButtonLabels } from './labels'
import type { TransactionButtonProps, TransactionButtonRenderData } from '../../types/transaction'
import './TransactionButton.css'


export { type TransactionButtonLabels }

const processingStates: readonly StepStatus[] = [ 'simulating', 'signing', 'tx-pending' ]

const mapStepStatusToButtonLabel = (
  status: StepStatus | undefined,
  labels: Required<TransactionButtonLabels>,
  label: string | undefined
): string => {
  switch (status) {
    case 'pending':
    case undefined:
      return label ?? labels.send
    case 'simulating':
      return labels.simulating
    case 'confirming-risk':
      return labels.confirm
    case 'simulation-failed':
      return labels.retry
    case 'signing':
      return labels.awaitingSignature
    case 'tx-pending':
      return labels.pending
    case 'waiting':
      return labels.pending
    case 'completed':
      return labels.success
    case 'error':
      return labels.retry
    case 'rejected':
      return labels.retry
    case 'skipped':
      return label ?? labels.send
    case 'canceled':
      return labels.retry
  }
}

const mapStepStatusToMessage = (
  status: StepStatus | undefined,
  labels: Required<TransactionButtonLabels>,
  errorMessage: string | undefined,
  stepLabel: string | undefined
): string => {
  switch (status) {
    case 'simulating':
      return `Simulating ${stepLabel ?? 'transaction'}...`
    case 'confirming-risk':
      return 'Review transaction details before confirming'
    case 'simulation-failed':
      return `Simulation failed${errorMessage ? `: ${errorMessage}` : ''}`
    case 'signing':
      return labels.awaitingSignature
    case 'tx-pending':
      return `${stepLabel ?? 'Transaction'} submitted. Waiting for confirmation...`
    case 'waiting':
      return `Waiting for ${stepLabel ?? 'condition'}...`
    case 'completed':
      return 'Transaction confirmed!'
    case 'error':
      return `Transaction failed${errorMessage ? `: ${errorMessage}` : ''}`
    case 'rejected':
      return 'Transaction rejected'
    case 'canceled':
      return 'Transaction canceled'
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

  // Current step state
  const currentStep = flow.steps[flow.currentStepIndex]
  const currentStepDef = stepDefs[flow.currentStepIndex]
  const currentStatus = currentStep?.status ?? 'pending'

  // Explorer URL from current step hash
  const explorerUrl = useMemo(() => {
    if (!currentStep?.hash || !chainId) {
      return undefined
    }
    return getExplorerUrl(chainId, currentStep.hash, 'tx')
  }, [ currentStep?.hash, chainId ])

  // Button label
  const buttonLabel = useMemo(
    () => mapStepStatusToButtonLabel(currentStatus, mergedLabels, label),
    [ currentStatus, mergedLabels, label ],
  )

  // Status message for aria-live
  const statusMessage = useMemo(
    () => mapStepStatusToMessage(currentStatus, mergedLabels, currentStep?.error?.message, currentStepDef?.label),
    [ currentStatus, mergedLabels, currentStep?.error?.message, currentStepDef?.label ],
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
      case 'rejected':
        retry()
        break
      case 'completed':
        reset()
        break
    }
  }, [ flow.status, currentStatus, start, confirm, retry, reset ])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && currentStatus === 'confirming-risk') {
      cancel()
    }
  }, [ cancel, currentStatus ])

  // Render data for children function (tier 2)
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

  const isCustomRender = typeof children === 'function'

  return (
    <div
      ref={ref}
      className={cx('txkit-txb', className)}
      data-testid={testId}
      role="group"
      aria-label="Transaction"
      onKeyDown={isCustomRender ? undefined : handleKeyDown}
    >
      {
        isCustomRender
          ? children(renderData)
          : (
            <TransactionButtonDefault
              state={currentStatus}
              buttonLabel={buttonLabel}
              explorerUrl={explorerUrl}
              statusMessage={statusMessage}
              error={currentStep?.error}
              riskResult={currentStep?.riskResult}
              mergedLabels={mergedLabels}
              decodedCalldata={currentStep?.decodedCalldata}
              confirmCountdown={currentStep?.confirmCountdown ?? 0}
              isProcessing={isProcessing}
              showExplorerLink={showExplorerLink}
              isButtonDisabled={isButtonDisabled}
              onClick={handleClick}
              onCancel={cancel}
              onForceSubmit={forceSubmit}
            />
          )
      }
    </div>
  )
})

TransactionButton.displayName = 'TransactionButton'


export default TransactionButton
