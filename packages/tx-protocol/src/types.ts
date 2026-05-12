/* ======================================================================
 * Spec schema URL (version contract)
 *
 * The $schema URL is the version contract per the ERC. Envelopes do not
 * carry a separate `version` field - the URL path identifies the spec
 * version that an envelope conforms to.
 * ==================================================================== */

export const SPEC_SCHEMA_URL = 'https://txkit.dev/schemas/v0.1/envelope.json' as const

/* ======================================================================
 * Kind discriminator values
 *
 * Implemented in v0.1:
 *  - evm-tx     : single EVM transaction (calls.length === 1)
 *  - evm-batch  : EIP-5792 batch (calls.length > 1, atomicRequired capability)
 *  - signature  : EIP-712 typed data / personal-sign / SIWE
 *
 * Reserved (strict validator rejects; namespace taken so v0.2+ adds are non-breaking).
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

export type Producer = {
  id: string
  name?: string
  signature?: ProducerSignature
}

// Scheme is an open string per the ERC (§3.2). Implementations SHOULD
// support secp256k1, ed25519, and p256; other schemes (including future
// post-quantum algorithms) MAY be added without revising this type.
export type SignatureScheme =
  | 'secp256k1'
  | 'ed25519'
  | 'p256'
  | (string & {})

export type ProducerSignature = {
  scheme: SignatureScheme
  publicKey?: string
  signature: string
  coverage: 'envelope' | 'content'
}

export type Origin = {
  url: string
  verifyStatus: 'VERIFIED' | 'UNVERIFIED' | 'MISMATCH'
  attestation?: string
}

export type RiskWarning = {
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export type ScannerVerdict = {
  provider: string
  verdict: 'ALLOW' | 'WARN' | 'BLOCK'
  url?: string
}

export type RiskAssessment = {
  action: 'ALLOW' | 'WARN' | 'BLOCK'
  score?: number
  warnings: RiskWarning[]
  scanners?: ScannerVerdict[]
}

export type Permissions = {
  context: HexBytes
  type: string
  expiry?: number
}

export type PaymasterService = {
  url: string
  sponsor?: HexAddress
}

export type RequiredAccountType = 'eoa' | 'delegated-eoa' | 'erc-4337'

export type Capabilities = {
  atomicRequired?: boolean
  paymasterService?: PaymasterService
  permissions?: Permissions
  requiresAccountType?: RequiredAccountType
  [key: string]: unknown
}

export type BaseEnvelope<K extends string, C> = {
  $schema: string
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

export type Validity = {
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

export type Description = {
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

export type TokenMovement = {
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

export type Counterparty = {
  address: HexAddress
  role: CounterpartyRole
  label?: string
  labelSource?: CounterpartyLabelSource
  similarityWarning?: {
    similarTo: HexAddress
    distance: number
  }
}

export type FeeBreakdown = {
  serviceFee?: string
  slippageCost?: string
  protocolFee?: string
  total: string
  denomination: 'native' | HexAddress
}

export type Estimation = {
  effectivePrice?: string
  minOutputAmount?: string
  maxInputAmount?: string
  expiration?: number
  quoteTimestamp?: number
}

export type Metadata = {
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

export type EvmCall = {
  to: HexAddress
  value?: HexQuantity
  data?: HexBytes
  operation?: CallOperation
  capabilities?: Record<string, unknown>
}

export type EvmTxContent = {
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

export type Eip712Domain = {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: HexAddress
  salt?: HexBytes
}

export type Eip712Type = {
  name: string
  type: string
}

export type SignatureScheme712 = 'eip-712' | 'personal-sign' | 'siwe'

export type SignatureContent = {
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

export type ValidationIssue = {
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
