# @txkit/ows-adapter

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release. Bridges MoonPay Open Wallet Standard (OWS) and `@txkit/tx-protocol` envelopes. "OWS signs. txKit decides what's safe to sign."

- `toOwsSignAndSend(envelope)` - convert `EvmTxEnvelope | EvmBatchEnvelope` to OWS `signAndSend` payload with policy-engine annotations (function name, token movements, counterparties, risk, validity)
- `annotateWithOwsResult(envelope, result)` - attach broadcast receipt back into envelope `meta.owsResult`
- TypeScript types: `OwsTransaction`, `OwsSimulationResult`, `OwsSignAndSendPayload`, `OwsSignAndSendResult` (mirrored subset of OWS v1.3.2 spec - no runtime dep on `@open-wallet-standard/core`)
- 3 vitest tests covering single-call translation, metadata-rich translation, and result annotation
- Zero React or wagmi dependencies. Depends only on `@txkit/tx-protocol` for envelope types.
