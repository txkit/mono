import type { ReactNode } from 'react'
import type { Abi, PublicClient, TypedDataDomain } from 'viem'

import type {
  FlowStatus,
  StepStatus,
  RiskResult,
  DecodedCalldata,
  TransactionError,
  TransactionReceipt,
} from '@txkit/core'

import type { TransactionButtonLabels } from '../components/TransactionButton/labels'


// --- Transaction Params ---

/** Raw transaction params (ETH transfer or pre-encoded calldata) */
export type RawTransactionProps = {
  to: `0x${string}`
  value?: bigint
  data?: `0x${string}`
}

/** Contract call params (ABI-typed) */
export type ContractTransactionProps = {
  address: `0x${string}`
  abi: Abi
  functionName: string
  args?: unknown[]
  value?: bigint
}

/** Transaction params - either raw or contract call */
export type TxParams = RawTransactionProps | ContractTransactionProps


// --- Safety ---

/** Pluggable risk assessment provider (Blowfish, Blockaid, custom) */
export type TransactionRiskProvider = {
  assess: (params: {
    to: `0x${string}`
    data?: `0x${string}`
    value?: bigint
    chainId: number
    from: `0x${string}`
  }) => Promise<RiskResult>
}

/** Anti-phishing safety configuration */
export type SafetyConfig = {
  /** Simulate transaction before signing. @default true */
  simulate: boolean
  /** Confirmation countdown in ms (0 = no delay). @default 0 */
  delayMs: number
  /** Warn when approval amount is MAX_UINT256. @default true */
  warnMaxApproval: boolean
  /** Pluggable risk scoring provider. @default null */
  riskProvider: TransactionRiskProvider | null
}


// --- Step Context ---

/** Context passed to step callbacks and factories */
export type StepContext = {
  /** Results of completed prior steps, keyed by step.id */
  results: Record<string, StepResult>
  /** Shortcut: result of immediately preceding step */
  previousResult: StepResult | undefined
  /** Connected wallet address */
  address: `0x${string}`
  /** Current chain ID */
  chainId: number
  /** Viem public client for read operations (readContract, call, estimateGas) */
  publicClient: PublicClient
}

/** Result of a completed step */
export type StepResult =
  | { type: 'tx'; hash: `0x${string}`; receipt: TransactionReceipt }
  | { type: 'sign'; signature: `0x${string}`; data?: unknown }


// --- Step Definitions ---

/** Transaction params or async factory receiving prior step results */
export type StepTx = TxParams | ((context: StepContext) => TxParams | Promise<TxParams>)

/** EIP-712 or personal_sign data for off-chain signature steps */
export type SignData =
  | {
    method: 'eth_signTypedData_v4'
    domain: TypedDataDomain
    types: Record<string, Array<{ name: string; type: string }>>
    value: Record<string, unknown>
  }
  | {
    method: 'personal_sign'
    message: string
  }

/** Result returned by onSign handler */
export type SignResult = {
  /** Arbitrary data passed to subsequent steps via context.results[stepId].data */
  data?: unknown
}

/** Sign request for off-chain signature steps */
export type StepSignRequest = {
  /** EIP-712 typed data or personal_sign message, or async factory */
  signData: SignData | ((context: StepContext) => SignData | Promise<SignData>)
  /** Called with signature after wallet signs. Handles API submission */
  onSign: (signature: `0x${string}`, context: StepContext) => Promise<SignResult>
}

/** Base fields shared by tx and sign steps */
export type FlowStepBase = {
  /** Unique step identifier */
  id: string
  /** Human-readable label for UI */
  label: string
  /** Optional sub-label shown below the main label (e.g. "Approve USDC spending") */
  description?: string
  /** Skip at runtime (e.g. allowance already sufficient). Re-evaluated on retry */
  shouldSkip?: (context: StepContext) => boolean | Promise<boolean>
  /** Delay in ms after completion before starting next step */
  waitAfterMs?: number
  /** Async condition to proceed after step completion. Receives AbortSignal for cancelation */
  waitForCondition?: (context: StepContext, signal: AbortSignal) => Promise<void>
  /** Step is optional - can be skipped by user on error via skipStep() */
  optional?: boolean
  /** Called when step starts executing */
  onStart?: (context: StepContext) => void
  /** Called when step fails */
  onError?: (context: StepContext & { error: TransactionError }) => void
  /** Called when step is canceled (e.g. cancel COW order on backend) */
  onCancel?: (context: StepContext) => Promise<void> | void
}

/** On-chain transaction step */
export type FlowStepTx = FlowStepBase & {
  /** Step type discriminant */
  type: 'tx'
  /** Transaction params or async factory */
  tx: StepTx
  /** Per-step safety overrides (defaults to flow-level safety) */
  safety?: Partial<SafetyConfig>
  /** Per-step gas limit override */
  gas?: bigint
  /** Called when step completes with on-chain receipt */
  onComplete?: (context: StepContext & { hash: `0x${string}`; receipt: TransactionReceipt }) => void
}

/** Off-chain signature step (COW Protocol, Permit2, gasless approvals) */
export type FlowStepSign = FlowStepBase & {
  /** Step type discriminant */
  type: 'sign'
  /** Sign configuration */
  sign: StepSignRequest
  /** Called when signature is submitted successfully */
  onComplete?: (context: StepContext & { signature: `0x${string}` }) => void
}

/** A step in a multi-step transaction flow */
export type FlowStep = FlowStepTx | FlowStepSign


// --- Runtime State ---

/** Runtime state of a single step */
export type StepState = {
  /** Step id from definition */
  id: string
  /** Current step status */
  status: StepStatus
  /** Transaction hash (tx steps only) */
  hash?: `0x${string}`
  /** On-chain receipt (tx steps only) */
  receipt?: TransactionReceipt
  /** Off-chain signature (sign steps only) */
  signature?: `0x${string}`
  /** Error details if step failed */
  error?: TransactionError
  /** Estimated gas for this step */
  gasEstimate?: bigint
  /** Risk assessment result */
  riskResult?: RiskResult
  /** Decoded calldata for preview */
  decodedCalldata?: DecodedCalldata
  /** Confirmation countdown in seconds (0 = ready to confirm) */
  confirmCountdown: number
}

/** Overall state of a multi-step flow */
export type FlowState = {
  /** Overall flow status */
  status: FlowStatus
  /** Index of the currently executing step */
  currentStepIndex: number
  /** Total number of steps */
  totalSteps: number
  /** Runtime state for each step */
  steps: StepState[]
}


// --- Flow Actions ---

/** Actions available to control a flow */
export type FlowActions = {
  /** Start the flow (begin from first step) */
  start: () => void
  /** Confirm risk warning on current step */
  confirm: () => void
  /** Cancel current step or entire flow */
  cancel: () => void
  /** Retry current failed step */
  retry: () => void
  /** Retry from a specific step (re-evaluates shouldSkip) */
  retryFrom: (stepId: string) => void
  /** Force-submit current step (skip simulation) */
  forceSubmit: () => void
  /** Reset entire flow to idle */
  reset: () => void
  /** Skip current step (only if step.optional === true) */
  skipStep: () => void
}


// --- Hook Options & Return ---

/** Options for useTransactionFlow hook */
export type UseTransactionFlowOptions = {
  /** Step definitions for this flow */
  steps: FlowStep[]
  /** Flow ID for parallel flows. @default '__default__' */
  flowId?: string
  /** Default safety config (overridable per-step) */
  safety?: Partial<SafetyConfig>
  /** Target chain ID (auto-switch if mismatch) */
  chainId?: number
  /** Block confirmations per step. @default 1 */
  confirmations?: number
  /** Auto-reset to idle after completion (ms). 0 = no reset. @default 0 */
  resetDelay?: number
  /** Called on flow status change */
  onFlowStatusChange?: (status: FlowStatus) => void
  /** Called when entire flow completes */
  onFlowComplete?: (results: Record<string, StepResult>) => void
  /** Called on any step error */
  onStepError?: (error: TransactionError, stepId: string) => void
  /** Called on any step completion */
  onStepComplete?: (stepId: string, result: StepResult) => void
}

/** Return value of useTransactionFlow hook */
export type UseTransactionFlowReturn = {
  /** Current flow state */
  flow: FlowState
  /** Step definitions */
  steps: FlowStep[]
} & FlowActions


// --- TransactionButton Props ---

/** Props for TransactionButton component */
export type TransactionButtonProps = {
  /** CSS class name */
  className?: string
  /** Custom render function (tier 2 customization) */
  children?: (data: TransactionButtonRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Step definitions for this transaction flow */
  steps: FlowStep[]
  /** Flow ID for parallel flows. @default '__default__' */
  flowId?: string
  /** Default safety config */
  safety?: Partial<SafetyConfig>
  /** Target chain ID */
  chainId?: number
  /** Button label text. @default "Send" */
  label?: string
  /** UI label overrides */
  labels?: Partial<TransactionButtonLabels>
  /** Block confirmations per step. @default 1 */
  confirmations?: number
  /** Auto-reset to idle after completion (ms). 0 = no reset. @default 0 */
  resetDelay?: number
  /** Disable the button */
  disabled?: boolean
  /** Show block explorer link after submission. @default true */
  showExplorerLink?: boolean
  /** Called when entire flow completes */
  onFlowComplete?: (results: Record<string, StepResult>) => void
  /** Called on any step completion */
  onStepComplete?: (stepId: string, result: StepResult) => void
  /** Called on any step error */
  onError?: (error: TransactionError, stepId: string) => void
  /** Called on every flow status change */
  onFlowStatusChange?: (status: FlowStatus) => void
}

/** Data passed to TransactionButton children render function */
export type TransactionButtonRenderData = {
  /** Current flow state */
  flow: FlowState
  /** Current step state (convenience shortcut) */
  currentStep: StepState | undefined
  /** Step definitions */
  steps: FlowStep[]
  /** Block explorer URL for current step hash */
  explorerUrl: string | undefined
} & FlowActions


// --- Compound Component Props ---

/** Props for FlowSteps component */
export type FlowStepsProps = {
  /** CSS class name */
  className?: string
  /** Custom render function */
  children?: (data: FlowStepsRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Flow ID to display. @default '__default__' */
  flowId?: string
  /** Orientation of step indicators. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
  /** Show completed steps. @default true */
  showCompleted?: boolean
}

/** Data passed to FlowSteps children render function */
export type FlowStepsRenderData = {
  /** Step states with labels */
  steps: Array<{
    id: string
    label: string
    description?: string
    status: StepStatus
    isCurrent: boolean
  }>
  /** Index of current step */
  currentStepIndex: number
  /** Total number of steps */
  totalSteps: number
  /** Number of completed steps */
  completedCount: number
}

/** Props for FlowProgress component */
export type FlowProgressProps = {
  /** CSS class name */
  className?: string
  /** Custom render function */
  children?: (data: FlowProgressRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Flow ID to display. @default '__default__' */
  flowId?: string
  /** Show a summary row "Overall Progress - X%" above the bar. @default false */
  showSummary?: boolean
  /** Custom label for the summary row. @default 'Overall Progress' */
  summaryLabel?: string
}

/** Data passed to FlowProgress children render function */
export type FlowProgressRenderData = {
  /** Progress value from 0 to 1 */
  progress: number
  /** Current flow status */
  status: FlowStatus
  /** Label of current step */
  currentStepLabel: string | undefined
}

/** Props for FlowToast component */
export type FlowToastProps = {
  /** CSS class name */
  className?: string
  /** Custom render function */
  children?: (data: FlowToastRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Flow ID to display. @default '__default__' */
  flowId?: string
  /** Auto-dismiss in ms. 0 = manual. @default 5000 */
  autoDismiss?: number
  /** Toast position. @default 'bottom-right' */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

/** Data passed to FlowToast children render function */
export type FlowToastRenderData = {
  /** Whether toast is visible */
  visible: boolean
  /** Toast message (rendered as the title) */
  message: string
  /** Optional secondary line rendered below the message */
  description?: string
  /** Toast type */
  type: 'success' | 'error' | 'info' | 'warning'
  /** Step that triggered the toast */
  stepId: string | undefined
  /** Dismiss the toast */
  dismiss: () => void
}
