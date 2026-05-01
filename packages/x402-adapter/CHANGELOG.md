# @txkit/x402-adapter

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release. Bridges x402 HTTP payments (Linux Foundation, since 2 Apr 2026) and `@txkit/tx-protocol` envelopes via `attachX402Intent`, `attachX402Proof`, and `extractX402` helpers.

- `attachX402Intent` / `attachX402Proof` - attach pre-payment intent or settled receipt to `PreparedEnvelope.meta.x402`
- `extractX402` - read `meta.x402` from any envelope
- Type guards: `isX402Intent`, `isX402Proof`
- TypeScript types: `X402Intent`, `X402PaymentProof`, `EnvelopeWithX402`
- 7 vitest tests covering attach, extract, type narrowing, and meta-preservation
- Zero React or wagmi dependencies. Depends only on `@txkit/tx-protocol` for envelope types.
