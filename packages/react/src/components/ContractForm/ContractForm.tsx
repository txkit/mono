'use client'
// NOTE: deferred to v0.1.0. Not exported from @txkit/react public API in v0.1.0.
// Component code, hook, tests, and story remain intact for iteration; re-enable
// in packages/react/src/index.ts once Phase 2b (read functions, multi-function,
// ENS, gas estimation) is ready.
import React, { forwardRef, useCallback, useMemo } from 'react'
import { cx } from '@txkit/core'
import type { TransactionError } from '@txkit/core'

import useDeepMemo from '../../hooks/useDeepMemo'
import type { StepResult } from '../../types/transaction'

import useContractForm from '../../hooks/useContractForm'
import ContractFormDefault from './ContractFormDefault'
import { defaultLabels } from './labels'
import type { ContractFormProps } from '../../types/contract'

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

  const handleFlowComplete = useCallback((results: Record<string, StepResult>) => {
    const txResult = Object.values(results).find((result) => result.type === 'tx')
    if (txResult?.type === 'tx' && onSuccess) {
      onSuccess(txResult.receipt)
    }
  }, [ onSuccess ])

  // Wire onError to TransactionButton. The TransactionFlow contract guarantees
  // `error.code` is a TransactionErrorCode, so we forward without a cast.
  const handleError = useCallback((error: TransactionError, _stepId: string) => {
    if (onError) {
      onError(error)
    }
  }, [ onError ])

  return (
    <div
      ref={ref}
      className={cx('tx-cf', className)}
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
