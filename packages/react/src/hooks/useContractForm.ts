'use client'
import { useState, useMemo, useCallback, useRef } from 'react'
import type { AbiFunction } from 'viem'

import type { TransactionError, TransactionReceipt } from '@txkit/core'

import { txStep } from '../helpers/flowHelpers'
import type { ContractTransactionProps, FlowStep, StepResult } from '../types/transaction'

import {
  buildArgs,
  buildCalldataPreview,
  buildFields,
  extractValue,
  getAbiFunction,
  getInitialValues,
  getSecurityWarnings,
  validateFormat,
  validateFull,
} from '../helpers/abiFields'
import type {
  FieldDescriptor,
  SecurityWarning,
  UseContractFormOptions,
  UseContractFormReturn,
} from '../types/contract'


const useContractForm = (options: UseContractFormOptions): UseContractFormReturn => {
  const {
    abi,
    address,
    functionName,
    chainId,
    safety,
    disabled,
    computedParams,
    defaultParams,
    hiddenParams,
    onSuccess,
    onError,
  } = options

  // Refs for callback props (prevent stale closures)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  // --- ABI Resolution ---
  const { abiFunction, formError: abiError } = useMemo(() => {
    const result = getAbiFunction(abi, functionName)
    return {
      abiFunction: result.fn as AbiFunction | undefined,
      formError: result.error,
    }
  }, [ abi, functionName ])

  // --- Field Descriptors ---
  const fields = useMemo(() => {
    if (!abiFunction) {
      return []
    }
    const allFields = buildFields(abiFunction)

    // Phase 3: filter out hidden params
    if (hiddenParams && hiddenParams.length > 0) {
      return allFields.filter((field) => !hiddenParams.includes(field.name))
    }

    return allFields
  }, [ abiFunction, hiddenParams ])

  // All fields including hidden (for building args)
  const allFields = useMemo(() => {
    if (!abiFunction) {
      return []
    }
    return buildFields(abiFunction)
  }, [ abiFunction ])

  // --- Form State ---
  const [ values, setValues ] = useState<Record<string, string>>(() => getInitialValues(fields))
  const [ errors, setErrors ] = useState<Record<string, string | null>>({})
  const [ touched, setTouched ] = useState<Record<string, boolean>>({})

  // Reset form when function changes
  const prevFunctionName = useRef(functionName)
  if (prevFunctionName.current !== functionName) {
    prevFunctionName.current = functionName
    setValues(getInitialValues(fields))
    setErrors({})
    setTouched({})
  }

  // --- Actions ---

  const setFieldValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))

    // "Reward Early, Punish Late"
    setErrors((prev) => {
      if (!prev[name]) {
        return prev
      }
      // Has error -> re-validate to clear early (reward)
      const field = fields.find((field) => field.name === name)
      if (!field) {
        return prev
      }
      const error = validateFull(value, field)
      if (error !== prev[name]) {
        return { ...prev, [name]: error }
      }
      return prev
    })
  }, [ fields ])

  const setFieldTouched = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))

    // "Punish Late" - full validation on blur
    const field = fields.find((field) => field.name === name)
    if (!field) {
      return
    }

    setValues((currentValues) => {
      const value = currentValues[name] ?? ''
      const error = validateFull(value, field)
      setErrors((prev) => {
        if (prev[name] === error) {
          return prev
        }
        return { ...prev, [name]: error }
      })
      return currentValues
    })
  }, [ fields ])

  // --- Computed Values ---

  const isPayable = Boolean(abiFunction?.stateMutability === 'payable')

  const warnings = useMemo<SecurityWarning[]>(() => {
    return getSecurityWarnings(functionName, values, allFields)
  }, [ functionName, values, allFields ])

  const isValid = useMemo(() => {
    if (abiError) {
      return false
    }
    if (fields.length === 0 && !isPayable) {
      return Boolean(abiFunction)
    }
    return fields.every((field) => {
      const value = values[field.name] ?? ''
      if (value === '' && !field.isPayableValue) {
        return false
      }
      if (value === '' && field.isPayableValue) {
        return true // payable value is optional (default 0)
      }
      return validateFull(value, field) === null
    })
  }, [ abiError, abiFunction, fields, values, isPayable ])

  const txParams = useMemo<ContractTransactionProps | undefined>(() => {
    if (!isValid || !abiFunction) {
      return undefined
    }
    try {
      // Merge visible values with defaults and computed params
      const mergedValues = { ...values }
      if (defaultParams) {
        // Phase 3: inject default params for hidden fields
        for (const [ name, defaultValue ] of Object.entries(defaultParams)) {
          if (!(name in mergedValues) || mergedValues[name] === '') {
            mergedValues[name] = String(defaultValue)
          }
        }
      }

      const args = buildArgs(mergedValues, allFields)

      // Phase 3: apply computed params (override args by position)
      if (computedParams) {
        for (const [ name, resolver ] of Object.entries(computedParams)) {
          const fieldIndex = allFields.findIndex((field) => field.name === name && !field.isPayableValue)
          if (fieldIndex !== -1) {
            args[fieldIndex] = resolver()
          }
        }
      }

      const value = extractValue(mergedValues, allFields)

      return {
        address,
        abi,
        functionName,
        args,
        value,
      }
    } catch {
      return undefined
    }
  }, [ isValid, abiFunction, values, address, abi, functionName, allFields, defaultParams, computedParams ])

  const steps = useMemo<FlowStep[]>(() => {
    if (!txParams) {
      return []
    }
    return [ txStep(functionName, functionName, txParams) ]
  }, [ txParams, functionName ])

  const calldataPreview = useMemo<string | undefined>(() => {
    if (!txParams) {
      return undefined
    }
    return buildCalldataPreview(abi, functionName, txParams.args ?? [])
  }, [ txParams, abi, functionName ])

  return {
    fields,
    values,
    errors,
    touched,
    warnings,
    calldataPreview,
    isValid,
    isPayable,
    formError: abiError,
    setFieldValue,
    setFieldTouched,
    abiFunction,
    steps,
    txParams,
  }
}


export default useContractForm
