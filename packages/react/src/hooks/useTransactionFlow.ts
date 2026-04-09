'use client'
import { useRef, useMemo, useEffect, useCallback } from 'react'
import {
  useAccount,
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
import { setFlowEntry, notifyFlowListeners } from '../helpers/flowStore'
import { useFlowStore } from './useFlowState'
import { executeFlowLoop } from '../helpers/executeFlowLoop'
import type {
  FlowStep,
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
} from '../helpers/flowTransitions'


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

  // --- Refs for fresh values in async callbacks ---
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

  // --- Core state ---
  const [ flow, setFlow ] = useObjectState<FlowState>(() => createFlowState(stepDefs))

  // Re-create flow state when step definitions change
  const prevStepCountRef = useRef(stepDefs.length)
  useEffect(() => {
    if (stepDefs.length !== prevStepCountRef.current) {
      prevStepCountRef.current = stepDefs.length
      setFlow(() => createFlowState(stepDefs))
    }
  }, [ stepDefs, setFlow ])

  // --- Wagmi hooks ---
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const targetChainId = chainIdProp ?? currentChainId
  const publicClient = usePublicClient({ chainId: targetChainId })
  const { data: walletClient } = useWalletClient()
  const { invalidateAffected, invalidateAll } = useBalanceInvalidation()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()

  // --- Helpers ---

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


  // --- Main execution loop ---
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

  // --- Disconnect detection ---
  useEffect(() => {
    if (!isConnected && activeStepStates.includes(flow.steps[flow.currentStepIndex]?.status)) {
      const txError: TransactionError = {
        code: 'NETWORK_ERROR',
        message: 'Wallet disconnected',
      }
      setFlow((prev) => failStep(prev, prev.currentStepIndex, txError))
    }
  }, [ isConnected, flow.currentStepIndex, flow.steps, setFlow ])

  // --- Auto-reset after completion ---
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

  // --- Public actions ---

  const start = useCallback(async () => {
    if (flow.status !== 'idle' || !address || !isConnected) {
      return
    }

    // Reset refs
    resultsRef.current = {}
    cachedSignaturesRef.current = {}

    // Chain switch if needed
    if (currentChainId !== targetChainId) {
      try {
        await switchChainAsync({ chainId: targetChainId })
      } catch (err) {
        const code = classifyError(err)
        if (code === 'USER_REJECTED') {
          setFlow((prev) => rejectStep(prev, 0, makeError(err, 'USER_REJECTED')))
        } else {
          setFlow((prev) => failStep(prev, 0, makeError(err, 'CHAIN_MISMATCH')))
        }
        return
      }
    }

    setFlow((prev) => startFlow(prev))
    // executeFlow will be triggered by the status change to 'running'
  }, [
    address, flow.status, isConnected, currentChainId,
    targetChainId, makeError, setFlow, switchChainAsync,
  ])

  // Trigger execution when status changes to 'running'
  useEffect(() => {
    if (flow.status === 'running' && !executingRef.current) {
      executeFlow()
    }
  }, [ flow.status, executeFlow ])

  const confirm = useCallback(() => {
    const currentStep = flow.steps[flow.currentStepIndex]
    if (currentStep?.status !== 'confirming-risk' || currentStep.confirmCountdown > 0) {
      return
    }
    // Resume execution from current step
    setFlow((prev) => updateStep(prev, prev.currentStepIndex, { status: 'pending' }))
    executeFlow()
  }, [ flow.currentStepIndex, flow.steps, executeFlow, setFlow ])

  const cancel = useCallback(async () => {
    // Abort pending waitForCondition
    abortControllerRef.current?.abort()

    // Call step.onCancel if defined
    const currentStepDef = stepDefsRef.current[flow.currentStepIndex]
    if (currentStepDef?.onCancel) {
      try {
        await currentStepDef.onCancel(buildContext())
      } catch {
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

  // --- Countdown timer for confirming-risk ---
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

  // --- Register in FlowStore for compound components ---
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

  // Sync write (no notify, no re-render)
  if (flowStore) {
    setFlowEntry(flowStore, flowId, { flow, steps: stepDefs, actions: actionsRef.current })
  }

  // Notify subscribers only on meaningful changes (flow status or current step status)
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
