# Scenario C - x402-paid RWA agent on Robinhood Chain (design)

Status: approved 2026-06-04. Branch: `feat/arbitrum-scenario-c-rwa` (off `feat/arbitrum-week2-agent-flow`, PR #25).

## Goal

A second working buildathon scenario that proves the txKit thesis generalises to
any Arbitrum Orbit chain and any action: an agent prepares a **mock RWA stock
purchase** on Robinhood Chain testnet (chainId 46630), gated behind an **x402
paywall**, executed through the same `AgentPolicyGate.executeEnvelope`. The user
verifies a decoded envelope before signing. End to end it produces a **real
on-chain buy tx hash on Robinhood** (a public sponsor chain).

Success = `forge test` green, `tsc`/`eslint`/`next build` clean, an
`anvil --chain-id 46630` rehearsal that produces a real local `executeEnvelope`
tx, and a runbook for Mike to deploy + smoke on real Robinhood and paste the
public tx hashes into the README.

## Decisions (resolved with Mike)

1. **x402 fidelity = verify-only spine, real settlement as an optional upgrade.**
   Coinbase's facilitator does not support Robinhood (or any Orbit chain), so any
   x402 here is self-hosted regardless. We implement real HTTP 402 semantics +
   real EIP-712 payment-authorization signing + real `verify` (recover signer),
   and honestly stub `settle` on testnet. The x402 spec separates `verify` and
   `settle`, so this is a defensible partial facilitator, not a fake. Real
   on-chain settlement (EIP-3009 `transferWithAuthorization` on a mock USDC) is
   layered as a swappable `settle()` we can flip on later if time allows.
2. **RWA action uses real faucet stock tokens, not a pure mock.** The Robinhood
   faucet issues real TSLA / AMZN / PLTR ERC-20s, so the "buy" moves real
   faucet-held tokens through a small `MockRwaRouter`, which is more honest and
   compelling than a value-less mock. Fallback to a pure event/balance mock if
   the faucet token addresses are not cleanly documented.
3. **Same gate, same envelope shape.** RWA buy goes through `AgentPolicyGate.execute
   Envelope` on Robinhood with an EIP-712 agent signature (chainId 46630, the
   Robinhood gate's domain). Consistent with Scenario A; maximal reuse.
4. **User pays + signs; txKit holds no keys.** The user signs both the x402
   payment authorization and the `executeEnvelope` buy in their wallet. The
   off-chain `AGENT_SIGNER` only signs the EIP-712 envelope authorization (same
   as Scenario A). We accept that this is "human pays paywall, agent prepares"
   rather than "autonomous agent pays from a budget" - the latter breaks the
   keys-never-held invariant.

## Verified external facts (2026-06-04, sourced)

Robinhood Chain testnet (Arbitrum Orbit L2):
- chainId **46630** (0xb626). Live + public since 2026-02-10, not gated.
- Public RPC: `https://rpc.testnet.chain.robinhood.com` (rate-limited). Recommended:
  Alchemy `https://robinhood-testnet.g.alchemy.com/v2/<key>` (we hold an Alchemy key).
  NOTE: our `robinhoodTestnet.ts` currently has the WRONG host
  (`testnet.rpc.chain.robinhood.com`) - fix to `rpc.testnet.chain.robinhood.com`.
- Faucet: `https://faucet.testnet.chain.robinhood.com` -> 0.05 ETH / 24h + 5 units
  of each stock token (TSLA, AMZN, PLTR, NFLX, AMD, ...).
- Explorer: `https://explorer.testnet.chain.robinhood.com` (Blockscout).
- Gas token: ETH. Orbit two-part fee (L2 exec + L1 data); viem `estimateGas`
  returns the total, no special handling.

x402 (Coinbase HTTP 402 payment protocol):
- Coinbase facilitator supports Base / Arbitrum One / Polygon / World / Solana
  (mainnet) + Base Sepolia / World Sepolia / Solana Devnet. **NOT Robinhood / any
  Orbit chain** -> self-host required.
- Headers: `PAYMENT-REQUIRED` (402 body, base64), `PAYMENT-SIGNATURE` (client ->
  server), `PAYMENT-RESPONSE` (final). NOT `X-PAYMENT`.
- EVM scheme `exact`: EIP-3009 `transferWithAuthorization` (USDC/EURC), Permit2
  fallback, ERC-7710 for smart accounts. Facilitator `verify` + `settle` split.

## Architecture (mirrors Scenario A, adds an x402 paywall stage)

- `contracts/src/MockRwaRouter.sol` - `buy(address receiver, bytes32 ticker,
  uint256 amount)`; moves faucet stock tokens (or mock event/balance fallback);
  emits `RwaPurchased`. Allow-listed recipient on the Robinhood `AgentPolicyGate`.
- `app/api/x402/route.ts` - self-hosted facilitator. No/invalid `PAYMENT-SIGNATURE`
  -> 402 + `PAYMENT-REQUIRED` requirements (scheme, network `eip155:46630`,
  amount, payTo, nonce, expiry). Valid -> `verify` (recover EIP-712 signer, check
  amount/payTo/nonce/expiry) -> 200 + proof; `settle` stubbed (labelled).
- `src/agent/envelope-builder.ts` - implement `buildRwaEnvelope` (replace throw):
  inner = `MockRwaRouter.buy`, outer = `AgentPolicyGate.executeEnvelope`, EIP-712
  signed for chainId 46630. Mirror `buildPendleEnvelope`.
- `app/api/agent/route.ts` - wire the `rwa` scenario: Robinhood cost-guard (skip
  Claude pre-deploy), require + re-verify the x402 proof, `prepare_rwa_buy` ->
  build -> sign -> return. Remove the 501 stub.
- `app/rwa-buy/X402Paywall.tsx` + real `app/rwa-buy/RwaAgentChat.tsx` - paywall
  stage then a chat mirroring `PendleAgentChat`. Reuse `EnvelopePreview`,
  `SignEnvelopeActions`, `ChatMessage`, `fetchDecoded`, `formatters` (already
  multi-chain), and a generalised deploy-pending banner.
- `src/config/deployed.ts` + `contracts/deployed.json` - add a `MockRwaRouter`
  section (46630) + `getMockRwaRouterAddress` / `checkIsMockRwaRouterDeployed`.
- `decoder-data/mock-rwa-router.json` - descriptor so the inner call decodes as
  "Buy 5 TSLA" (handle bytes32 ticker -> ASCII in the preview).
- `contracts/script/DeployRobinhoodTestnet.s.sol` - deploy gate + MockRwaRouter +
  allow-list + set `agentSigner`. Smoke via an RWA variant of
  `SmokeExecuteEnvelope`.

## Data flow

User -> RwaAgentChat -> X402Paywall (wallet signs PaymentAuthorization) ->
POST /api/x402 -> verify -> proof -> unlock -> chat -> POST /api/agent
{scenario: rwa, messages, paymentProof, receiverAddress} -> server re-verifies
proof -> Claude (haiku) `prepare_rwa_buy` -> `buildRwaEnvelope` -> sign (46630) ->
signed envelope -> EnvelopePreview (decode via /api/decode) -> SignEnvelopeActions
-> user signs `executeEnvelope` on Robinhood -> real buy tx hash.

## Verification strategy

- Solidity: `MockRwaRouter.t.sol` (buy records/emits/moves token) + gate
  integration with an RWA inner call.
- TS: `buildRwaEnvelope` unit (envelope shape, inner calldata, bytes32 ticker),
  x402 verify (recover signer; reject replay / expiry / wrong amount).
- `anvil --chain-id 46630` rehearsal: deploy gate + MockRwaRouter + allow-list ->
  x402 verify -> build -> `executeEnvelope` -> real local tx hash.
- `tsc --noEmit`, `eslint app src`, `next build`, em-dash scan.

## Scope boundaries / honesty labels

- x402 `settle` stubbed on testnet (stated in UI + 402 response + README).
- `MockRwaRouter` is a deterministic mock router; no real brokerage/equity.
- Replay protection is expiry-bounded; a durable cross-invocation nonce store is
  out of scope for the demo (single-session).
- Robinhood testnet has no SLA.

## External dependencies (Mike, not a build blocker)

- Hit the faucet (ETH + stock tokens) on the deployer address; grab an Alchemy
  Robinhood key.
- Deploy gate + MockRwaRouter on real Robinhood + allow-list + set `agentSigner`,
  run the RWA smoke, paste addresses + public tx hashes into the README.

## References

- Robinhood Chain docs: connecting / deploy (Foundry) / faucet / explorer.
- Arbitrum blog: Robinhood Chain testnet launch ($1M dev program).
- Coinbase x402: network support; `specs/schemes/exact/scheme_exact_evm.md`.
