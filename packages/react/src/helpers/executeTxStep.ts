import type { PublicClient } from 'viem'
import { encodeFunctionData } from 'viem'

import type { TransactionError, TransactionReceipt } from '@txkit/core'
import { getErrorMessage } from '@txkit/core'

import type {
  FlowState,
  FlowStepTx,
  StepContext,
  StepResult,
  SafetyConfig,
  TxParams,
} from '../types/transaction'
import { failStep, updateStep } from './flowTransitions'
import { isContractCall, decodeCalldata } from './decodeCalldata'


export type ExecuteTxStepDeps = {
  address: `0x${string}`
  targetChainId: number
  confirmations: number
  publicClient: PublicClient | undefined
  flow: FlowState
  setFlow: (updater: (prev: FlowState) => FlowState) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wagmi generic signatures are not worth re-exporting
  writeContractAsync: (params: any) => Promise<`0x${string}`>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendTransactionAsync: (params: any) => Promise<`0x${string}`>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invalidateAffected: (logs: any[], address: `0x${string}`) => void
  makeError: (err: unknown, codeOverride?: TransactionError['code']) => TransactionError
  buildContext: () => StepContext
  mountedRef: { current: boolean }
  safetyRef: { current: SafetyConfig }
  resultsRef: { current: Record<string, StepResult> }
  onStepErrorRef: { current: ((error: TransactionError, stepId: string) => void) | undefined }
  onStepCompleteRef: { current: ((stepId: string, result: StepResult) => void) | undefined }
}

/** Execute a single tx step. Returns true if step completed, false if paused/failed/unmounted */
export const executeTxStep = async (
  step: FlowStepTx,
  stepIndex: number,
  deps: ExecuteTxStepDeps
): Promise<boolean> => {
  const {
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
  } = deps

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
      publicClient.call({ account: address, to, data, value }),
      publicClient.estimateGas({ account: address, to, data, value }),
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

  if (receipt.status === 'reverted') {
    invalidateAffected(receipt.logs, address)
    const txError = makeError(null, 'EXECUTION_REVERTED')
    setFlow((prev) => failStep(prev, stepIndex, txError))
    onStepErrorRef.current?.(txError, step.id)
    return false
  }

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

  invalidateAffected(receipt.logs, address)
  step.onComplete?.({ ...buildContext(), hash: txHash, receipt: txReceipt })
  onStepCompleteRef.current?.(step.id, { type: 'tx', hash: txHash, receipt: txReceipt })

  return true
}
