# txKit examples

Runnable TypeScript examples that demonstrate `@txkit/tx-protocol` usage.

## Running

```bash
# Install root deps first
pnpm install

# Build tx-protocol (example imports the built package via workspace)
pnpm --filter @txkit/tx-protocol build

# Run an example
pnpm exec tsx examples/stakewise-deposit.ts
```

## Examples

- [`stakewise-deposit.ts`](./stakewise-deposit.ts) — construct and validate a `PreparedTransaction` for a 1 ETH deposit into StakeWise Genesis Vault, then serialize/deserialize for transport.

## See also

- [`spec/v0.1/prepared-transaction.md`](../spec/v0.1/prepared-transaction.md) — protocol specification
- [`packages/tx-protocol/README.md`](../packages/tx-protocol/README.md) — package API reference
