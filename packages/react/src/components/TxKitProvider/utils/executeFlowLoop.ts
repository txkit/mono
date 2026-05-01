import type { PublicClient } from 'viem'

import { classifyError } from '@txkit/core'
import type { TransactionError } from '@txkit/core'

import type {
  FlowState,
  FlowStep,
  StepContext,
  StepResult,
  SafetyConfig,
  WagmiMutations,
} from '../../../types/transaction'
import {
  advanceStep,
  failStep,
  pauseFlow,
  rejectStep,
  resumeFlow,
  skipStep,
  updateStep,
} from './flowTransitions'
import { executeTxStep } from './executeTxStep'
import { executeSignStep } from './executeSignStep'


export type ExecuteFlowLoopDeps = {
  address: `0x${string}`
  targetChainId: number
  confirmations: number
  publicClient: PublicClient | undefined
  walletClient: WagmiMutations['walletClient']
  flow: FlowState
  setFlow: (updater: (prev: FlowState) => FlowState) => void
  writeContractAsync: WagmiMutations['writeContractAsync']
  sendTransactionAsync: WagmiMutations['sendTransactionAsync']
  invalidateAffected: WagmiMutations['invalidateAffected']
  makeError: (err: unknown, codeOverride?: TransactionError['code']) => TransactionError
  buildContext: () => StepContext
  mountedRef: { current: boolean }
  executingRef: { current: boolean }
  safetyRef: { current: SafetyConfig }
  stepDefsRef: { current: FlowStep[] }
  abortControllerRef: { current: AbortController | null }
  cachedSignaturesRef: { current: Record<string, `0x${string}`> }
  resultsRef: { current: Record<string, StepResult> }
  onFlowCompleteRef: { current: ((results: Record<string, StepResult>) => void) | undefined }
  onStepErrorRef: { current: ((error: TransactionError, stepId: string) => void) | undefined }
  onStepCompleteRef: { current: ((stepId: string, result: StepResult) => void) | undefined }
}

/** Main flow execution loop. Iterates steps, handles skip/wait/error/completion */
export const executeFlowLoop = async (deps: ExecuteFlowLoopDeps): Promise<void> => {
  const {
    address,
    targetChainId,
    confirmations,
    publicClient,
    walletClient,
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
  } = deps

  if (executingRef.current) {
    return
  }
  executingRef.current = true

  try {
    const steps = stepDefsRef.current

    for (let index = flow.currentStepIndex; index < steps.length; index++) {
      if (!mountedRef.current) {
        break
      }

      const step = steps[index]
      const context = buildContext()

      if (step.shouldSkip) {
        const shouldSkipResult = await step.shouldSkip(context)
        if (shouldSkipResult) {
          setFlow((prev) => skipStep(prev, index))
          continue
        }
      }

      step.onStart?.(context)

      let stepCompleted: boolean
      try {
        if (step.type === 'sign') {
          stepCompleted = await executeSignStep(step, index, {
            walletClient,
            setFlow,
            buildContext,
            mountedRef,
            cachedSignaturesRef,
            resultsRef,
            onStepCompleteRef,
          })
        } else {
          stepCompleted = await executeTxStep(step, index, {
            address,
            targetChainId,
            confirmations,
            publicClient,
            flow,
            setFlow,
            writeContractAsync,
            sendTransactionAsync,
            invalidateAffected,
            makeError,
            buildContext,
            mountedRef,
            safetyRef,
            resultsRef,
            onStepErrorRef,
            onStepCompleteRef,
          })
        }
      }
      catch (error) {
        if (!mountedRef.current) {
          break
        }

        const code = classifyError(error)

        if (code === 'USER_REJECTED') {
          setFlow((prev) => rejectStep(prev, index, makeError(error, 'USER_REJECTED')))
        } else {
          const txError = makeError(error)
          setFlow((prev) => failStep(prev, index, txError))
          step.onError?.({ ...buildContext(), error: txError })
          onStepErrorRef.current?.(txError, step.id)
        }
        break
      }

      // Step returned false - paused (confirming-risk), failed (simulation-failed), or unmounted
      if (!stepCompleted) {
        break
      }

      if (step.waitAfterMs && step.waitAfterMs > 0) {
        setFlow((prev) => updateStep(prev, index, { status: 'waiting' }))
        setFlow((prev) => pauseFlow(prev))
        await new Promise<void>((resolve) => setTimeout(resolve, step.waitAfterMs))
        if (!mountedRef.current) {
          break
        }
        setFlow((prev) => resumeFlow(prev))
      }

      if (step.waitForCondition) {
        setFlow((prev) => updateStep(prev, index, { status: 'waiting' }))
        setFlow((prev) => pauseFlow(prev))

        abortControllerRef.current = new AbortController()
        try {
          await step.waitForCondition(buildContext(), abortControllerRef.current.signal)
        }
        catch (error) {
          if (abortControllerRef.current.signal.aborted) {
            break // Expected - flow was canceled
          }
          const txError = makeError(error, 'TIMEOUT')
          setFlow((prev) => failStep(prev, index, txError))
          onStepErrorRef.current?.(txError, step.id)
          break
        } finally {
          abortControllerRef.current = null
        }

        if (!mountedRef.current) {
          break
        }
        setFlow((prev) => resumeFlow(prev))
      }

      setFlow((prev) => advanceStep(prev))
    }
  } finally {
    executingRef.current = false
  }

  if (mountedRef.current) {
    setFlow((prev) => {
      if (prev.status === 'error' || prev.status === 'rejected' || prev.status === 'completed') {
        return prev
      }
      const allCompleted = prev.steps.every(
        (step) => step.status === 'completed' || step.status === 'skipped',
      )
      if (allCompleted) {
        setTimeout(() => {
          onFlowCompleteRef.current?.(resultsRef.current)
        }, 0)
        return { ...prev, status: 'completed' }
      }
      return prev
    })
  }
}
