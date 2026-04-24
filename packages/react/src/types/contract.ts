import type { ReactNode } from 'react'
import type { Abi, AbiFunction } from 'viem'

import type { TransactionError, TransactionReceipt } from '@txkit/core'

import type { ContractTransactionProps, FlowStep, SafetyConfig } from './transaction'

import type { ContractFormLabels } from '../components/ContractForm/labels'


// --- Field Descriptor ---

/** Mapped UI field type from Solidity ABI type */
export type SolidityFieldType =
  | 'address'
  | 'uint'
  | 'int'
  | 'bool'
  | 'string'
  | 'bytes'
  | 'bytesN'
  | 'array'
  | 'tuple'
  | 'tupleArray'
  | 'unsupported'

/** Description of a single form field derived from ABI parameter */
export type FieldDescriptor = {
  /** Field name from ABI param.name, or `arg${index}` if unnamed */
  name: string
  /** Raw Solidity type: 'uint256', 'address', 'bytes32', 'tuple' */
  solidityType: string
  /** Mapped UI field type */
  fieldType: SolidityFieldType
  /** Bit size for uint/int types (8-256, default 256) */
  bitSize?: number
  /** Byte length for bytesN types (1-32) */
  byteLength?: number
  /** True for synthetic ETH value field on payable functions */
  isPayableValue?: boolean
  /** ABI hint: 'struct SwapParams', 'contract IERC20' */
  internalType?: string
  /** Element Solidity type for array fields: 'uint256', 'address' */
  arrayElementType?: string
  /** Fixed length for T[N] arrays */
  arrayFixedLength?: number
  /** Nested fields for tuple types (recursive) */
  components?: FieldDescriptor[]
}


// --- Security ---

/** Security warning level */
export type SecurityWarningLevel = 'warning' | 'danger'

/** Security warning for a contract function call */
export type SecurityWarning = {
  /** Warning severity */
  level: SecurityWarningLevel
  /** Human-readable warning message */
  message: string
}


// --- Render Data ---

/** Data passed to ContractForm children render function (Tier 2) */
export type ContractFormRenderData = {
  /** Field descriptors from ABI */
  fields: FieldDescriptor[]
  /** Current raw string values keyed by field name */
  values: Record<string, string>
  /** Validation errors keyed by field name (null = valid) */
  errors: Record<string, string | null>
  /** Which fields have been interacted with */
  touched: Record<string, boolean>
  /** Security warnings for current function + values */
  warnings: SecurityWarning[]
  /** Decoded calldata preview string (undefined if form invalid) */
  calldataPreview: string | undefined
  /** All touched fields pass validation */
  isValid: boolean
  /** Function accepts ETH value */
  isPayable: boolean
  /** Form-level error: overloaded function, encoding failure, function not found */
  formError: string | undefined
  /** Update a field value (triggers format validation if touched) */
  setFieldValue: (name: string, value: string) => void
  /** Mark field as touched (triggers full validation) */
  setFieldTouched: (name: string) => void
}


// --- Component Props ---

/** Props for ContractForm component */
export type ContractFormProps = {
  /** CSS class name */
  className?: string
  /** Custom render function (Tier 2 customization) */
  children?: (data: ContractFormRenderData) => ReactNode
  /** Test ID for automated testing */
  'data-testid'?: string
  /** Target contract address */
  address: `0x${string}`
  /** Contract ABI (JSON parsed) */
  abi: Abi
  /** Function name to generate form for */
  functionName: string
  /** Target chain ID for TransactionButton */
  chainId?: number
  /** Submit button label. @default functionName */
  label?: string
  /** UI label overrides */
  labels?: Partial<ContractFormLabels>
  /** Safety config for TransactionButton */
  safety?: Partial<SafetyConfig>
  /** Disable the form */
  disabled?: boolean
  /** Called when transaction completes successfully */
  onSuccess?: (receipt: TransactionReceipt) => void
  /** Called on any error */
  onError?: (error: TransactionError) => void
}


// --- Hook Types ---

/** Options for useContractForm hook */
export type UseContractFormOptions = Omit<ContractFormProps, 'className' | 'children' | 'data-testid' | 'label' | 'labels'> & {
  /** Resolver functions for computed params (re-evaluated before submit). Phase 3: widget integration */
  computedParams?: Record<string, () => unknown>
  /** Static constants not shown in form. Phase 3: widget integration */
  defaultParams?: Record<string, unknown>
  /** Param names managed by widget, hidden from form UI. Phase 3: widget integration */
  hiddenParams?: string[]
  /** Current wallet token balance (wei). Enables multi-tier approval risk: > 10× = warning, > 100× = danger. Defaults to 0n (MAX-only check). */
  balance?: bigint
}

/** Return value of useContractForm hook */
export type UseContractFormReturn = ContractFormRenderData & {
  /** Resolved ABI function (undefined if not found or overloaded) */
  abiFunction: AbiFunction | undefined
  /** Ready FlowStep[] for TransactionButton */
  steps: FlowStep[]
  /** Ready ContractTransactionProps (undefined if form invalid) */
  txParams: ContractTransactionProps | undefined
}
