import type { PublicClient } from 'viem'
import { encodeFunctionData } from 'viem'

import type { RiskResult, TransactionError, TransactionReceipt } from '@txkit/core'
import { getErrorMessage, isMaxApproval } from '@txkit/core'

import type {
  FlowState,
  FlowStepTx,
  StepContext,
  StepResult,
  SafetyConfig,
  TxParams,
  WagmiMutations,
} from '../../../types/transaction'
import { failStep, updateStep } from './flowTransitions'
import { isContractCall, decodeCalldata } from './decodeCalldata'


export type ExecuteTxStepDeps = {
  address: `0x${string}`
  targetChainId: number
  confirmations: number
  publicClient: PublicClient | undefined
  flow: FlowState
  setFlow: (updater: (prev: FlowState) => FlowState) => void
  writeContractAsync: WagmiMutations['writeContractAsync']
  sendTransactionAsync: WagmiMutations['sendTransactionAsync']
  invalidateAffected: WagmiMutations['invalidateAffected']
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
    flow: _flow,
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

  let txParams: TxParams
  if (typeof step.tx === 'function') {
    txParams = await step.tx(context)
  } else {
    txParams = step.tx
  }

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
      step.onError?.({ ...buildContext(), error: txError })
      return false
    }

    if (gasResult.status === 'fulfilled') {
      setFlow((prev) => updateStep(prev, stepIndex, { gasEstimate: gasResult.value }))
    }

    let assessedRisk: RiskResult | undefined
    if (currentSafety.riskProvider && address) {
      try {
        assessedRisk = await currentSafety.riskProvider.assess({
          to,
          data,
          value,
          chainId: targetChainId,
          from: address,
        })

        if (!mountedRef.current) {
          return false
        }

        setFlow((prev) => updateStep(prev, stepIndex, { riskResult: assessedRisk }))

        if (assessedRisk.blocked) {
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
          step.onError?.({ ...buildContext(), error: txError })
          return false
        }
      }
      catch (_err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[txKit] Risk provider assessment failed:', _err)
        }
      }
    }

    const hasWarnings = Boolean(assessedRisk && assessedRisk.level !== 'low')
    const hasDelay = currentSafety.delayMs > 0
    // warnMaxApproval should fire only when the approve amount itself is
    // effectively unlimited (MAX_UINT256). Without this check every approve
    // call would pause on confirming-risk regardless of amount, looping
    // back to confirm after each user click since the amount never changes.
    const approveAmount = isContractCall(txParams) && txParams.functionName === 'approve'
      ? txParams.args?.[1]
      : undefined
    const hasMaxApproval = Boolean(
      currentSafety.warnMaxApproval
        && step.tx
        && typeof approveAmount === 'bigint'
        && isMaxApproval(approveAmount),
    )

    if (hasWarnings || hasDelay || hasMaxApproval) {
      setFlow((prev) => updateStep(prev, stepIndex, {
        status: 'confirming-risk',
        confirmCountdown: Math.ceil(currentSafety.delayMs / 1000),
        decodedCalldata: decodeCalldata(txParams),
      }))
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
    step.onError?.({ ...buildContext(), error: txError })
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
