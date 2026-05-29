# @txkit/arbitrum-adapter

[![npm](https://img.shields.io/npm/v/@txkit/arbitrum-adapter/alpha.svg)](https://www.npmjs.com/package/@txkit/arbitrum-adapter)
[![license](https://img.shields.io/npm/l/@txkit/arbitrum-adapter.svg)](https://github.com/txkit/mono/blob/main/LICENSE)

Bridge Arbitrum specifics and `@txkit/tx-protocol` `PreparedEnvelope`. Attach L1->L2 bridge intents, retryable-ticket UX hints, and sequencer-fee previews to an envelope; decode Arbitrum-flavoured calldata.

> **v0.1.0-alpha** - skeleton scaffolded for the Arbitrum Open House London Buildathon (June 14 deadline). Surface stable; helper bodies will harden in alpha.1 with viem integration.

## Why this exists

The PreparedTransaction Envelope (ERC-8265, [PR #1753](https://github.com/ethereum/ERCs/pull/1753)) gives producers a chain-neutral way to describe a transaction before signing. Arbitrum needs a few additions on top of that base shape so wallet previews can show what is actually happening:

- L1->L2 bridge deposits are two-leg flows. The envelope is the L1 transaction; the wallet should show the expected L2 outcome ("you will receive X on Arbitrum One via Across").
- Retryable tickets carry their own gas budget plus refund-address semantics that have no analogue on a vanilla L1 transaction.
- Arbitrum's fee model splits each transaction into L2 compute + L1 calldata cost, with Nova compressing calldata via Brotli on the AnyTrust DAC. A flat `gasPrice * gasLimit` preview hides the L1 component entirely.
- Arbitrum-specific contracts (precompiles, the Delayed Inbox, canonical gateway routers, Hop / Across L1 entrypoints) carry intents that a generic ERC-20 decoder will not surface.

`@txkit/tx-protocol` reserves a `meta` slot on every envelope. This package puts a typed shape on `meta.arbitrum`, with `bridge`, `retryable`, and `sequencerFee` sub-keys, plus an Arbitrum-aware decoder seed.

## Install

```bash
npm install @txkit/arbitrum-adapter@alpha @txkit/tx-protocol@alpha
```

## Usage

### Attach an L1->L2 bridge intent

```ts
import { createEvmTx } from '@txkit/tx-protocol'
import { attachBridgeIntent, extractBridgeIntent } from '@txkit/arbitrum-adapter'

const envelope = createEvmTx({
  chain: 'eip155:1', // L1 deposit transaction
  calls: [ { to: '0x5C7BCd6E7De5423a257D81B442095A1a6ced35C5', data: '0x...' } ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 3600 },
  description: { short: 'Bridge 0.1 ETH to Arbitrum One via Across', action: 'bridge' },
})

const withBridge = attachBridgeIntent(envelope, {
  provider: 'across',
  l1ChainId: 'eip155:1',
  l2ChainId: 'eip155:42161',
  tokenIn: 'native',
  amount: '0x16345785d8a0000',
  recipient: '0xRecipientOnL2',
})

const intent = extractBridgeIntent(withBridge)
// -> { provider: 'across', l1ChainId: 'eip155:1', l2ChainId: 'eip155:42161', ... }
```

### Surface a retryable-ticket budget

```ts
import { attachRetryableHints } from '@txkit/arbitrum-adapter'

const withRetryable = attachRetryableHints(envelope, {
  l2Gas: '0x186a0',
  l2GasPriceBid: '0x5f5e100',
  maxSubmissionCost: '0x38d7ea4c68000',
  callValueRefundAddress: '0xRefundReceiver',
})
```

### Preview the sequencer fee

```ts
import { attachSequencerFeePreview } from '@txkit/arbitrum-adapter'

const withFee = attachSequencerFeePreview(envelope, {
  l2GasEstimate: '0x186a0',
  l1CalldataBytes: 132,
  l1BaseFeeWei: '0x3b9aca00',
  l1FeeWei: '0x16345785d8a0000',
  l2FeeWei: '0x71afd498d0000',
  totalFeeWei: '0x1d4ab7f7c2a0000',
  isCompressed: false, // true for Arbitrum Nova
})
```

### Decode Arbitrum-flavoured calldata

```ts
import { decodeArbitrumCall } from '@txkit/arbitrum-adapter'

const decoded = decodeArbitrumCall({
  to: '0x4dBd4fC535Ac27206064B6804B5d6C7Acb7C1aBc',
  calldata: '0x679b6ded...',
})
// -> { kind: 'retryable-create', contractLabel: 'Arbitrum Inbox' }
```

## API

### Bridge intents

- `attachBridgeIntent(envelope, intent)` - attach `meta.arbitrum.bridge`
- `extractBridgeIntent(envelope)` - read `meta.arbitrum.bridge`
- `isBridgeIntent(value)` - type guard

### Retryable tickets

- `attachRetryableHints(envelope, hints)` - attach `meta.arbitrum.retryable`
- `extractRetryableHints(envelope)` - read `meta.arbitrum.retryable`
- `isRetryableHints(value)` - type guard

### Sequencer-fee preview

- `attachSequencerFeePreview(envelope, preview)` - attach `meta.arbitrum.sequencerFee`
- `extractSequencerFeePreview(envelope)` - read `meta.arbitrum.sequencerFee`
- `isSequencerFeePreview(value)` - type guard
- `previewSequencerFee({ chain, calldata, l1BaseFeeWei? })` - skeleton stub, returns `null` until alpha.1
- `NOVA_USES_COMPRESSED_CALLDATA` - constant flag (`true`)

### Decoder

- `decodeArbitrumCall({ to, calldata })` - returns `ArbitrumDecodedCall | null`
- `KNOWN_ARBITRUM_ADDRESSES` - address -> label registry (precompiles, Delayed Inbox, canonical gateway, Hop / Across L1 entrypoints)

## Status

Skeleton. Helper bodies for `previewSequencerFee` and the decoder registry will harden in alpha.1 with viem-driven precompile reads (`ArbGasInfo`, `NodeInterface`) plus expanded coverage of Hop bonders per token, Across SpokePool per chain, Stargate routers, Camelot, GMX, Pendle, and Aave V3 on Arbitrum One.

Tracking issue: open one in [github.com/txkit/mono/issues](https://github.com/txkit/mono/issues) if you have a buildathon use case that needs prioritisation.

## License

[Apache-2.0](./LICENSE)
