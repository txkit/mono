# @txkit/tx-protocol

Open protocol for AI-initiated Web3 transactions — TypeScript types, zod schemas, and validators for the `PreparedTransaction` shape.

Used between **producers** (MCP tools, AI agents, DeFi protocol adapters) and **consumers** (wallets, signer orchestrators, UI preview layers).

> **Messaging.** _"OWS signs. txKit decides what's safe to sign."_  
> This package defines the shape that flows between them.

## Install

```bash
pnpm add @txkit/tx-protocol
# or
npm install @txkit/tx-protocol
# or
yarn add @txkit/tx-protocol
```

## Quick example

```ts
import { validatePreparedTx, SPEC_VERSION } from '@txkit/tx-protocol'
import type { PreparedTransaction } from '@txkit/tx-protocol'

const deposit: PreparedTransaction = {
  version: SPEC_VERSION,
  chainId: 1,
  to: '0xAC0F906E433d58FA868F936E8A43230473652885', // StakeWise Genesis Vault
  data: '0x6e553f650000...',
  value: 1_000_000_000_000_000_000n, // 1 ETH
  description: {
    short: 'Stake 1 ETH in Genesis Vault',
    action: 'stake',
  },
  metadata: {
    protocol: 'stakewise-v3',
    tokenMovements: [
      {
        token: 'native',
        symbol: 'ETH',
        decimals: 18,
        amount: 1_000_000_000_000_000_000n,
        direction: 'out',
      },
    ],
    counterparties: ['0xAC0F906E433d58FA868F936E8A43230473652885'],
  },
  decoderRef: 'stakewise-v3/vault/deposit',
}

const result = validatePreparedTx(deposit)
if (!result.ok) throw new Error(result.error)
// `result.value` is a type-safe PreparedTransaction
```

See [`examples/stakewise-deposit.ts`](../../examples/stakewise-deposit.ts) for a runnable version.

## What this is (and is not)

**This is**:
- TypeScript types for the `PreparedTransaction` shape (spec v0.1)
- zod schemas for runtime validation (`./schema` export)
- Serializer/deserializer for JSON transport with `bigint` roundtrip
- Zero runtime dependencies on React, wagmi, or any UI framework

**This is not**:
- A signer — this package contains no signing code
- A UI library — use `@txkit/react` for rendering
- A transaction builder — producers (MCP tools) construct the shape; this package validates it
- A simulation engine — the `simulation` field is presentational, not normative

## Spec reference

The canonical specification lives at [`spec/v0.1/prepared-transaction.md`](../../spec/v0.1/prepared-transaction.md) in the txKit repository. The `version` field in each `PreparedTransaction` pins it to that spec version.

## API

### Exports (`@txkit/tx-protocol`)

- `validatePreparedTx(input: unknown): ValidationResult<PreparedTransaction>` — validates arbitrary input against the spec, returns `{ ok: true, value }` or `{ ok: false, error, issues }`.
- `serialize(tx: PreparedTransaction): string` — JSON string with `bigint` fields encoded as `"<number>n"`.
- `deserialize(json: string): PreparedTransaction` — throws on invalid shape.
- `SPEC_VERSION` — current spec version literal (`"0.1"`).
- Types: `PreparedTransaction`, `TokenMovement`, `ActionType`, `TransactionDescription`, `PreparedTransactionMetadata`, `PreparedTransactionSequence`, `SimulationHint`, `ValidationResult`.

### Exports (`@txkit/tx-protocol/schema`)

Lazy-loadable zod schemas for tree-shaken consumers:

- `preparedTransactionSchema`
- `tokenMovementSchema`
- `transactionDescriptionSchema`
- `preparedTransactionMetadataSchema`
- `actionTypeSchema`
- `simulationHintSchema`
- `preparedTransactionSequenceSchema`

## Security invariants

- **txKit never holds keys.** This package contains no signing code. Signing is delegated to the wallet / signer provider (OWS, Safe, Turnkey, Privy, wagmi, etc).
- **`description` is presentational.** It has **no cryptographic integrity guarantee**. Policy engines MUST validate on `{to, data, value}`, not on `description.short`.
- **Extensions are opaque.** Consumers MUST treat `extensions` as untrusted opaque metadata; do not use them for security decisions unless explicitly validated.

## Regulatory notice (MiCA / US frameworks)

`@txkit/tx-protocol` is a **presentational protocol** for human-readable transaction previews. It does not provide cryptographic integrity guarantees for off-chain data (description, metadata, decoderRef). Users and compliance teams should not treat these fields as an authoritative record of on-chain effects — the only authoritative representation is the raw tuple `{chainId, to, data, value}`.

Under **EU MiCA** and similar frameworks, liability for transaction execution rests with the signing party (wallet / signer provider), not with txKit. This package does not custody keys, broker trades, or provide investment advice.

## Versioning

- v0.1 is an **evolving draft**. Breaking changes bump the `version` field to `0.2`, not a semver-major. Producers and consumers MUST check the `version` field.
- This npm package follows semver for code-level changes (API additions, bugfixes).

## License

MIT — see [LICENSE](./LICENSE).

## See also

- [`@txkit/core`](../core) — runtime utilities (formatting, errors)
- [`@txkit/react`](../react) — React components and hooks (`useExecutePreparedTx`, etc)
- [txKit docs](https://txkit.dev)
- [Spec RFC](../../spec/v0.1/prepared-transaction.md)
