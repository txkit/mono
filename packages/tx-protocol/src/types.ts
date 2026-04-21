import type { SpecVersion } from './version'

export type HexAddress = `0x${string}`
export type HexBytes = `0x${string}`

export type ActionType =
  | 'stake'
  | 'unstake'
  | 'swap'
  | 'approve'
  | 'mint'
  | 'burn'
  | 'claim'
  | 'deposit'
  | 'withdraw'
  | 'delegate'
  | 'transfer'
  | 'other'

export type TokenDirection = 'in' | 'out'

export interface TokenMovement {
  token: HexAddress | 'native'
  symbol: string
  decimals: number
  amount: bigint
  direction: TokenDirection
  usdValue?: number
}

export interface TransactionDescription {
  short: string
  long?: string
  action: ActionType
}

export interface SimulationHint {
  expectedSuccess: boolean
  estimatedGas?: bigint
  simulatedAt?: number
  simulator?: string
  notes?: string
}

export interface PreparedTransactionMetadata {
  protocol: string
  primaryToken?: TokenMovement
  tokenMovements: TokenMovement[]
  counterparties: HexAddress[]
  estimatedGas?: bigint
  simulation?: SimulationHint
}

export interface PreparedTransactionSequence {
  stepIndex: number
  totalSteps: number
  previousTxHashes?: HexBytes[]
}

export interface PreparedTransaction {
  version: SpecVersion
  chainId: number
  to: HexAddress
  data: HexBytes
  value: bigint
  description: TransactionDescription
  metadata: PreparedTransactionMetadata
  sequence?: PreparedTransactionSequence
  decoderRef?: string
  extensions?: Record<string, unknown>
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; issues?: ReadonlyArray<{ path: string; message: string }> }
