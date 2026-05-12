# txKit tx-protocol - Prepared Envelope Spec v0.1

| | |
|---|---|
| **Status** | Draft (v0.1) |
| **Version** | 0.1 |
| **Canonical location** | `packages/tx-protocol/spec/v0.1/prepared-transaction.md` |
| **Reference implementation** | [`@txkit/tx-protocol@0.1.x`](../..) on npm |
| **Last updated** | 2026-04-21 |

Open protocol for Web3 operations prepared by AI / MCP tools and consumed by wallet / signer orchestrators. Defines an envelope + content shape that covers single EVM transactions, EIP-5792 batches, and EIP-712 signature requests, with reserved kinds for UserOp, EIP-8141 frames, intents, mandates, PSBT, Solana, Move, and Cosmos.

## 0. Design principles

The shape addresses three industry-standard requirements observed across EIP-5792, ERC-7730, ERC-4337, ERC-7579/7821, EIP-8141, CAIP-2, and incident post-mortems from 2024-2026 (Bybit $1.4B, Kelp $293M, Drift $285M, 450K+ EIP-7702 drainers):

1. **Integrity path.** Off-chain fields (description, metadata) MUST be tamper-detectable end-to-end. Solved via `producer.signature` (post-quantum ready scheme enum) + wallet-side decoder re-verification.
2. **Composability.** `calls[]` is the canonical execution shape (EIP-5792 / 7579 / 7821 / 8141 all N-call). Single tx is the degenerate case (`kind: 'evm-tx'` with `calls.length === 1`).
3. **Cross-ecosystem.** CAIP-2 chain identifiers (`eip155:1`, `solana:...`, `bip122:...`) primary; legacy `chainId: number` retained as a deprecated alias.

Reserved-kind namespace (declared but not validated in v0.1) lets `evm-userop`, `evm-frame`, `evm-7702`, `signature`, `mandate`, `intent`, `psbt`, `svm-tx`, `move-tx`, `cosmos-tx` be added in later versions without breaking consumers.

## 1. Scope and guarantees

> **This is a presentational protocol for agent-to-wallet handoff.**
>
> Off-chain fields (`description`, `metadata`, `origin`, `risk`, `decoderRef`, `clearSigning`, `meta`) are **presentational** and carry **no cryptographic integrity guarantee on their own**. The authoritative representation of on-chain effect remains the tuple `{chain, calls[*].to, calls[*].data, calls[*].value}` (for EVM txs) or `{scheme, domain, message}` (for signatures).
>
> Consumers **MUST** treat `description` and `metadata` as UX hints. Policy engines, allowlists, and spend limits **MUST** validate on raw fields (decoded selector + args), **NOT** on `description.short`.

### 1.1 Two integrity layers

1. **Producer signature** (`producer.signature` with `coverage: 'envelope' | 'content'`). An agent can sign the envelope with `secp256k1` / `ed25519` / `p256` (post-quantum schemes `ml-dsa-*` / `slh-dsa-*` are reserved). Signature covers the canonical JSON bytes of the envelope (or just `content`). Tampering in transit is detected. Producer identity SHOULD be a DID, CAIP-10 account, ERC-8004 agent reference, or URL.
2. **Wallet-side decoder re-verification** (defense in depth). Consumers SHOULD run a local decoder (`@txkit/tx-decoder`) on each `calls[*].data`, synthesize the expected `tokenMovements` and `counterparties`, and assert equivalence with the producer's claims. Mismatch MUST produce a hard UI warning or block, even if `producer.signature` is valid (a producer may be compromised or malicious).

Neither layer is mandatory in v0.1. Both are recommended. Wallets MAY treat missing signatures as "unsigned producer" warnings (not blocks).

## 2. Envelope

```typescript
interface BaseEnvelope<K extends string, C> {
  $schema: string                 // "https://txkit.dev/schemas/v0.1/envelope.json" - version contract
  kind: K                         // discriminator; see §3
  id?: string                     // idempotency, 4096 chars max (EIP-5792 convention)
  issuedAt: string                // RFC3339 UTC
  expiresAt?: string              // RFC3339 UTC; SHOULD equal content.validity.notAfter
  nonce?: `0x${string}`           // envelope-level replay protection, hex
  producer?: Producer             // agent provenance, see §4
  origin?: Origin                 // dApp URL + verify status, see §5
  content: C                      // kind-specific payload, see §6
  risk?: RiskAssessment           // unbound; wallet/scanner injects after producer, see §7
  capabilities?: Capabilities     // EIP-5792 aligned open record, see §8
  meta?: Record<string, unknown>  // MCP _meta-aligned; for UI not LLM context
}
```

The `$schema` URL is the version contract per ERC `Prepared Transaction Envelope`. Envelopes do not carry a separate `version` field; the URL path identifies the spec version.

### 2.1 Required vs recommended

| Field | Required | Notes |
|---|---|---|
| `$schema`, `kind`, `issuedAt`, `content` | yes | |
| `content` kind-specific required sub-fields | yes | see per-kind §6 |
| `id` | no | wallets MAY assign if producer omits; required for `wallet_getCallsStatus` |
| `expiresAt` | no | if present, MUST equal `content.validity.notAfter` for tx kinds |
| `nonce` | no | for envelope-level replay protection across retries |
| `producer` | strongly recommended | without it, wallet shows "unsigned producer" warning |
| `origin` | strongly recommended | without it, wallet shows "origin unverified" warning |
| `capabilities`, `meta`, `risk` | no | open-ended extension points |

## 3. Kind discriminator

### 3.1 Implemented in v0.1

- `evm-tx` - single EVM transaction (`content.calls.length === 1`)
- `evm-batch` - EIP-5792 batch (`content.calls.length >= 2`, typically with `capabilities.atomicRequired`)
- `signature` - EIP-712 / personal-sign / SIWE; no on-chain tx produced

### 3.2 Reserved (declared, not validated in v0.1)

These values are reserved at the protocol level. Strict validators REJECT them today. v0.3+ will add them without a major bump.

| Kind | Future scope | Driving standard |
|---|---|---|
| `evm-userop` | ERC-4337 v0.7/v0.8 UserOperation | [EIP-4337](https://eips.ethereum.org/EIPS/eip-4337) |
| `evm-frame` | EIP-8141 Frame Transaction | [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141) |
| `evm-7702` | SET_CODE tx type 0x04 with authorization_list | [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) |
| `mandate` | Google AP2 / Visa TAP / Mastercard Verifiable Intent | [AP2](https://ap2-protocol.org/), [Visa TAP](https://developer.visa.com/capabilities/trusted-agent-protocol) |
| `intent` | ERC-7683 cross-chain / Anoma / UniswapX Dutch / RFQ | [ERC-7683](https://eips.ethereum.org/EIPS/eip-7683) |
| `psbt` | Bitcoin Partially Signed | [BIP-174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki) |
| `svm-tx` | Solana (versioned) | Solana core docs |
| `move-tx` | Aptos / Sui Move | Move spec |
| `cosmos-tx` | Cosmos SDK Any-wrapped messages | Cosmos SDK ADR-020 |

### 3.3 Validator behavior

Validators reject any `kind` not in §3.1. Reserved values from §3.2 produce a dedicated "reserved, not yet implemented in v0.1" error so consumers can route them to future decoders without guessing. Unknown values outside both lists are rejected as unknown.

## 4. Producer

```typescript
interface Producer {
  id: string                      // DID, CAIP-10, ERC-8004 agent ref, URL
  name?: string
  signature?: ProducerSignature
}

// Open string per the ERC. Implementations SHOULD support secp256k1, ed25519,
// and p256. Other schemes (including future post-quantum algorithms) MAY be
// used without revising this type.
type SignatureScheme =
  | 'secp256k1' | 'ed25519' | 'p256'
  | string                                        // open for future schemes

interface ProducerSignature {
  scheme: SignatureScheme
  publicKey?: string
  signature: string
  coverage: 'envelope' | 'content'
}
```

Unknown `scheme` values MUST be treated as "unsigned" with a warning (not a hard block). Consumers that implement specific schemes MUST verify signatures locally before trusting the envelope end-to-end.

## 5. Origin

```typescript
interface Origin {
  url: string                     // dApp URL
  verifyStatus: 'VERIFIED' | 'UNVERIFIED' | 'MISMATCH'
  attestation?: string            // e.g. WalletConnect Verify attestation hash
}
```

`verifyStatus: 'VERIFIED'` means the wallet (or upstream relay) has confirmed the dApp URL against an attestation source (e.g. WalletConnect Verify). `'MISMATCH'` is a hard warning. Origin binding prevents the class of UI-spoofing attacks observed against Ledger Connect Kit, WalletConnect sessions, and multisig signers (Bybit $1.4B, UXLINK).

## 6. Content (per kind)

### 6.1 `kind: 'evm-tx'` and `kind: 'evm-batch'`

```typescript
interface EvmTxContent {
  chain: `eip155:${string}`                     // CAIP-2 primary (e.g. "eip155:1")
  chainId?: number                               // legacy alias, deprecated; removed v1.0
  from?: `0x${string}`
  calls: EvmCall[]                               // length === 1 for 'evm-tx', >= 2 for 'evm-batch'
  validity: Validity                             // notAfter REQUIRED
  description: Description
  metadata: Metadata
  decoderRef?: string                            // "protocol/category/method"
  clearSigning?: Record<string, unknown>         // inline ERC-7730 fragment (optional)
}

interface EvmCall {
  to: `0x${string}`
  value?: `0x${string}`                          // hex bigint (EIP-5792 format); default "0x0"
  data?: `0x${string}`                           // default "0x"
  operation?: 'call' | 'delegatecall'            // default 'call'
  capabilities?: Record<string, unknown>          // EIP-5792 per-call (e.g. gasLimitOverride)
}

interface Validity {
  notBefore?: number                             // Unix seconds
  notAfter: number                               // Unix seconds; REQUIRED
  nonceKind?: 'sequential' | 'durable' | 'bitmap'
  blockhashRecency?: { maxAge: number }
}
```

**Why `notAfter` is required.** The Drift $285M (April 2026) and comparable dormant-transaction attacks relied on users signing transactions months before execution under the assumption they were about to execute. Requiring an explicit expiry forces producers to declare the commit window.

**Why per-call `operation`.** The Bybit $1.4B (Feb 2025), UXLINK $11-30M, and Radiant $53M exploits were all executed through UI-concealed delegatecall flips. Making `operation` a first-class, typed field allows consumers to apply risk rules (e.g. block delegatecall to any address not in an explicit allowlist).

### 6.2 Description

```typescript
interface Description {
  short: string                   // required, bounded human-readable
  long?: string
  action: ActionType              // closed enum + 'other' fallback
}

type ActionType =
  | 'transfer' | 'approve' | 'permit' | 'revoke-approval'
  | 'swap' | 'stake' | 'unstake' | 'claim' | 'restake'
  | 'mint' | 'burn' | 'deposit' | 'withdraw'
  | 'delegate' | 'bridge' | 'admin-op' | 'other'
```

`action` is a closed enum: new values are added via spec PR, not via ad-hoc producer strings. `'other'` is the escape hatch; consumers MUST still render the `short` text but SHOULD show stronger confirmation friction for `'other'` because the semantic category is unclear.

### 6.3 Metadata

```typescript
interface Metadata {
  protocol: string                              // "stakewise-v3", "uniswap-v4", etc
  tokenMovements: TokenMovement[]
  counterparties: Counterparty[]
  feeBreakdown?: FeeBreakdown
  estimation?: Estimation
  estimatedGas?: string                          // stringified decimal
}

interface TokenMovement {
  token: `0x${string}` | 'native'
  standard: 'erc20' | 'erc721' | 'erc1155' | 'native'
  symbol: string
  decimals: number
  amount: string                                 // stringified decimal
  tokenId?: string                               // for NFT/ERC-1155; stringified
  kind: 'transfer' | 'approve' | 'permit' | 'mint' | 'burn' | 'revoke'
  isUnlimited?: boolean                          // true for MAX_UINT256 approvals
  from: `0x${string}`                            // REQUIRED
  to: `0x${string}`                              // REQUIRED
  usdValue?: number
}

interface Counterparty {
  address: `0x${string}`
  role: 'recipient' | 'spender' | 'swap-venue' | 'pool' | 'bridge' | 'admin' | 'unknown'
  label?: string                                 // "Uniswap V3 Router"
  labelSource?: 'contact_book' | 'protocol_directory' | 'recent_interaction' | 'untrusted'
  similarityWarning?: { similarTo: `0x${string}`; distance: number }
}
```

Rationale (from incident evidence):

- **`from` and `to` on every movement**: without them, "swap-as-drainer" attacks (SushiSwap routing abuse, documented by Blockaid) are indistinguishable from legitimate swaps. Wallets MUST assert that every `direction: in` movement has `to == from` of the envelope.
- **`kind` + `isUnlimited`**: 56.7% of 2024-2025 drainer incidents used MAX_UINT256 approvals. Making them first-class lets wallets enforce hard warnings.
- **`standard` + `tokenId`**: ERC-721 and ERC-1155 were completely unrepresentable in v0.1. Now they are first-class.
- **`counterparties[].role` + `labelSource`**: address poisoning caused $83.8M on Ethereum + $252M on BSC (USENIX 2025). Partitioning counterparties by role and label source lets wallets flag untrusted or similarly-spelled addresses.

### 6.4 `kind: 'signature'`

```typescript
interface SignatureContent {
  chain: `eip155:${string}`
  from?: `0x${string}`
  scheme: 'eip-712' | 'personal-sign' | 'siwe'
  // EIP-712:
  domain?: { name?, version?, chainId?, verifyingContract?, salt? }
  types?: Record<string, Array<{ name, type }>>
  primaryType?: string
  message?: Record<string, unknown>
  // personal-sign / SIWE:
  messageText?: string
  // common:
  description: Description
  metadata?: Metadata
  validity?: Validity
  erc6492?: boolean                              // for counterfactual smart accounts
}
```

This closes the blind-signing gap for Permit, Permit2, CoW orders, UniswapX Dutch orders, and all EIP-712-signed flows - roughly half of 2025-2026 DeFi volume. Producers MUST emit a `kind: 'signature'` envelope, NOT an `evm-tx` envelope that claims `action: 'permit'`, for off-chain signature requests.

## 7. Risk (unbound)

```typescript
interface RiskAssessment {
  action: 'ALLOW' | 'WARN' | 'BLOCK'
  score?: number                                 // 0-100
  warnings: Array<{
    code: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }>
  scanners?: Array<{
    provider: string
    verdict: 'ALLOW' | 'WARN' | 'BLOCK'
    url?: string
  }>
}
```

Risk is NOT covered by `producer.signature` - wallets and scanners inject verdicts after reception. This matches the common Blockaid / GoPlus / Blowfish interface. Producers MAY include `risk` as self-reported findings (useful for protocol-owned tools).

## 8. Capabilities

```typescript
interface Capabilities {
  atomicRequired?: boolean                              // EIP-5792
  paymasterService?: { url: string; sponsor?: Address } // ERC-4337 paymaster hint
  permissions?: { context: Hex; type: string; expiry? } // ERC-7715 session
  requiresAccountType?: 'eoa' | 'delegated-eoa' | 'erc-4337'
  [k: string]: unknown                                  // open for vendors; MUST use 'x-' prefix
}
```

`capabilities` is intentionally open-ended to match EIP-5792's design. Vendor-specific capabilities MUST be prefixed with `x-` (e.g. `x-alchemy.gasPolicy`). Capabilities MUST NOT influence security-critical UI decisions without wallet explicitly recognizing them.

## 9. Call status taxonomy (post-submit)

Mirrors [EIP-5792 §5](https://eips.ethereum.org/EIPS/eip-5792) exactly. Consumers that observe call outcomes SHOULD use these codes:

- `100` pending
- `200` confirmed
- `400` off-chain failure (never submitted)
- `500` fully reverted
- `600` partially reverted

Exposed in `@txkit/tx-protocol` as `CALLS_STATUS` constant.

## 10. Positioning against existing standards

`@txkit/tx-protocol` does not replace or compete with any of these. It wires them together into the MCP tool -> wallet handoff:

- **EIP-5792 `wallet_sendCalls`**: every `evm-batch` envelope maps losslessly to a `wallet_sendCalls` request. The envelope adds a semantic layer above.
- **ERC-7730 Clear Signing**: `decoderRef` points at a 7730 registry entry; `clearSigning` MAY embed a 7730 fragment inline. Wallets that support 7730 render `metadata` via 7730's display rules.
- **ERC-7715 permissions**: `capabilities.permissions.context` carries the opaque `permissionsContext` from `wallet_grantPermissions`. Session-bound flows reuse the same context across many envelopes.
- **OWS (Open Wallet Standard)**: OWS receives a serialized tx hex to sign. Our envelope sits one layer up, carrying semantic context that the OWS PolicyContext alone cannot see. Messaging: **"OWS signs. txKit decides what's safe to sign."**
- **MCP 2025-11-25**: envelopes SHOULD live in the tool result's `structuredContent`, NOT serialized in `content[].text`. `meta` aligns with MCP `_meta` (excluded from LLM context by convention).

## 11. Anti-features

Do NOT add these. Each has been considered and rejected with evidence:

| Anti-feature | Why rejected |
|---|---|
| Rich JSX display tree (MetaMask SIP-3 pattern) | Couples shape to rendering. AI tools, policy engines, hardware wallets break. Use semantic facts; let wallets render. |
| Open `extensions` field without namespacing | Security hole. Everything vendor-specific goes in `capabilities` with `x-` prefix and MUST NOT affect security UI. |
| `safe: boolean` field | Security theater. Use `risk: { action, warnings }` with graded severity. |
| Float or scientific-notation amounts | Precision bugs. Hex for raw EVM fields; stringified decimal for user-facing amounts. |
| Re-inventing EIP-712 | Use verbatim EIP-712 `domain`/`types`/`primaryType`/`message`. |
| "AI-generated" flag on description | Security theater. Producer signatures and decoder re-verify are the answer. |
| Trusting `description.short` as sole UI source | ERC-7730 lesson: display derives from structured `metadata.*` + trusted descriptor. |

## 12. Migration

`@txkit/tx-protocol@0.1.0` is the first published release. No migration path exists. The canonical call shape is:

```ts
import { createEvmTx, validateEnvelope } from '@txkit/tx-protocol'

const env = createEvmTx({
  chain: 'eip155:1',
  calls: [ { to, value: '0xde0b6b3a7640000', data: '0x...' } ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 3600 },
  description: { short: 'Stake 1 ETH', action: 'stake' },
  metadata: { protocol: 'stakewise-v3', tokenMovements: [...], counterparties: [...] },
  decoderRef: 'stakewise-v3/vault/deposit',
})
const r = validateEnvelope(env)
```

## 13. Decision log

- **2026-04-17**: v0.1 design journal in [wiki](https://github.com/mike-diamond/claude-wiki/blob/main/projects/txkit-tx-protocol-spec-v0.1.md).
- **2026-04-21**: v0.1 deprecated before publish. Full redesign after 3-agent deep research (EIP landscape, production shapes + security incidents, future-proofing) and 2 rounds of red-team self-critique. Verdict: v0.1 unsafe to publish (integrity gap). Ship v0.1 with 15 P0 changes covering discriminated union, CAIP-2, calls[], envelope/content split, signatures, delegatecall surfacing, validity, origin, rich token movements, counterparty roles, risk slot, capabilities, producer signing PQ-ready, reserved kinds, EIP-5792 status taxonomy.
- **2026-04-21**: integrity via `producer.signature` over envelope, not a separate `integrityHash` field. Simpler, follows familiar EIP-712 pattern, same defense-in-depth.
- **2026-04-21**: amounts hex for raw (matches EIP-5792); stringified decimal for UI (Tenderly convention).

## 14. Not normative

v0.1 is still a draft. Breaking changes bump the `version` field to `0.3`. Additive fields within the same version are non-breaking.

## See also

- [`@txkit/tx-protocol` package README](../../README.md)
- [OWS composition](../../../../app/docs/pages/protocol/ows.mdx)
- [`examples/stakewise-deposit.ts`](../../examples/stakewise-deposit.ts)
