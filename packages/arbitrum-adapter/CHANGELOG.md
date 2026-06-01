# @txkit/arbitrum-adapter

## [Unreleased]

- `previewSequencerFee` is now a live estimation rather than a stub. It reads `NodeInterface.gasEstimateComponents` (precompile 0xC8) through a caller-supplied viem `PublicClient`, splitting the cost into the L2 compute portion and the L1 calldata-posting portion (both priced at the L2 base fee, per the Arbitrum Nitro fee model) and filling every `SequencerFeePreview` field.
- Signature change (alpha, surface was flagged unstable): `previewSequencerFee(client, { chain, to, calldata, from?, l1BaseFeeWei? })` is now async and returns `Promise<SequencerFeePreview | null>`. A `to` is required (the precompile simulates the call) and the viem client is injected so the function stays RPC-agnostic and testable. Any failure (RPC down, simulated call reverts, malformed calldata) returns `null` - the preview is advisory and never blocks signing.
- `viem` added as a peer dependency (`>=2`).

## [0.1.0-alpha.0] - 2026-05-29

Initial skeleton release for the Arbitrum Open House London Buildathon Week 1 deliverable.

- `attachBridgeIntent` / `extractBridgeIntent` / `isBridgeIntent` - attach an L1->L2 bridge intent (canonical / Hop / Across / Stargate, open string for future providers) to `PreparedEnvelope.meta.arbitrum.bridge`
- `attachRetryableHints` / `extractRetryableHints` / `isRetryableHints` - attach retryable-ticket UX hints (l2Gas, l2GasPriceBid, maxSubmissionCost, refund addresses) to `PreparedEnvelope.meta.arbitrum.retryable`
- `attachSequencerFeePreview` / `extractSequencerFeePreview` / `previewSequencerFee` - attach a sequencer-fee breakdown (L1 calldata cost + L2 compute) to `PreparedEnvelope.meta.arbitrum.sequencerFee`. `previewSequencerFee` is a stub; will land in alpha.1 with viem-driven estimation.
- `decodeArbitrumCall` - calldata decoder seed for Arbitrum-specific contracts (ArbSys, Delayed Inbox, Hop Bridge entrypoints). Returns `null` for unknown selectors; alpha.1 will expand the registry.
- TypeScript types: `ArbitrumChainId`, `L1ToL2BridgeIntent`, `L1ToL2BridgeProvider`, `RetryableTicketHints`, `SequencerFeePreview`, `ArbitrumMeta`, `EnvelopeWithArbitrum`
- `KNOWN_ARBITRUM_ADDRESSES` registry constant (address -> label) covering core Arbitrum precompiles + canonical bridge inbox addresses
- Vitest stubs covering attach / extract round-trips, type narrowing, meta-preservation, and decoder fall-through
- Zero React or wagmi dependencies. Depends only on `@txkit/tx-protocol` for envelope types.

Surface stable, helper bodies are skeleton-grade and will be hardened with on-chain data + viem integration in alpha.1.
