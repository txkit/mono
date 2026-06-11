# txKit - Arbitrum London Buildathon demo

[![ERC-8265 - Active Ethereum proposal (PR #1753)](https://img.shields.io/badge/ERC--8265-Active_Ethereum_proposal_(PR_%231753)-4338CA)](https://github.com/ethereum/ERCs/pull/1753)

## The problem

AI agents are starting to initiate real on-chain transactions, and the only thing between an
agent's plan and a user's funds is opaque hex calldata that nobody reads. One hallucinated
parameter, one poisoned prompt, or one leaked agent key turns autonomy into a wallet drainer, and
nothing on-chain stops it. Blind signing already produced the largest theft in crypto (Bybit,
$1.4B) with humans in the loop; autonomous agents make it the default failure mode unless
verification becomes a standard.

## The fix: verify before you sign

An AI agent turns a plain-English intent into an
[ERC-8265](https://github.com/ethereum/ERCs/pull/1753) Prepared Transaction Envelope - an open
standard authored by Mike Diamond (this submission) with txKit as its reference implementation.
The user reviews a typed, decoded, fee-previewed summary. An on-chain `AgentPolicyGate` enforces
the policy - recipient allow-list, spend cap, replay protection, and EIP-712 agent-signer
binding - before anything executes. Even a rogue or compromised agent cannot move value outside
the rules.

- **Scenario A (live):** Pendle yield swap on Arbitrum Sepolia (`/yield-swap`).
- **Scenario C (live):** x402-paid RWA stock buy on Robinhood Chain testnet (`/rwa-buy`).

> **Why Arbitrum.** The decoded preview is Arbitrum-native: the fee row splits the L2 execution
> fee from the L1 calldata-posting fee by reading `NodeInterface.gasEstimateComponents` (the 0xC8
> precompile) through `@txkit/arbitrum-adapter`. And because Robinhood Chain is an Arbitrum Orbit
> chain, the same envelope, gate, and decoder deployed there unchanged - one verification standard
> for the whole Orbit ecosystem, demonstrated live on two chains.

## Live on-chain

Real, verifiable artifacts - the AI Agentic category requires real tx hashes, not preview-only
flows. Machine-readable addresses live in [`contracts/deployed.json`](./contracts/deployed.json);
the tables below are the judge-facing copy. Both scenarios run on both chains: Pendle is the live
UI on Arbitrum (with a Robinhood proof tx), RWA is the live UI on Robinhood (with an Arbitrum
proof tx). Every `executeEnvelope` below returned status 0x1.

### Arbitrum Sepolia - chainId 421614

| What | Value |
|---|---|
| AgentPolicyGate | [`0x3A9DaED4a43021df9adcF1d672F90014b25412A5`](https://sepolia.arbiscan.io/address/0x3A9DaED4a43021df9adcF1d672F90014b25412A5) (verified) |
| MockPendleRouter | [`0xf94aaba9c0ED6b29F12d3F4eBBA8290427B6A069`](https://sepolia.arbiscan.io/address/0xf94aaba9c0ED6b29F12d3F4eBBA8290427B6A069) (verified) |
| MockRwaRouter | [`0xDe3cBf69877f08661152F945F11399e3F7912eA9`](https://sepolia.arbiscan.io/address/0xDe3cBf69877f08661152F945F11399e3F7912eA9) (verified) |
| Pendle `executeEnvelope` | [`0x7392f88bb20b33ba180c851d6b6791903b7f5c3585366bd996c9fc6b1b5085c2`](https://sepolia.arbiscan.io/tx/0x7392f88bb20b33ba180c851d6b6791903b7f5c3585366bd996c9fc6b1b5085c2) |
| RWA buy `executeEnvelope` (TSLA x5) | [`0xf29e0d9f82f59d79dc6f65bd481976ec9c9eb70db8119283d7eeb6e7fb6fd3ea`](https://sepolia.arbiscan.io/tx/0xf29e0d9f82f59d79dc6f65bd481976ec9c9eb70db8119283d7eeb6e7fb6fd3ea) |

Contracts deployed 2026-06-05 / 2026-06-08 with **verified source on Arbiscan** (solc 0.8.34). The
agent signer is `0xEC6613578be203e23e360A3985EA1601435D5907` and both routers are allow-listed on
the gate. Each `executeEnvelope` is a real `SmokeExecuteEnvelope` / `SmokeRwaBuy` run - the same
gate and the same EIP-712 envelope shape the dApp signs. Pendle is the live `/yield-swap` UI; the RWA
buy here is the bonus proof that the same envelope path generalises to a second action.

### Robinhood Chain testnet - chainId 46630 (sponsor)

| What | Value |
|---|---|
| AgentPolicyGate | [`0x0d4E461d19788B0c2Bd72f527F2e43E1eea54d35`](https://explorer.testnet.chain.robinhood.com/address/0x0d4E461d19788B0c2Bd72f527F2e43E1eea54d35) (verified) |
| MockPendleRouter | [`0x637f00246A9aaC315580632D206f86701F3F99b0`](https://explorer.testnet.chain.robinhood.com/address/0x637f00246A9aaC315580632D206f86701F3F99b0) (verified) |
| MockRwaRouter | [`0x3a57f2d32b1eBaa38AEB26957B3Cbc0fB7ee4c3C`](https://explorer.testnet.chain.robinhood.com/address/0x3a57f2d32b1eBaa38AEB26957B3Cbc0fB7ee4c3C) (verified) |
| Pendle `executeEnvelope` | [`0x9e551909082204669b0e2f44759d0d280dd8c985afb7a74b517ee412e4c5695c`](https://explorer.testnet.chain.robinhood.com/tx/0x9e551909082204669b0e2f44759d0d280dd8c985afb7a74b517ee412e4c5695c) |
| RWA buy `executeEnvelope` (TSLA x5) | [`0xff64404144bdaea4e08c94e973166af180b29fed621b1e3632757703e9b080fa`](https://explorer.testnet.chain.robinhood.com/tx/0xff64404144bdaea4e08c94e973166af180b29fed621b1e3632757703e9b080fa) |

Contracts deployed 2026-06-05 / 2026-06-08 with **verified source on the Robinhood explorer**
(Blockscout, solc 0.8.34); the agent signer is
`0xEC6613578be203e23e360A3985EA1601435D5907` and both routers are allow-listed on the gate. The RWA
buy on Robinhood is the live `/rwa-buy` UI; Pendle here is the proof tx. Robinhood Chain (Arbitrum
Orbit) runs the cancun/PUSH0 bytecode as-is - forge's EIP-3855 "might not work properly" warning is
a stale chain-id allowlist, not a runtime limit. Its `eth_estimateGas` under-reports CREATE and
L1-data cost and forge script does not honour its gas flags here, so the RWA router was deployed
with `forge create --gas-limit 3000000` ([deploy tx](https://explorer.testnet.chain.robinhood.com/tx/0x71d5845579675e88c1e3117c2b62c2cdbc95df811df4bfe4e53360b8ea0a8bca),
[allow-list tx](https://explorer.testnet.chain.robinhood.com/tx/0x24e05fdfa050524bb471d9bc5669ef2d55915afa34d65b2c4f3aec512911fd92))
and the RWA `executeEnvelope` was broadcast via `cast send --gas-limit` from the dry-run calldata.

## What this proves

1. An autonomous agent **prepares** a transaction from natural-language intent (an LLM tool-use
   loop produces an ERC-8265 envelope).
2. The human **sees** a typed, decoded preview - function, arguments, sequencer-fee breakdown,
   expiry, policy verdict - before signing, not blind calldata.
3. An on-chain gate **enforces** the rules, so a rogue or compromised agent cannot move value
   outside policy. Five checks in `AgentPolicyGate.executeEnvelope`: forwarded value matches the
   declared value, envelope not already used, recipient allow-listed, value within the spend cap,
   and the EIP-712 signature recovers to the configured agent signer.

The verification layer - not agent autonomy - is the point. It scales to any agent, any action
(yield swap, RWA buy), and any Arbitrum Orbit chain.

## Run it

- **Deploy + capture tx hashes:** [`DEPLOY.md`](./DEPLOY.md) - one funded testnet key, copy-paste.
- **Local dev:** `pnpm dev`, then open `/yield-swap` (Pendle, Arbitrum) or `/rwa-buy` (x402-paid RWA,
  Robinhood). Until the contracts are deployed a flow runs in preview mode (a banner explains, and
  the agent call is skipped so it spends nothing).
- **Contracts:** `cd contracts && forge test` (25 tests).

## Roadmap

- **Live now:** both flows above on Arbitrum Sepolia + Robinhood Chain testnet, executing through
  `AgentPolicyGate` (5 on-chain checks).
- **Next protocol targets:** decode + gate real Arbitrum One actions - Morpho and Aave positions
  first.
- **ERC-8265:** Draft under editor review on ethereum/ERCs
  ([PR #1753](https://github.com/ethereum/ERCs/pull/1753)), one editor reviewed, awaiting second.
  Target Last Call: Q4 2026.
- **Mainnet:** policy-gated agent transactions on Arbitrum One - target Q3 2027.

## Honest scope

- Scenario A is live end to end. The swap target is a deterministic `MockPendleRouter` (flat
  1:0.995, no token custody) so the gate path executes on a testnet without funding real input
  tokens - real plumbing, mock payload.
- Scenario C is live end to end on Robinhood Chain: an x402 paywall (real EIP-712 payment-auth
  verify with signer recovery; settlement honestly stubbed on testnet, no on-chain transfer), the
  agent prepares the RWA buy, and the gate executes it on-chain. The buy target is a deterministic
  `MockRwaRouter` (holdings ledger + `RwaPurchased` event, no real equity custody).
- x402 replay protection is expiry-bounded for the single demo session; a durable nonce store is
  out of scope.
