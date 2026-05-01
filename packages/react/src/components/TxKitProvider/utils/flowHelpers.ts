import { erc20Abi } from 'viem'

import type {
  FlowStep,
  FlowStepTx,
  FlowStepSign,
  StepTx,
  StepContext,
  SafetyConfig,
  SignData,
  StepSignRequest,
} from '../../../types/transaction'


const checkAllowance = async (
  context: StepContext,
  token: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> => {
  const result = await context.publicClient.readContract({
    abi: erc20Abi,
    address: token,
    functionName: 'allowance',
    args: [ context.address, spender ],
  })
  return typeof result === 'bigint' ? result : 0n
}


/** Create a single on-chain transaction step */
export const txStep = (
  id: string,
  label: string,
  tx: StepTx,
  options?: Partial<Omit<FlowStepTx, 'id' | 'label' | 'tx' | 'type'>>
): FlowStepTx => ({
  id,
  type: 'tx',
  label,
  tx,
  ...options,
})


export type ApproveAndExecuteParams = {
  /** ERC-20 token address to approve */
  token: `0x${string}`
  /** Contract address receiving the approval (spender) */
  spender: `0x${string}`
  /** Exact amount to approve */
  amount: bigint
  /** Transaction to execute after approval */
  tx: StepTx
  /** Label for execute step. @default 'Execute' */
  label?: string
  /** Safety config for execute step */
  safety?: Partial<SafetyConfig>
  /** Gas override for execute step */
  gas?: bigint
}

/**
 * Create approve + execute flow steps.
 * Automatically skips approve if allowance is already sufficient.
 * USDT-style approve-to-zero handling is deferred to v0.2 - consumers needing it
 * can prepend their own reset step to the returned array.
 */
export const approveAndExecute = (params: ApproveAndExecuteParams): FlowStep[] => [
  {
    id: 'approve',
    type: 'tx',
    label: 'Approve',
    tx: {
      address: params.token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ params.spender, params.amount ],
    },
    shouldSkip: async (context: StepContext) => {
      const allowance = await checkAllowance(context, params.token, params.spender)
      return allowance >= params.amount
    },
  },
  {
    id: 'execute',
    type: 'tx',
    label: params.label || 'Execute',
    tx: params.tx,
    safety: params.safety,
    gas: params.gas,
  },
]


export type MultiApproveAndExecuteParams = {
  /** Approvals to perform before execution */
  approvals: Array<{
    /** ERC-20 token address */
    token: `0x${string}`
    /** Spender address */
    spender: `0x${string}`
    /** Amount to approve */
    amount: bigint
    /** Label for this approval step. @default 'Approve {index}' */
    label?: string
  }>
  /** Transaction to execute after all approvals */
  tx: StepTx
  /** Label for execute step. @default 'Execute' */
  label?: string
  /** Safety config for execute step */
  safety?: Partial<SafetyConfig>
}

/** Create multi-approve + execute flow. Each approval auto-skips if allowance sufficient */
export const multiApproveAndExecute = (params: MultiApproveAndExecuteParams): FlowStep[] => [
  ...params.approvals.map((approval, index): FlowStepTx => ({
    id: `approve-${index}`,
    type: 'tx',
    label: approval.label || `Approve ${index + 1}`,
    tx: {
      address: approval.token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ approval.spender, approval.amount ],
    },
    shouldSkip: async (context: StepContext) => {
      const allowance = await checkAllowance(context, approval.token, approval.spender)
      return allowance >= approval.amount
    },
  })),
  {
    id: 'execute',
    type: 'tx',
    label: params.label || 'Execute',
    tx: params.tx,
    safety: params.safety,
  },
]


export type SignAndSubmitParams = {
  /** Unique step ID */
  id: string
  /** Human-readable label */
  label: string
  /** EIP-712 typed data or personal_sign, or async factory */
  signData: SignData | ((context: StepContext) => SignData | Promise<SignData>)
  /** Called with signature. Handles API submission */
  onSign: StepSignRequest['onSign']
  /** Optional: wait for condition after signing (e.g. poll for order fill) */
  waitForCondition?: FlowStepSign['waitForCondition']
  /** Optional: cancel handler (e.g. cancel order on backend) */
  onCancel?: FlowStepSign['onCancel']
}

/** Create an off-chain signature step (COW Protocol, Permit2, gasless approvals) */
export const signAndSubmit = (params: SignAndSubmitParams): FlowStepSign => ({
  id: params.id,
  type: 'sign',
  label: params.label,
  sign: {
    signData: params.signData,
    onSign: params.onSign,
  },
  waitForCondition: params.waitForCondition,
  onCancel: params.onCancel,
})
