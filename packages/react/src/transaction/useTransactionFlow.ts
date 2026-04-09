'use client'
import { useRef, useMemo, useEffect, useCallback } from 'react'
import type { Abi } from 'viem'
import { erc20Abi, encodeFunctionData, decodeFunctionData } from 'viem'
import {
  useAccount,
  useChainId,
  useSwitchChain,
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useSendTransaction,
} from 'wagmi'
import useBalanceInvalidation from '../balance/shared/useBalanceInvalidation'

import {
  classifyError,
  getErrorMessage,
  getExplorerUrl,
  isMaxApproval,
} from '@txkit/core'
import type {
  StepStatus,
  TransactionError,
  TransactionReceipt,
  DecodedCalldata,
} from '@txkit/core'

import useObjectState from '../hooks/useObjectState'
import useDeepMemo from '../hooks/useDeepMemo'
import { useFlowStore, setFlowEntry, notifyFlowListeners } from './shared/FlowContext'
import type {
  FlowStep,
  FlowStepTx,
  FlowStepSign,
  FlowState,
  StepResult,
  StepContext,
  SafetyConfig,
  UseTransactionFlowOptions,
  UseTransactionFlowReturn,
  ContractTransactionProps,
  TxParams,
} from './shared/flow-types'
import {
  advanceStep,
  cancelFlow as cancelFlowTransition,
  createFlowState,
  failStep,
  pauseFlow,
  resetFlow,
  rejectStep,
  resumeFlow,
  retryFrom as retryFromTransition,
  skipStep,
  startFlow,
  updateStep,
} from './shared/flow-transitions'


const DEFAULT_SAFETY: SafetyConfig = {
  simulate: true,
  delayMs: 0,
  warnMaxApproval: true,
  riskProvider: null,
}

const isContractCall = (tx: TxParams): tx is ContractTransactionProps => 'abi' in tx

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


  // --- Decode calldata for contract calls ---
  const decodeCalldata = useCallback((tx: TxParams): DecodedCalldata | undefined => {
    if (!isContractCall(tx)) {
      return undefined
    }
    try {
      const data = encodeFunctionData({
        abi: tx.abi,
        functionName: tx.functionName,
        args: tx.args ?? [],
      })
      const decoded = decodeFunctionData({ abi: tx.abi, data })
      const abiItem = (tx.abi as Abi).find(
        (item) => 'name' in item && item.name === decoded.functionName,
      )
      const inputs = abiItem && 'inputs' in abiItem ? abiItem.inputs ?? [] : []

      return {
        functionName: decoded.functionName,
        args: (decoded.args ?? []).map((value, index) => ({
          name: inputs[index]?.name ?? `arg${index}`,
          type: inputs[index]?.type ?? 'unknown',
          value,
        })),
      }
    } catch {
      return undefined
    }
  }, [])

  // --- Execute a single tx step ---
  // Returns true if step completed and loop should continue, false otherwise
  const executeTxStep = useCallback(async (step: FlowStepTx, stepIndex: number): Promise<boolean> => {
    const context = buildContext()
    const currentSafety = { ...safetyRef.current, ...step.safety }

    // Resolve tx params (may be factory function)
    let txParams: TxParams
    if (typeof step.tx === 'function') {
      txParams = await step.tx(context)
    } else {
      txParams = step.tx
    }

    // Simulation
    if (currentSafety.simulate) {
      if (!mountedRef.current) {
        return false
      }
      setFlow((prev) => updateStep(prev, stepIndex, { status: 'simulating' }))

      if (!publicClient) {
        throw new Error('Public client not available')
      }

      let to: `0x${string}`
      let data: `0x${string}` | undefined
      let value: bigint | undefined

      if (isContractCall(txParams)) {
        to = txParams.address
        data = encodeFunctionData({
          abi: txParams.abi,
          functionName: txParams.functionName,
          args: txParams.args ?? [],
        })
        value = txParams.value
      } else {
        to = txParams.to
        data = txParams.data
        value = txParams.value
      }

      // Parallel simulation + gas estimation
      const [ simResult, gasResult ] = await Promise.allSettled([
        publicClient.call({ account: address!, to, data, value }),
        publicClient.estimateGas({ account: address!, to, data, value }),
      ])

      if (!mountedRef.current) {
        return false
      }

      if (simResult.status === 'rejected') {
        const txError = makeError(simResult.reason, 'SIMULATION_FAILED')
        setFlow((prev) => updateStep(prev, stepIndex, {
          status: 'simulation-failed',
          error: txError,
          decodedCalldata: decodeCalldata(txParams),
        }))
        setFlow((prev) => ({ ...prev, status: 'error' }))
        onStepErrorRef.current?.(txError, step.id)
        return false
      }

      if (gasResult.status === 'fulfilled') {
        setFlow((prev) => updateStep(prev, stepIndex, { gasEstimate: gasResult.value }))
      }

      // Risk provider
      if (currentSafety.riskProvider && address) {
        try {
          const risk = await currentSafety.riskProvider.assess({
            to,
            data,
            value,
            chainId: targetChainId,
            from: address,
          })

          if (!mountedRef.current) {
            return false
          }

          setFlow((prev) => updateStep(prev, stepIndex, { riskResult: risk }))

          if (risk.blocked) {
            const txError: TransactionError = {
              code: 'RISK_BLOCKED',
              message: getErrorMessage('RISK_BLOCKED'),
            }
            setFlow((prev) => updateStep(prev, stepIndex, {
              status: 'simulation-failed',
              error: txError,
            }))
            setFlow((prev) => ({ ...prev, status: 'error' }))
            onStepErrorRef.current?.(txError, step.id)
            return false
          }
        } catch (_err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[txKit] Risk provider assessment failed:', _err)
          }
        }
      }

      // Determine if we need user confirmation
      const risk = flow.steps[stepIndex]?.riskResult
      const hasWarnings = Boolean(risk && risk.level !== 'low')
      const hasDelay = currentSafety.delayMs > 0
      const hasMaxApproval = Boolean(currentSafety.warnMaxApproval && step.tx && isContractCall(txParams) && txParams.functionName === 'approve')

      if (hasWarnings || hasDelay || hasMaxApproval) {
        setFlow((prev) => updateStep(prev, stepIndex, {
          status: 'confirming-risk',
          confirmCountdown: Math.ceil(currentSafety.delayMs / 1000),
          decodedCalldata: decodeCalldata(txParams),
        }))
        // Flow pauses here - user must call confirm()
        return false
      }
    }

    // Sign and send
    if (!mountedRef.current) {
      return false
    }
    setFlow((prev) => updateStep(prev, stepIndex, { status: 'signing' }))

    const gasOverrides = {
      ...(step.gas ? { gas: step.gas } : {}),
    }

    let txHash: `0x${string}`

    if (isContractCall(txParams)) {
      txHash = await writeContractAsync({
        address: txParams.address,
        abi: txParams.abi,
        functionName: txParams.functionName,
        args: txParams.args ?? [],
        value: txParams.value,
        chainId: targetChainId,
        ...gasOverrides,
      })
    } else {
      txHash = await sendTransactionAsync({
        to: txParams.to,
        data: txParams.data,
        value: txParams.value,
        chainId: targetChainId,
        ...gasOverrides,
      })
    }

    if (!mountedRef.current) {
      return false
    }

    setFlow((prev) => updateStep(prev, stepIndex, { status: 'tx-pending', hash: txHash }))

    // Wait for receipt (imperative via publicClient - no hook retarget race)
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations,
    })

    if (!mountedRef.current) {
      return false
    }

    // Check receipt status
    if (receipt.status === 'reverted') {
      invalidateAffected(receipt.logs, address!)
      const txError = makeError(null, 'EXECUTION_REVERTED')
      setFlow((prev) => failStep(prev, stepIndex, txError))
      onStepErrorRef.current?.(txError, step.id)
      return false
    }

    // Success
    const txReceipt: TransactionReceipt = {
      blockNumber: receipt.blockNumber,
      transactionHash: receipt.transactionHash,
      status: receipt.status,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }

    resultsRef.current[step.id] = { type: 'tx', hash: txHash, receipt: txReceipt }
    setFlow((prev) => updateStep(prev, stepIndex, {
      status: 'completed',
      hash: txHash,
      receipt: txReceipt,
    }))

    invalidateAffected(receipt.logs, address!)
    step.onComplete?.({ ...buildContext(), hash: txHash, receipt: txReceipt })
    onStepCompleteRef.current?.(step.id, { type: 'tx', hash: txHash, receipt: txReceipt })

    return true
  }, [
    address, buildContext, confirmations, decodeCalldata, flow.steps,
    invalidateAffected, makeError, publicClient, setFlow, targetChainId,
    writeContractAsync, sendTransactionAsync,
  ])

  // --- Execute a sign step ---
  // Returns true if step completed and loop should continue, false otherwise
  const executeSignStep = useCallback(async (step: FlowStepSign, stepIndex: number): Promise<boolean> => {
    const context = buildContext()

    if (!mountedRef.current) {
      return false
    }
    setFlow((prev) => updateStep(prev, stepIndex, { status: 'signing' }))

    // Check cached signature (retry without re-signing)
    let signature = cachedSignaturesRef.current[step.id]

    if (!signature) {
      // Resolve sign data
      const signData = typeof step.sign.signData === 'function'
        ? await step.sign.signData(context)
        : step.sign.signData

      // Request signature from wallet (imperative via viem walletClient)
      if (!walletClient) {
        throw new Error('Wallet not connected')
      }

      if (signData.method === 'eth_signTypedData_v4') {
        signature = await walletClient.signTypedData({
          domain: signData.domain,
          types: signData.types,
          primaryType: Object.keys(signData.types)[0] as string,
          message: signData.value,
        })
      } else {
        signature = await walletClient.signMessage({
          message: signData.message,
        })
      }

      // Cache signature for retry (avoid re-signing on onSign failure)
      cachedSignaturesRef.current[step.id] = signature
    }

    // Submit via onSign
    const result = await step.sign.onSign(signature, buildContext())

    if (!mountedRef.current) {
      return false
    }

    resultsRef.current[step.id] = { type: 'sign', signature, data: result.data }
    setFlow((prev) => updateStep(prev, stepIndex, {
      status: 'completed',
      signature,
    }))

    step.onComplete?.({ ...buildContext(), signature })
    onStepCompleteRef.current?.(step.id, { type: 'sign', signature, data: result.data })

    return true
  }, [ buildContext, setFlow ])

  // --- Main execution loop ---
  const executeFlow = useCallback(async () => {
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

        // Check shouldSkip
        if (step.shouldSkip) {
          const shouldSkipResult = await step.shouldSkip(context)
          if (shouldSkipResult) {
            setFlow((prev) => skipStep(prev, index))
            continue
          }
        }

        // Fire onStart
        step.onStart?.(context)

        let stepCompleted: boolean
        try {
          if (step.type === 'sign') {
            stepCompleted = await executeSignStep(step, index)
          } else {
            stepCompleted = await executeTxStep(step, index)
          }
        } catch (err) {
          if (!mountedRef.current) {
            break
          }

          const code = classifyError(err)

          if (code === 'USER_REJECTED') {
            setFlow((prev) => rejectStep(prev, index, makeError(err, 'USER_REJECTED')))
          } else {
            const txError = makeError(err)
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

        // waitAfterMs
        if (step.waitAfterMs && step.waitAfterMs > 0) {
          setFlow((prev) => updateStep(prev, index, { status: 'waiting' }))
          setFlow((prev) => pauseFlow(prev))
          await new Promise<void>((resolve) => setTimeout(resolve, step.waitAfterMs))
          if (!mountedRef.current) {
            break
          }
          setFlow((prev) => resumeFlow(prev))
        }

        // waitForCondition
        if (step.waitForCondition) {
          setFlow((prev) => updateStep(prev, index, { status: 'waiting' }))
          setFlow((prev) => pauseFlow(prev))

          abortControllerRef.current = new AbortController()
          try {
            await step.waitForCondition(buildContext(), abortControllerRef.current.signal)
          } catch (err) {
            if (abortControllerRef.current.signal.aborted) {
              break // Expected - flow was canceled
            }
            // Real error in waitForCondition
            const txError = makeError(err, 'TIMEOUT')
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

        // Advance to next step
        setFlow((prev) => advanceStep(prev))
      }
    } finally {
      executingRef.current = false
    }

    // Check if all steps completed (use functional update to read fresh state)
    if (mountedRef.current) {
      setFlow((prev) => {
        if (prev.status === 'error' || prev.status === 'rejected' || prev.status === 'completed') {
          return prev
        }
        const allCompleted = prev.steps.every(
          (step) => step.status === 'completed' || step.status === 'skipped',
        )
        if (allCompleted) {
          // Side effects outside of state update
          setTimeout(() => {
            onFlowCompleteRef.current?.(resultsRef.current)
          }, 0)
          return { ...prev, status: 'completed' }
        }
        return prev
      })
    }
  }, [
    buildContext, executeTxStep, executeSignStep, flow.currentStepIndex,
    flow.status, flow.steps, makeError, setFlow,
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
