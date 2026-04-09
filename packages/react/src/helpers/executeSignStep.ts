import type { TransactionError } from '@txkit/core'

import type {
  FlowState,
  FlowStepSign,
  StepContext,
  StepResult,
} from '../types/transaction'
import { updateStep } from './flowTransitions'


export type ExecuteSignStepDeps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wagmi walletClient has complex generics
  walletClient: any
  setFlow: (updater: (prev: FlowState) => FlowState) => void
  buildContext: () => StepContext
  mountedRef: { current: boolean }
  cachedSignaturesRef: { current: Record<string, `0x${string}`> }
  resultsRef: { current: Record<string, StepResult> }
  onStepCompleteRef: { current: ((stepId: string, result: StepResult) => void) | undefined }
}

/** Execute a sign step. Returns true if step completed, false if unmounted */
export const executeSignStep = async (
  step: FlowStepSign,
  stepIndex: number,
  deps: ExecuteSignStepDeps
): Promise<boolean> => {
  const {
    walletClient,
    setFlow,
    buildContext,
    mountedRef,
    cachedSignaturesRef,
    resultsRef,
    onStepCompleteRef,
  } = deps

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
}
