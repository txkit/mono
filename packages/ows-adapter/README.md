# @txkit/ows-adapter

[![npm](https://img.shields.io/npm/v/@txkit/ows-adapter/alpha.svg)](https://www.npmjs.com/package/@txkit/ows-adapter)
[![license](https://img.shields.io/npm/l/@txkit/ows-adapter.svg)](https://github.com/txkit/mono/blob/main/LICENSE)

Bridge MoonPay Open Wallet Standard (OWS) and `@txkit/tx-protocol`. Convert `PreparedEnvelope` to OWS `signAndSend` payloads with policy-engine annotations populated.

> _OWS signs. txKit decides what's safe to sign._

> **v0.1.0-alpha** - OWS is at v1.3.2; surface tracks spec evolution.

## What it does

OWS standardizes key custody + signing for AI agents. The current spec (v1.3.2) reserves `simulate: true` and `simulation?: SimulationResult` on the policy interface but leaves the `SimulationResult` shape abstract (issue [#153](https://github.com/open-wallet-standard/core/issues/153)). This adapter populates that slot from a `PreparedEnvelope`.

```
PreparedEnvelope         → toOwsSignAndSend()  → OwsSignAndSendPayload    → OWS sign + broadcast
                                                 ↑ simulation pre-populated
```

Inverse direction:

```
OwsSignAndSendResult     → annotateWithOwsResult(envelope, result)  → envelope with meta.owsResult
```

This package does not take a runtime dep on `@open-wallet-standard/core` - the OWS shape is mirrored locally as a typed subset. Upgrade as the spec stabilizes.

## Install

```bash
npm install @txkit/ows-adapter@alpha @txkit/tx-protocol@alpha
```

## Usage

```ts
import { createEvmTx } from '@txkit/tx-protocol'
import { toOwsSignAndSend } from '@txkit/ows-adapter'

const envelope = createEvmTx({
  chain: 'eip155:1',
  calls: [ { to: '0x...', data: '0xa9059cbb...' } ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 3600 },
  description: { short: 'Send 100 USDC', action: 'transfer' },
  metadata: {
    tokenMovements: [
      {
        kind: 'transfer',
        token: '0xa0b8...',  // USDC
        from: '0x...',
        to: '0x...',
        amount: '0x5f5e100',
        standard: 'erc20',
      },
    ],
    counterparties: [
      { role: 'recipient', address: '0x...', label: 'Alice', labelSource: 'ens' },
    ],
  },
})

const owsPayload = toOwsSignAndSend(envelope)
// { chain, transaction: {to, data, value}, simulation: {functionName, tokenMovements, counterparties}, ... }
```

## API

- `toOwsSignAndSend(envelope)` - convert `EvmTxEnvelope | EvmBatchEnvelope` to OWS `signAndSend` payload
- `annotateWithOwsResult(envelope, result)` - attach OWS broadcast receipt to envelope `meta.owsResult`

## Status

Skeleton with single-call and batch translation. Roadmap:

- `signature` envelope kind → OWS `signMessage` payload
- ERC-7715 permission grants → OWS policy-engine `permissions` field
- ERC-7730 decoderRef passthrough for clear-signing rules
- Adapter for `producer.signature` verification on the consumer side

## License

[Apache-2.0](./LICENSE)
