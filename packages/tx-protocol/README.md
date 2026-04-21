# @txkit/tx-protocol

Open protocol for AI-initiated Web3 operations. TypeScript types, zod schemas, and runtime validators for the `PreparedEnvelope` shape flowing between producers (MCP tools, AI agents, DeFi protocol adapters) and consumers (wallets, signer orchestrators, UI preview layers, policy engines).

Covers: single EVM transactions, EIP-5792 batches, EIP-712 signature requests. Reserves kinds for ERC-4337 UserOperations, EIP-8141 frames, EIP-7702 delegated set-code, ERC-7683 / UniswapX intents, AP2 / Visa TAP / Mastercard Verifiable Intent mandates, Bitcoin PSBT, Solana, Move (Aptos / Sui), and Cosmos.

> Messaging: **"OWS signs. txKit decides what's safe to sign."**

## Install

```bash
pnpm add @txkit/tx-protocol
# or
npm install @txkit/tx-protocol
# or
yarn add @txkit/tx-protocol
```

Zero UI dependencies. Only runtime dep is `zod`. `viem` is an optional peer for strict type narrowing.

## Quick example

```ts
import { createEvmTx, validateEnvelope } from '@txkit/tx-protocol'
import type { EvmTxContent } from '@txkit/tx-protocol'

const content: EvmTxContent = {
  chain: 'eip155:1',
  from: '0x1111111111111111111111111111111111111111',
  calls: [
    {
      to: '0xAC0F906E433d58FA868F936E8A43230473652885',
      value: '0xde0b6b3a7640000',
      data: '0x6e553f650000...',
    },
  ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 3600 },
  description: { short: 'Stake 1 ETH in Genesis Vault', action: 'stake' },
  metadata: {
    protocol: 'stakewise-v3',
    tokenMovements: [
      {
        token: 'native',
        standard: 'native',
        symbol: 'ETH',
        decimals: 18,
        amount: '1000000000000000000',
        kind: 'transfer',
        from: '0x1111111111111111111111111111111111111111',
        to: '0xAC0F906E433d58FA868F936E8A43230473652885',
      },
    ],
    counterparties: [
      {
        address: '0xAC0F906E433d58FA868F936E8A43230473652885',
        role: 'pool',
        label: 'StakeWise Genesis Vault',
        labelSource: 'protocol_directory',
      },
    ],
  },
  decoderRef: 'stakewise-v3/vault/deposit',
}

const envelope = createEvmTx(content, {
  origin: { url: 'https://app.stakewise.io', verifyStatus: 'VERIFIED' },
})

const result = validateEnvelope(envelope, { mode: 'strict' })
if (!result.ok) {
  throw new Error(result.error)
}
// `result.value` is a type-safe PreparedEnvelope
```

See [`examples/stakewise-deposit.ts`](../../examples/stakewise-deposit.ts), [`examples/uniswap-permit2-swap.ts`](../../examples/uniswap-permit2-swap.ts), and [`examples/safe-delegatecall-warning.ts`](../../examples/safe-delegatecall-warning.ts) for runnable versions.

## What this is (and is not)

**This is:**
- A TypeScript envelope + content shape (`PreparedEnvelope`) and zod schemas for runtime validation
- A kind-discriminated protocol: `evm-tx`, `evm-batch`, `signature` implemented today; 9 more kinds reserved for v0.3+ (UserOp, Frame, 7702, mandate, intent, PSBT, Solana, Move, Cosmos)
- Serializer / deserializer for JSON transport
- A wire that composes EIP-5792 batches, ERC-7730 clear-signing, ERC-7715 permissions, and OWS signing into the MCP tool -> wallet handoff

**This is not:**
- A signer. This package contains zero signing code.
- A UI library. Use `@txkit/react` for rendering.
- A transaction builder. Producers (MCP tools, protocol adapters) construct envelopes; this package validates them.
- A simulation engine. Simulation outputs (Blockaid / Tenderly / self) integrate through `metadata` and `risk` fields.

## Spec reference

Canonical spec: [`spec/v0.1/prepared-transaction.md`](../../spec/v0.1/prepared-transaction.md). The `version` field in every envelope pins it to the spec version.

## API

### Creation helpers

```ts
createEvmTx(content: EvmTxContent, envelope?): EvmTxEnvelope          // single call
createEvmBatch(content: EvmTxContent, envelope?): EvmBatchEnvelope    // calls.length >= 2
createSignature(content: SignatureContent, envelope?): SignatureEnvelope
```

Each pre-fills `$schema`, `version`, `kind`, `issuedAt`, and derives `expiresAt` from `content.validity.notAfter` when not overridden.

### Validation

```ts
validateEnvelope(input: unknown, options?: { mode: 'strict' | 'permissive' }): ValidationResult<PreparedEnvelope>
validatePreparedTx(input: unknown): ValidationResult<PreparedEnvelope>   // alias for strict mode
```

Result shape: `{ ok: true, value, warnings? } | { ok: false, error, issues }`.

Strict mode rejects unknown and reserved kinds. Permissive accepts unknown kinds with warnings (still rejects reserved because those will have specific future semantics).

Advisories emitted even on successful validation:

- `delegatecall` on any call => "requires explicit wallet verification against allowlisted targets"
- MAX_UINT256 approval (`kind: 'approve'`, `isUnlimited: true`) => hard-warning advisory

### Serialization

```ts
serialize(envelope: PreparedEnvelope): string
deserialize(json: string): PreparedEnvelope   // throws on invalid
```

### Kind awareness

```ts
import { IMPLEMENTED_KINDS, RESERVED_KINDS } from '@txkit/tx-protocol'
// IMPLEMENTED_KINDS = ['evm-tx', 'evm-batch', 'signature']
// RESERVED_KINDS = ['evm-userop', 'evm-frame', 'evm-7702', 'mandate', 'intent', 'psbt', 'svm-tx', 'move-tx', 'cosmos-tx']
```

### EIP-5792 call status constants

```ts
import { CALLS_STATUS } from '@txkit/tx-protocol'
// PENDING: 100, CONFIRMED: 200, OFFCHAIN_FAILURE: 400, REVERTED: 500, PARTIALLY_REVERTED: 600
```

### Schema module (`@txkit/tx-protocol/schema`)

Tree-shakable zod schemas for consumers that want to compose or extend:

- `preparedEnvelopeSchema` (discriminated union over `kind`)
- `evmTxEnvelopeSchema`, `evmBatchEnvelopeSchema`, `signatureEnvelopeSchema`
- Content schemas: `evmTxContentSchema`, `signatureContentSchema`
- Sub-schemas: `producerSchema`, `originSchema`, `riskAssessmentSchema`, `capabilitiesSchema`, `tokenMovementSchema`, `counterpartySchema`, `validitySchema`, `descriptionSchema`, `metadataSchema`, `feeBreakdownSchema`, `estimationSchema`, `evmCallSchema`, `actionTypeSchema`, `eip712DomainSchema`

## Security invariants

1. **txKit never holds keys.** This package contains no signing code. Signing is delegated to the wallet / signer provider (OWS, Safe, Turnkey, Privy, wagmi, etc).
2. **Off-chain fields are presentational.** `description`, `metadata`, `origin`, `risk`, `decoderRef`, `clearSigning`, and `meta` carry no cryptographic integrity on their own. Producer signatures (`producer.signature` with `coverage: 'envelope'`) provide end-to-end integrity; consumer-side decoder re-verification (`@txkit/tx-decoder` when that package ships) provides defense in depth.
3. **Policy engines validate on raw fields only.** Spend limits, allowlists, and blocklists MUST operate on `{chain, calls[*].to, calls[*].data, calls[*].value}`. Trusting `description.short` is a blind-signing pattern.
4. **Extensions are open with discipline.** `capabilities` is an open record matching EIP-5792 design. Vendor-specific fields MUST use `x-` prefix. Capabilities MUST NOT influence security-critical UI unless the wallet explicitly recognizes them.

## Regulatory notice (MiCA / US frameworks)

`@txkit/tx-protocol` is a presentational protocol for human-readable transaction previews. It does not provide cryptographic integrity guarantees for off-chain data on its own (signatures and decoder re-verification provide the integrity layer). Under **EU MiCA** and similar frameworks, liability for transaction execution rests with the signing party (wallet / signer provider), not with txKit. This package does not custody keys, broker trades, or provide investment advice.

## Versioning

- v0.1 is a draft. Breaking changes bump the `version` field to `0.2`. Additive fields within the same version are non-breaking.
- npm package follows semver for code-level changes (additions, bugfixes).

## License

MIT. See [LICENSE](./LICENSE).

## See also

- [`@txkit/core`](../core) - runtime utilities (formatting, errors)
- [`@txkit/react`](../react) - React components and hooks
- [txKit docs](https://txkit.dev)
- [Spec RFC](../../spec/v0.1/prepared-transaction.md)
- [OWS composition](../../app/docs/pages/protocol/ows.mdx)
- Research synthesis: `wiki/projects/txkit-tx-protocol-spec-v0.2-research-2026-04-21.md` (historical research doc; v0.1 ships the hardened shape designed there)
