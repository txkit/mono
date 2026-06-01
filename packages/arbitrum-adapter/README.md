# @txkit/arbitrum-adapter

[![npm](https://img.shields.io/npm/v/@txkit/arbitrum-adapter/alpha.svg)](https://www.npmjs.com/package/@txkit/arbitrum-adapter)
[![license](https://img.shields.io/npm/l/@txkit/arbitrum-adapter.svg)](https://github.com/txkit/mono/blob/main/LICENSE)

Bridge Arbitrum specifics and `@txkit/tx-protocol` `PreparedEnvelope`. Attach L1->L2 bridge intents, retryable-ticket UX hints, and sequencer-fee previews to an envelope; decode Arbitrum-flavoured calldata.

> **v0.1.0-alpha** - scaffolded for the Arbitrum Open House London Buildathon (June 14 deadline). `previewSequencerFee` is live (viem-driven precompile read); the decoder registry and the remaining helper coverage harden in alpha.1.

## Why this exists

The PreparedTransaction Envelope (ERC-8265, [PR #1753](https://github.com/ethereum/ERCs/pull/1753)) gives producers a chain-neutral way to describe a transaction before signing. Arbitrum needs a few additions on top of that base shape so wallet previews can show what is actually happening:

- L1->L2 bridge deposits are two-leg flows. The envelope is the L1 transaction; the wallet should show the expected L2 outcome ("you will receive X on Arbitrum One via Across").
- Retryable tickets carry their own gas budget plus refund-address semantics that have no analogue on a vanilla L1 transaction.
- Arbitrum's fee model splits each transaction into L2 compute + L1 calldata cost, with Nova compressing calldata via Brotli on the AnyTrust DAC. A flat `gasPrice * gasLimit` preview hides the L1 component entirely.
- Arbitrum-specific contracts (precompiles, the Delayed Inbox, canonical gateway routers, Hop / Across L1 entrypoints) carry intents that a generic ERC-20 decoder will not surface.

`@txkit/tx-protocol` reserves a `meta` slot on every envelope. This package puts a typed shape on `meta.arbitrum`, with `bridge`, `retryable`, and `sequencerFee` sub-keys, plus an Arbitrum-aware decoder seed.

## Install

```bash
npm install @txkit/arbitrum-adapter@alpha @txkit/tx-protocol@alpha viem
```

`viem` is a peer dependency - `previewSequencerFee` reads Arbitrum precompiles through a viem `PublicClient` you supply.

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

Compute a live preview from an Arbitrum RPC, then attach it to the envelope:

```ts
import { createPublicClient, http } from 'viem'
import { arbitrum } from 'viem/chains'
import { previewSequencerFee, attachSequencerFeePreview } from '@txkit/arbitrum-adapter'

const client = createPublicClient({ chain: arbitrum, transport: http() })

const preview = await previewSequencerFee(client, {
  chain: 'eip155:42161',
  to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // inner call target
  calldata: '0xa9059cbb...',                        // inner calldata
})
// -> { l2GasEstimate, l1CalldataBytes, l1FeeWei, l2FeeWei, totalFeeWei, isCompressed, previewBlock }
// or null if the RPC is unreachable or the simulated call reverts

const withFee = preview ? attachSequencerFeePreview(envelope, preview) : envelope
```

`previewSequencerFee` reads `NodeInterface.gasEstimateComponents` (precompile 0xC8), which simulates the `to` + `calldata` call and splits the cost into the L2 compute portion and the L1 calldata-posting portion. Both are priced at the L2 base fee (the L1 component is denominated in L2 gas units). Pass `from` to set the simulated `msg.sender`, or `l1BaseFeeWei` to pin the reported L1 base fee.

You can also attach a producer-supplied preview directly, without an RPC:

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
- `previewSequencerFee(client, { chain, to, calldata, from?, l1BaseFeeWei? })` - async; live preview via `NodeInterface.gasEstimateComponents` read through the supplied viem `PublicClient`. Returns `null` on RPC failure or if the simulated call reverts
- `NOVA_USES_COMPRESSED_CALLDATA` - constant flag (`true`)

### Decoder

- `decodeArbitrumCall({ to, calldata })` - returns `ArbitrumDecodedCall | null`
- `KNOWN_ARBITRUM_ADDRESSES` - address -> label registry (precompiles, Delayed Inbox, canonical gateway, Hop / Across L1 entrypoints)

## Status

`previewSequencerFee` is live via a viem-driven `NodeInterface` read. The decoder registry is still a seed and will harden in alpha.1 with expanded coverage of Hop bonders per token, Across SpokePool per chain, Stargate routers, Camelot, GMX, Pendle, and Aave V3 on Arbitrum One. Two known alpha.1 refinements for the fee preview: Nova `l1CalldataBytes` currently reports the raw byte count (not the post-Brotli/DAC size, though the fee itself is accurate), and a revert-resilient `ArbGasInfo` fallback would let the L1 portion survive when the simulated call reverts.

Tracking issue: open one in [github.com/txkit/mono/issues](https://github.com/txkit/mono/issues) if you have a buildathon use case that needs prioritisation.

## License

[Apache-2.0](./LICENSE)
