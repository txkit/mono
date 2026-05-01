'use client'
import { useRef, useMemo, useEffect, useCallback } from 'react'
import {
  useConnection,
  useChainId,
  useSwitchChain,
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useSendTransaction,
} from 'wagmi'
import useBalanceInvalidation from './useBalanceInvalidation'

import { classifyError, getErrorMessage } from '@txkit/core'
import type { StepStatus, TransactionError } from '@txkit/core'

import useObjectState from './useObjectState'
import useDeepMemo from './useDeepMemo'
import { setFlowEntry, notifyFlowListeners } from '../components/TxKitProvider/utils/flowStore'
import { useFlowStore } from './useFlowState'
import { executeFlowLoop } from '../components/TxKitProvider/utils/executeFlowLoop'
import type {
  FlowState,
  StepResult,
  StepContext,
  SafetyConfig,
  UseTransactionFlowOptions,
  UseTransactionFlowReturn,
} from '../types/transaction'
import {
  cancelFlow as cancelFlowTransition,
  createFlowState,
  failStep,
  resetFlow,
  rejectStep,
  retryFrom as retryFromTransition,
  skipStep,
  startFlow,
  updateStep,
} from '../components/TxKitProvider/utils/flowTransitions'


const DEFAULT_SAFETY: SafetyConfig = {
  simulate: true,
  delayMs: 0,
  warnMaxApproval: true,
  riskProvider: null,
}

const activeStepStates: readonly StepStatus[] = [ 'signing', 'tx-pending' ]
const retryableStates: readonly StepStatus[] = [ 'error', 'rejected', 'simulation-failed' ]


const useTransactionFlow = (options: UseTransactionFlowOptions): UseTransactionFlowReturn => {
  const {
    steps: stepDefs,
    flowId = '__default__',
    safety: safetyProp,
    chainId: chainIdProp,
    confirmations = 1,
    resetDelay = 0,
  } = options

  const safety = useDeepMemo(
    () => ({ ...DEFAULT_SAFETY, ...safetyProp }),
    [ safetyProp ],
  )

  const safetyRef = useRef(safety)
  const stepDefsRef = useRef(stepDefs)
  const onFlowStatusChangeRef = useRef(options.onFlowStatusChange)
  const onFlowCompleteRef = useRef(options.onFlowComplete)
  const onStepErrorRef = useRef(options.onStepError)
  const onStepCompleteRef = useRef(options.onStepComplete)
  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const cachedSignaturesRef = useRef<Record<string, `0x${string}`>>({})
  const resultsRef = useRef<Record<string, StepResult>>({})
  const executingRef = useRef(false)

  safetyRef.current = safety
  stepDefsRef.current = stepDefs
  onFlowStatusChangeRef.current = options.onFlowStatusChange
  onFlowCompleteRef.current = options.onFlowComplete
  onStepErrorRef.current = options.onStepError
  onStepCompleteRef.current = options.onStepComplete

  useEffect(() => () => {
    mountedRef.current = false
    abortControllerRef.current?.abort()
  }, [])

  const [ flow, setFlow ] = useObjectState<FlowState>(() => createFlowState(stepDefs))

  const prevStepCountRef = useRef(stepDefs.length)
  useEffect(() => {
    if (stepDefs.length !== prevStepCountRef.current) {
      prevStepCountRef.current = stepDefs.length
      setFlow(() => createFlowState(stepDefs))
    }
  }, [ stepDefs, setFlow ])

  const { address, isConnected } = useConnection()
  const currentChainId = useChainId()
  const targetChainId = chainIdProp ?? currentChainId
  const publicClient = usePublicClient({ chainId: targetChainId })
  const { data: walletClient } = useWalletClient()
  const { invalidateAffected } = useBalanceInvalidation()
  const { mutateAsync: switchChainAsync } = useSwitchChain()
  const { mutateAsync: sendTransactionAsync } = useSendTransaction()
  const { mutateAsync: writeContractAsync } = useWriteContract()

  const makeError = useCallback((err: unknown, codeOverride?: TransactionError['code']): TransactionError => {
    const code = codeOverride ?? classifyError(err)

    return {
      code,
      message: getErrorMessage(code),
      cause: err instanceof Error ? err : undefined,
    }
  }, [])

  const buildContext = useCallback((): StepContext => {
    const results = resultsRef.current
    const stepIds = stepDefsRef.current.map((step) => step.id)
    const currentIndex = flow.currentStepIndex
    const previousStepId = currentIndex > 0 ? stepIds[currentIndex - 1] : undefined

    return {
      results,
      previousResult: previousStepId ? results[previousStepId] : undefined,
      address: address!,
      chainId: targetChainId,
      publicClient: publicClient!,
    }
  }, [ address, flow.currentStepIndex, targetChainId, publicClient ])


  const executeFlow = useCallback(async () => {
    await executeFlowLoop({
      address: address!,
      targetChainId,
      confirmations,
      publicClient,
      walletClient: walletClient ?? undefined,
      flow,
      setFlow,
      writeContractAsync,
      sendTransactionAsync,
      invalidateAffected,
      makeError,
      buildContext,
      mountedRef,
      executingRef,
      safetyRef,
      stepDefsRef,
      abortControllerRef,
      cachedSignaturesRef,
      resultsRef,
      onFlowCompleteRef,
      onStepErrorRef,
      onStepCompleteRef,
    })
  }, [
    address, buildContext, confirmations, flow,
    invalidateAffected, makeError, publicClient, setFlow,
    targetChainId, walletClient, writeContractAsync, sendTransactionAsync,
  ])

  useEffect(() => {
    if (!isConnected && activeStepStates.includes(flow.steps[flow.currentStepIndex]?.status)) {
      const txError: TransactionError = {
        code: 'NETWORK_ERROR',
        message: 'Wallet disconnected',
      }
      setFlow((prev) => failStep(prev, prev.currentStepIndex, txError))
    }
  }, [ isConnected, flow.currentStepIndex, flow.steps, setFlow ])

  useEffect(() => {
    if (flow.status !== 'completed' || resetDelay <= 0) {
      return
    }
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        resultsRef.current = {}
        cachedSignaturesRef.current = {}
        setFlow((prev) => resetFlow(prev))
      }
    }, resetDelay)
    return () => clearTimeout(timer)
  }, [ flow.status, resetDelay, setFlow ])

  const start = useCallback(async () => {
    if (flow.status !== 'idle' || !address || !isConnected) {
      return
    }

    resultsRef.current = {}
    cachedSignaturesRef.current = {}

    if (currentChainId !== targetChainId) {
      try {
        await switchChainAsync({ chainId: targetChainId })
      }
      catch (error) {
        const code = classifyError(error)
        if (code === 'USER_REJECTED') {
          setFlow((prev) => rejectStep(prev, 0, makeError(error, 'USER_REJECTED')))
        } else {
          setFlow((prev) => failStep(prev, 0, makeError(error, 'CHAIN_MISMATCH')))
        }
        return
      }
    }

    setFlow((prev) => startFlow(prev))
  }, [
    address, flow.status, isConnected, currentChainId,
    targetChainId, makeError, setFlow, switchChainAsync,
  ])

  // Trigger execution only when status transitions INTO 'running'.
  //
  // executeFlow is recreated on every flow change (it captures `flow` in
  // its deps), so this effect re-runs after every state mutation. Without
  // a transition guard, statuses that stay 'running' after a step pause
  // (e.g. `simulation-failed`, `error` on a single step) would keep
  // re-entering executeFlowLoop the moment its `executingRef` released,
  // looping forever and re-firing onStart / simulate. We only want
  // auto-execute on idle->running, error->running, paused->running edges.
  const prevAutoStatusRef = useRef<typeof flow.status | null>(null)
  useEffect(() => {
    const prev = prevAutoStatusRef.current
    if (flow.status === 'running' && prev !== 'running' && !executingRef.current) {
      executeFlow()
    }
    prevAutoStatusRef.current = flow.status
  }, [ flow.status, executeFlow ])

  const confirm = useCallback(() => {
    const currentStep = flow.steps[flow.currentStepIndex]
    if (currentStep?.status !== 'confirming-risk' || currentStep.confirmCountdown > 0) {
      return
    }
    setFlow((prev) => updateStep(prev, prev.currentStepIndex, { status: 'pending' }))
    executeFlow()
  }, [ flow.currentStepIndex, flow.steps, executeFlow, setFlow ])

  const cancel = useCallback(async () => {
    abortControllerRef.current?.abort()

    const currentStepDef = stepDefsRef.current[flow.currentStepIndex]
    if (currentStepDef?.onCancel) {
      try {
        await currentStepDef.onCancel(buildContext())
      }
      catch {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[txKit] onCancel failed for step "${currentStepDef.id}"`)
        }
      }
    }

    setFlow((prev) => cancelFlowTransition(prev, prev.currentStepIndex))
  }, [ buildContext, flow.currentStepIndex, setFlow ])

  const retry = useCallback(() => {
    const currentStep = flow.steps[flow.currentStepIndex]
    if (!currentStep || !retryableStates.includes(currentStep.status)) {
      return
    }
    setFlow((prev) => retryFromTransition(prev, prev.currentStepIndex))
  }, [ flow.currentStepIndex, flow.steps, setFlow ])

  const retryFromAction = useCallback((stepId: string) => {
    const index = stepDefsRef.current.findIndex((step) => step.id === stepId)
    if (index === -1) {
      return
    }
    setFlow((prev) => retryFromTransition(prev, index))
  }, [ setFlow ])

  const forceSubmit = useCallback(() => {
    const currentStep = flow.steps[flow.currentStepIndex]
    if (currentStep?.status !== 'simulation-failed') {
      return
    }
    setFlow((prev) => updateStep(prev, prev.currentStepIndex, {
      status: 'pending',
      error: undefined,
    }))
    executeFlow()
  }, [ flow.currentStepIndex, flow.steps, executeFlow, setFlow ])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    resultsRef.current = {}
    cachedSignaturesRef.current = {}
    setFlow((prev) => resetFlow(prev))
  }, [ setFlow ])

  const skipStepAction = useCallback(() => {
    const currentStepDef = stepDefsRef.current[flow.currentStepIndex]
    if (!currentStepDef?.optional) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[txKit] Cannot skip non-optional step "${currentStepDef?.id}"`)
      }
      return
    }
    setFlow((prev) => skipStep(prev, prev.currentStepIndex))
  }, [ flow.currentStepIndex, setFlow ])

  useEffect(() => {
    const currentStep = flow.steps[flow.currentStepIndex]
    if (currentStep?.status !== 'confirming-risk' || currentStep.confirmCountdown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setFlow((prev) => {
        const step = prev.steps[prev.currentStepIndex]
        if (!step || step.status !== 'confirming-risk') {
          return prev
        }
        const newCountdown = step.confirmCountdown - 1
        if (newCountdown < 0) {
          return prev
        }
        return updateStep(prev, prev.currentStepIndex, { confirmCountdown: newCountdown })
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [ flow.currentStepIndex, flow.steps, setFlow ])

  // Write to external store synchronously during render (just Map.set, no React setState)
  // Notify subscribers after render via useEffect (prevents infinite loop)
  const flowStore = useFlowStore()
  const actionsRef = useRef({
    start, confirm, cancel, retry,
    retryFrom: retryFromAction,
    forceSubmit, reset, skipStep: skipStepAction,
  })
  actionsRef.current = {
    start, confirm, cancel, retry,
    retryFrom: retryFromAction,
    forceSubmit, reset, skipStep: skipStepAction,
  }

  if (flowStore) {
    setFlowEntry({
      flowId,
      entry: { flow, steps: stepDefs, actions: actionsRef.current },
      store: flowStore,
    })
  }

  useEffect(() => {
    onFlowStatusChangeRef.current?.(flow.status)
  }, [ flow.status ])

  const prevNotifyKeyRef = useRef('')
  useEffect(() => {
    if (!flowStore) {
      return
    }
    const currentStep = flow.steps[flow.currentStepIndex]
    const notifyKey = `${flow.status}:${flow.currentStepIndex}:${currentStep?.status}:${currentStep?.hash ?? ''}`
    if (notifyKey !== prevNotifyKeyRef.current) {
      prevNotifyKeyRef.current = notifyKey
      notifyFlowListeners(flowStore)
    }
  })

  return useMemo((): UseTransactionFlowReturn => ({
    flow,
    steps: stepDefs,
    start,
    confirm,
    cancel,
    retry,
    retryFrom: retryFromAction,
    forceSubmit,
    reset,
    skipStep: skipStepAction,
  }), [
    flow, cancel, confirm, reset, retry, start, stepDefs,
    forceSubmit, retryFromAction, skipStepAction,
  ])
}


export default useTransactionFlow
