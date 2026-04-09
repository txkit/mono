'use client'
import React, { forwardRef, useCallback, useMemo } from 'react'
import { cx } from '@txkit/core'
import type { TransactionReceipt, TransactionError } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import type { StepResult } from '../../transaction/shared/flow-types'

import useContractForm from '../useContractForm'
import ContractFormDefault from './ContractFormDefault'
import { defaultLabels } from '../labels'
import type { ContractFormProps } from '../types'

import './ContractForm.css'


const ContractForm = forwardRef<HTMLDivElement, ContractFormProps>(({
  className,
  children,
  'data-testid': testId,
  abi,
  address,
  functionName,
  chainId,
  label,
  labels,
  safety,
  disabled,
  onSuccess,
  onError,
}, ref) => {
  const form = useContractForm({ abi, address, functionName, chainId, safety, disabled, onSuccess, onError })
  const mergedLabels = useDeepMemo(() => ({ ...defaultLabels, ...labels }), [ labels ])

  const dataState = useMemo(() => {
    if (form.formError) {
      return 'error'
    }
    if (form.isValid) {
      return 'valid'
    }
    return 'idle'
  }, [ form.formError, form.isValid ])

  // Wire onSuccess: extract receipt from flow results
  const handleFlowComplete = useCallback((results: Record<string, StepResult>) => {
    const txResult = Object.values(results).find((result) => result.type === 'tx')
    if (txResult && txResult.type === 'tx' && onSuccess) {
      onSuccess(txResult.receipt)
    }
  }, [ onSuccess ])

  // Wire onError to TransactionButton
  const handleError = useCallback((error: { code: string; message: string; cause?: Error }, _stepId: string) => {
    if (onError) {
      onError(error as TransactionError)
    }
  }, [ onError ])

  return (
    <div
      ref={ref}
      className={cx('txkit-cf', className)}
      data-testid={testId}
      data-state={dataState}
    >
      {
        typeof children === 'function'
          ? children(form)
          : (
            <ContractFormDefault
              {...form}
              label={label ?? functionName}
              labels={mergedLabels}
              disabled={disabled}
              chainId={chainId}
              onFlowComplete={handleFlowComplete}
              onError={handleError}
            />
          )
      }
    </div>
  )
})

ContractForm.displayName = 'ContractForm'


export default ContractForm
