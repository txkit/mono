/** Categorized error codes for transaction failures */
export type TransactionErrorCode =
  | 'USER_REJECTED'
  | 'INSUFFICIENT_FUNDS'
  | 'SIMULATION_FAILED'
  | 'EXECUTION_REVERTED'
  | 'GAS_ESTIMATION_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CHAIN_MISMATCH'
  | 'APPROVAL_FAILED'
  | 'RISK_BLOCKED'
  | 'UNKNOWN'

/** Structured error from a failed transaction */
export type TransactionError = {
  /** Classified error code */
  code: TransactionErrorCode
  /** Human-readable error message */
  message: string
  /** Original error from wagmi/viem */
  cause?: Error
}

/** Minimal transaction receipt data */
export type TransactionReceipt = {
  /** Block number where tx was included */
  blockNumber: bigint
  /** Transaction hash */
  transactionHash: `0x${string}`
  /** Execution status */
  status: 'success' | 'reverted'
  /** Gas consumed */
  gasUsed?: bigint
  /** Effective gas price paid */
  effectiveGasPrice?: bigint
}

/** Decoded contract function call with name and arguments */
export type DecodedCalldata = {
  /** Contract function name */
  functionName: string
  /** Decoded function arguments */
  args: DecodedArg[]
}

/** Single decoded argument with name, type and value */
export type DecodedArg = {
  /** Parameter name from ABI */
  name: string
  /** Solidity type (address, uint256, etc.) */
  type: string
  /** Decoded value */
  value: unknown
}

/** Risk assessment result from external provider */
export type RiskResult = {
  /** Overall risk level */
  level: 'low' | 'medium' | 'high' | 'critical'
  /** Human-readable warnings */
  warnings: string[]
  /** If true, transaction should be blocked */
  blocked?: boolean
}

/** Per-step status in a multi-step transaction flow */
export type StepStatus =
  | 'pending'
  | 'skipped'
  | 'simulating'
  | 'confirming-risk'
  | 'simulation-failed'
  | 'signing'
  | 'tx-pending'
  | 'waiting'
  | 'completed'
  | 'error'
  | 'rejected'
  | 'canceled'

/** Overall flow status for a multi-step transaction */
export type FlowStatus =
  | 'idle'
  | 'simulating-all'
  | 'running'
  | 'paused'
  | 'completed'
  | 'error'
  | 'rejected'
  | 'canceled'

