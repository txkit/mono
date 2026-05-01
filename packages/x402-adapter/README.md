# @txkit/x402-adapter

[![npm](https://img.shields.io/npm/v/@txkit/x402-adapter/alpha.svg)](https://www.npmjs.com/package/@txkit/x402-adapter)
[![license](https://img.shields.io/npm/l/@txkit/x402-adapter.svg)](https://github.com/txkit/mono/blob/main/LICENSE)

Bridge x402 HTTP payments and `@txkit/tx-protocol` `PreparedEnvelope`. Attach payment proofs to envelopes; extract payment context from envelopes.

> **v0.1.0-alpha** - x402 spec is at v0.1, surface may shift.

## Why this exists

[x402](https://www.x402.org) is an HTTP payment protocol for AI agents (transferred to the Linux Foundation 2 Apr 2026, partners include Google, Microsoft, AWS, Visa, Mastercard, Stripe, Amex, Shopify, Circle, Base, Polygon, Solana). When an agent pays a 402 challenge, the resulting payment receipt often needs to live alongside the transaction the agent is about to sign - so the wallet preview shows "this signature pays for resource X" instead of an opaque hash.

`@txkit/tx-protocol` reserves a `meta` slot on every envelope. This package puts a typed shape on `meta.x402`.

## Install

```bash
npm install @txkit/x402-adapter@alpha @txkit/tx-protocol@alpha
```

## Usage

```ts
import { createEvmTx } from '@txkit/tx-protocol'
import { attachX402Proof, extractX402 } from '@txkit/x402-adapter'

const envelope = createEvmTx({
  chain: 'eip155:8453',
  calls: [ { to: '0x...', data: '0x...' } ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 3600 },
  description: { short: 'Pay for AI skill resource', action: 'pay' },
})

const withProof = attachX402Proof(envelope, {
  version: '0.1',
  paymentRequirementsHash: '0xabc...',
  paymentReceipt: '0xdef...',
  chain: 'eip155:8453',
  asset: 'native',
  amount: '0xde0b6b3a7640000',
  payee: '0x...',
  paidAt: Date.now() / 1000,
  resource: '/api/v1/agent/skill',
})

// Downstream:
const x402 = extractX402(withProof)
// → { version: '0.1', paymentReceipt: ..., resource: '/api/v1/agent/skill', ... }
```

## API

- `attachX402Intent(envelope, intent)` - attach a pre-payment intent to `meta.x402`
- `attachX402Proof(envelope, proof)` - attach a settled payment receipt to `meta.x402`
- `extractX402(envelope)` - read `meta.x402`, returns `X402Intent | X402PaymentProof | null`
- `isX402Intent(value)` - type guard
- `isX402Proof(value)` - type guard

## Status

Skeleton. Surface stable, will track x402 spec evolution as the working group ships v0.2+.

## License

[MIT](./LICENSE)
