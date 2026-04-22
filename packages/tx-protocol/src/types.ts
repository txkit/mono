/* ======================================================================
 * Spec version
 * ==================================================================== */

export const SPEC_VERSION = '0.1' as const
export type SpecVersion = typeof SPEC_VERSION
export const SPEC_SCHEMA_URL = 'https://txkit.dev/schemas/v0.1/envelope.json' as const

/* ======================================================================
 * Kind discriminator values
 *
 * Implemented in v0.1:
 *  - evm-tx     : single EVM transaction (calls.length === 1)
 *  - evm-batch  : EIP-5792 batch (calls.length > 1, atomicRequired capability)
 *  - signature  : EIP-712 typed data / personal-sign / SIWE
 *
 * Reserved (strict validator rejects; namespace taken so v0.3+ adds are non-breaking).
 * ==================================================================== */

export const IMPLEMENTED_KINDS = [ 'evm-tx', 'evm-batch', 'signature' ] as const

export const RESERVED_KINDS = [
  'evm-userop',
  'evm-frame',
  'evm-7702',
  'mandate',
  'intent',
  'psbt',
  'svm-tx',
  'move-tx',
  'cosmos-tx',
] as const

export type ImplementedKind = (typeof IMPLEMENTED_KINDS)[number]
export type ReservedKind = (typeof RESERVED_KINDS)[number]
export type Kind = ImplementedKind | ReservedKind

/* ======================================================================
 * Primitive hex types
 * ==================================================================== */

export type HexAddress = `0x${string}`
export type HexBytes = `0x${string}`
export type HexQuantity = `0x${string}`
export type Caip2Chain = `${string}:${string}`

/* ======================================================================
 * Envelope (kind-agnostic)
 * ==================================================================== */

export interface Producer {
  id: string
  name?: string
  signature?: ProducerSignature
}

export type SignatureScheme =
  | 'secp256k1'
  | 'ed25519'
  | 'p256'
  | 'ml-dsa-44'
  | 'ml-dsa-65'
  | 'ml-dsa-87'
  | 'slh-dsa-sha2-128s'
  | (string & {})

export interface ProducerSignature {
  scheme: SignatureScheme
  publicKey?: string
  signature: string
  coverage: 'envelope' | 'content'
}

export interface Origin {
  url: string
  verifyStatus: 'VERIFIED' | 'UNVERIFIED' | 'MISMATCH'
  attestation?: string
}

export interface RiskWarning {
  code: string
  severity: 'INFO' | 'WARN' | 'CRITICAL'
  message: string
}

export interface ScannerVerdict {
  provider: string
  verdict: string
  url?: string
}

export interface RiskAssessment {
  action: 'ALLOW' | 'WARN' | 'BLOCK'
  score?: number
  warnings: RiskWarning[]
  scanners?: ScannerVerdict[]
}

export interface Permissions {
  context: HexBytes
  type: string
  expiry?: number
}

export interface PaymasterService {
  url: string
  sponsor?: HexAddress
}

export type RequiredAccountType = 'eoa' | 'smart-account-7702' | 'erc-4337'

export interface Capabilities {
  atomicRequired?: boolean
  paymasterService?: PaymasterService
  permissions?: Permissions
  requiresAccountType?: RequiredAccountType
  [key: string]: unknown
}

export interface BaseEnvelope<K extends string, C> {
  $schema: string
  version: SpecVersion
  kind: K
  id?: string
  issuedAt: string
  expiresAt?: string
  nonce?: HexBytes
  producer?: Producer
  origin?: Origin
  content: C
  risk?: RiskAssessment
  capabilities?: Capabilities
  meta?: Record<string, unknown>
}

/* ======================================================================
 * Validity (shared)
 * ==================================================================== */

export type NonceKind = 'sequential' | 'durable' | 'bitmap'

export interface Validity {
  notBefore?: number
  notAfter: number
  nonceKind?: NonceKind
  blockhashRecency?: { maxAge: number }
}

/* ======================================================================
 * Description + ActionType
 * ==================================================================== */

export type ActionType =
  | 'transfer'
  | 'approve'
  | 'permit'
  | 'revoke-approval'
  | 'swap'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'restake'
  | 'mint'
  | 'burn'
  | 'deposit'
  | 'withdraw'
  | 'delegate'
  | 'bridge'
  | 'admin-op'
  | 'other'

export interface Description {
  short: string
  long?: string
  action: ActionType
}

/* ======================================================================
 * TokenMovement + Counterparty + Fee/Estimation
 * ==================================================================== */

export type TokenStandard = 'erc20' | 'erc721' | 'erc1155' | 'native'

export type TokenMovementKind =
  | 'transfer'
  | 'approve'
  | 'permit'
  | 'mint'
  | 'burn'
  | 'revoke'

export interface TokenMovement {
  token: HexAddress | 'native'
  standard: TokenStandard
  symbol: string
  decimals: number
  amount: string
  tokenId?: string
  kind: TokenMovementKind
  isUnlimited?: boolean
  from: HexAddress
  to: HexAddress
  usdValue?: number
}

export type CounterpartyRole =
  | 'recipient'
  | 'spender'
  | 'swap-venue'
  | 'pool'
  | 'bridge'
  | 'admin'
  | 'unknown'

export type CounterpartyLabelSource =
  | 'contact_book'
  | 'protocol_directory'
  | 'recent_interaction'
  | 'untrusted'

export interface Counterparty {
  address: HexAddress
  role: CounterpartyRole
  label?: string
  labelSource?: CounterpartyLabelSource
  similarityWarning?: {
    similarTo: HexAddress
    distance: number
  }
}

export interface FeeBreakdown {
  serviceFee?: string
  slippageCost?: string
  protocolFee?: string
  total: string
  denomination: 'native' | HexAddress
}

export interface Estimation {
  effectivePrice?: string
  minOutputAmount?: string
  maxInputAmount?: string
  expiration?: number
  quoteTimestamp?: number
}

export interface Metadata {
  protocol: string
  tokenMovements: TokenMovement[]
  counterparties: Counterparty[]
  feeBreakdown?: FeeBreakdown
  estimation?: Estimation
  estimatedGas?: string
}

/* ======================================================================
 * EVM call + content (kind: 'evm-tx' | 'evm-batch')
 * ==================================================================== */

export type CallOperation = 'call' | 'delegatecall'

export interface EvmCall {
  to: HexAddress
  value?: HexQuantity
  data?: HexBytes
  operation?: CallOperation
  capabilities?: Record<string, unknown>
}

export interface EvmTxContent {
  chain: Caip2Chain
  chainId?: number
  from?: HexAddress
  calls: EvmCall[]
  validity: Validity
  description: Description
  metadata: Metadata
  decoderRef?: string
  clearSigning?: Record<string, unknown>
}

export type EvmTxEnvelope = BaseEnvelope<'evm-tx', EvmTxContent>
export type EvmBatchEnvelope = BaseEnvelope<'evm-batch', EvmTxContent>

/* ======================================================================
 * Signature content (kind: 'signature')
 * ==================================================================== */

export interface Eip712Domain {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: HexAddress
  salt?: HexBytes
}

export interface Eip712Type {
  name: string
  type: string
}

export type SignatureScheme712 = 'eip-712' | 'personal-sign' | 'siwe'

export interface SignatureContent {
  chain: Caip2Chain
  chainId?: number
  from?: HexAddress
  scheme: SignatureScheme712
  domain?: Eip712Domain
  types?: Record<string, Eip712Type[]>
  primaryType?: string
  message?: Record<string, unknown>
  messageText?: string
  description: Description
  metadata?: Metadata
  validity?: Validity
  erc6492?: boolean
}

export type SignatureEnvelope = BaseEnvelope<'signature', SignatureContent>

/* ======================================================================
 * Top-level discriminated union (implemented kinds only)
 * ==================================================================== */

export type PreparedEnvelope = EvmTxEnvelope | EvmBatchEnvelope | SignatureEnvelope

export type PreparedEnvelopeByKind<K extends ImplementedKind> = Extract<PreparedEnvelope, { kind: K }>

/* ======================================================================
 * Validation result
 * ==================================================================== */

export interface ValidationIssue {
  path: string
  message: string
  severity?: 'ERROR' | 'WARN'
}

export type ValidationResult<T> =
  | { ok: true; value: T; warnings?: ValidationIssue[] }
  | { ok: false; error: string; issues: ValidationIssue[] }

/* ======================================================================
 * EIP-5792 status taxonomy (for post-submit tracking)
 * ==================================================================== */

export const CALLS_STATUS = {
  PENDING: 100,
  CONFIRMED: 200,
  OFFCHAIN_FAILURE: 400,
  REVERTED: 500,
  PARTIALLY_REVERTED: 600,
} as const

export type CallsStatus = (typeof CALLS_STATUS)[keyof typeof CALLS_STATUS]
