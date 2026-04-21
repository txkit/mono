# txKit examples

Runnable TypeScript examples demonstrating `@txkit/tx-protocol` v0.2 usage.

## Running

```bash
# Install root deps first
pnpm install

# Build tx-protocol (example imports the built package via workspace)
pnpm --filter @txkit/tx-protocol build

# Run an example
pnpm exec tsx examples/stakewise-deposit.ts
pnpm exec tsx examples/uniswap-permit2-swap.ts
pnpm exec tsx examples/safe-delegatecall-warning.ts
```

## Examples

- [`stakewise-deposit.ts`](./stakewise-deposit.ts) - construct and validate an `evm-tx` envelope for a 1 ETH deposit into StakeWise Genesis Vault. Showcases `createEvmTx`, `validateEnvelope`, CAIP-2 chain, origin verification, serialize / deserialize round-trip.
- [`uniswap-permit2-swap.ts`](./uniswap-permit2-swap.ts) - two envelopes: a `signature` envelope (Permit2 EIP-712) followed by an `evm-tx` envelope (Uniswap Universal Router swap). Showcases the `kind: 'signature'` flow which v0.2 introduced to stop blind-signing.
- [`safe-delegatecall-warning.ts`](./safe-delegatecall-warning.ts) - demonstrates the delegatecall advisory. Bybit $1.4B, UXLINK, Radiant lesson: `operation: 'delegatecall'` is now a first-class typed field with a mandatory validator warning.

## See also

- [`spec/v0.2/prepared-transaction.md`](../spec/v0.2/prepared-transaction.md) - canonical specification
- [`packages/tx-protocol/README.md`](../packages/tx-protocol/README.md) - package API reference
- [`spec/v0.1/prepared-transaction.md`](../spec/v0.1/prepared-transaction.md) - DEPRECATED historical shape
