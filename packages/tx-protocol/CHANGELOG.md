# @txkit/tx-protocol

## 0.1.0

Initial release.

### Added
- `PreparedTransaction` TypeScript type — canonical shape for prepared Web3 transactions (spec v0.1)
- Supporting types: `TokenMovement`, `ActionType`, `TransactionDescription`, `PreparedTransactionMetadata`, `PreparedTransactionSequence`, `SimulationHint`, `ValidationResult`
- Zod schemas for runtime validation (`@txkit/tx-protocol/schema` entry)
- `validatePreparedTx(input)` — returns `{ ok, value }` or `{ ok: false, error, issues }`
- `serialize(tx)` / `deserialize(json)` — JSON transport helpers with `bigint` roundtrip
- `SPEC_VERSION` constant pinned to `"0.1"`
- Full spec RFC at `spec/v0.1/prepared-transaction.md` in the txKit repo

### Scope
- **Presentational protocol only.** No cryptographic integrity guarantees on the `description`, `metadata`, or `decoderRef` fields. Policy engines must validate on the raw `{chainId, to, data, value}` tuple.
- **No UI dependencies.** This package is framework-agnostic. Use `@txkit/react` for preview rendering.
- **No signing.** This package contains no signing code; signing is delegated to the wallet / signer provider.
