'use client'
import { useState, useMemo, useCallback, useRef } from 'react'

import { txStep } from '../components/TxKitProvider/utils/flowHelpers'
import type { ContractTransactionProps, FlowStep } from '../types/transaction'

import {
  buildArgs,
  buildCalldataPreview,
  buildFields,
  extractValue,
  getAbiFunction,
  getInitialValues,
  getSecurityWarnings,
  validateFull,
} from '../components/ContractForm/utils'
import type {
  SecurityWarning,
  UseContractFormOptions,
  UseContractFormReturn,
} from '../types/contract'


const useContractForm = (options: UseContractFormOptions): UseContractFormReturn => {
  const {
    abi,
    address,
    functionName,
    computedParams,
    defaultParams,
    hiddenParams,
    balance = 0n,
    onSuccess,
    onError,
  } = options

  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const { abiFunction, formError: abiError } = useMemo(() => {
    const result = getAbiFunction(abi, functionName)

    return {
      abiFunction: result.fn,
      formError: result.error,
    }
  }, [ abi, functionName ])

  const fields = useMemo(() => {
    if (!abiFunction) {
      return []
    }
    const allFields = buildFields(abiFunction)

    if (hiddenParams?.length) {
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

  const [ values, setValues ] = useState<Record<string, string>>(() => getInitialValues(fields))
  const [ errors, setErrors ] = useState<Record<string, string | null>>({})
  const [ touched, setTouched ] = useState<Record<string, boolean>>({})

  const prevFunctionName = useRef(functionName)
  if (prevFunctionName.current !== functionName) {
    prevFunctionName.current = functionName
    setValues(getInitialValues(fields))
    setErrors({})
    setTouched({})
  }

  const setFieldValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))

    // "Reward Early, Punish Late"
    setErrors((prev) => {
      if (!prev[name]) {
        return prev
      }
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

  const isPayable = Boolean(abiFunction?.stateMutability === 'payable')

  const warnings = useMemo<SecurityWarning[]>(() => {
    return getSecurityWarnings(functionName, values, allFields, balance)
  }, [ functionName, values, allFields, balance ])

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
      const mergedValues = { ...values }
      if (defaultParams) {
        for (const [ name, defaultValue ] of Object.entries(defaultParams)) {
          if (!(name in mergedValues) || mergedValues[name] === '') {
            mergedValues[name] = String(defaultValue)
          }
        }
      }

      const args = buildArgs(mergedValues, allFields)

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
    }
    catch {
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
