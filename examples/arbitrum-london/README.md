# txKit - Arbitrum London Buildathon demo

**Verify before you sign**, for AI-agent-initiated transactions. A Claude agent turns a
plain-English intent into an [ERC-8265](https://github.com/ethereum/ERCs/pull/1753) Prepared
Transaction Envelope. The user reviews a typed, decoded, fee-previewed summary. An on-chain
`AgentPolicyGate` enforces the policy - recipient allow-list, spend cap, replay protection, and
EIP-712 agent-signer binding - before anything executes.

- **Scenario A (live):** Pendle yield swap on Arbitrum Sepolia.
- **Scenario C (roadmap):** x402-paid RWA agent on Robinhood Chain testnet.

## Live on-chain

Real, verifiable artifacts - the AI Agentic category requires real tx hashes, not preview-only
flows. Machine-readable addresses live in [`contracts/deployed.json`](./contracts/deployed.json);
the tables below are the judge-facing copy, filled in after deploy (see [`DEPLOY.md`](./DEPLOY.md)).

### Arbitrum Sepolia - chainId 421614

| What | Value |
|---|---|
| AgentPolicyGate | [`0x3A9DaED4a43021df9adcF1d672F90014b25412A5`](https://sepolia.arbiscan.io/address/0x3A9DaED4a43021df9adcF1d672F90014b25412A5) (verified) |
| MockPendleRouter | [`0xf94aaba9c0ED6b29F12d3F4eBBA8290427B6A069`](https://sepolia.arbiscan.io/address/0xf94aaba9c0ED6b29F12d3F4eBBA8290427B6A069) (verified) |
| Agent-executed tx (`executeEnvelope`) | [`0x7392f88bb20b33ba180c851d6b6791903b7f5c3585366bd996c9fc6b1b5085c2`](https://sepolia.arbiscan.io/tx/0x7392f88bb20b33ba180c851d6b6791903b7f5c3585366bd996c9fc6b1b5085c2) |

Both contracts were deployed 2026-06-05 with **verified source on Arbiscan** (solc 0.8.34; gate [deploy tx](https://sepolia.arbiscan.io/tx/0x9fb2415cd46ab88f4ef8c8b510c6b5541ec08868f012f840b2cc07797cf67714), router [deploy tx](https://sepolia.arbiscan.io/tx/0x62829e10f6bc82b9dc0a5db97c79fe90601896dd522e3ad4adf0af313f956c5d)); the agent signer is `0xEC6613578be203e23e360A3985EA1601435D5907` and the router is allow-listed on the gate. The `executeEnvelope` tx above is a real `SmokeExecuteEnvelope` run (see [`DEPLOY.md`](./DEPLOY.md)) - same gate, same EIP-712 envelope the dApp signs; the `/flow-a` UI lands the same shape.

### Robinhood Chain testnet - chainId 46630 (sponsor bonus)

| What | Value |
|---|---|
| AgentPolicyGate | [`0x0d4E461d19788B0c2Bd72f527F2e43E1eea54d35`](https://explorer.testnet.chain.robinhood.com/address/0x0d4E461d19788B0c2Bd72f527F2e43E1eea54d35) |
| MockPendleRouter | [`0x637f00246A9aaC315580632D206f86701F3F99b0`](https://explorer.testnet.chain.robinhood.com/address/0x637f00246A9aaC315580632D206f86701F3F99b0) |
| Agent-executed tx (`executeEnvelope`) | [`0x9e551909082204669b0e2f44759d0d280dd8c985afb7a74b517ee412e4c5695c`](https://explorer.testnet.chain.robinhood.com/tx/0x9e551909082204669b0e2f44759d0d280dd8c985afb7a74b517ee412e4c5695c) |
| MockRwaRouter | pending deploy - see DEPLOY.md |

AgentPolicyGate and MockPendleRouter were deployed 2026-06-05 (solc 0.8.34; gate [deploy tx](https://explorer.testnet.chain.robinhood.com/tx/0x54764c3def25c5f6a0116a0dd069c1fb27ecd52891a9cdc5e04fa58a97e32ab1), router [deploy tx](https://explorer.testnet.chain.robinhood.com/tx/0x047037c7acb4deebbbc74cf9157c2b9a43d742e74264ba5819a85f9af20ee99a)); the agent signer is `0xEC6613578be203e23e360A3985EA1601435D5907` and the router is [allow-listed](https://explorer.testnet.chain.robinhood.com/tx/0x895b133fc37ba855c24bd99a51e3baa027e1c460a724c0eda6d2bd4ab28279ad) on the gate. The `executeEnvelope` tx above is a real `SmokeExecuteEnvelope` run - same gate, same EIP-712 envelope the dApp signs, full five-check path on-chain. Robinhood Chain (Arbitrum Orbit) runs the cancun/PUSH0 bytecode as-is; forge's EIP-3855 "might not work properly" warning is only a stale chain-id allowlist, not a runtime limit (and its `eth_estimateGas` under-reports CREATE cost, so deploys use `--gas-estimate-multiplier 300`).

MockRwaRouter is the Scenario C contract (RWA buy via x402-gated agent). Deploy with `forge script script/DeployRobinhoodTestnet.s.sol --broadcast` and fill `contracts/deployed.json` to activate the full RWA flow.

## What this proves

1. An autonomous agent **prepares** a transaction from natural-language intent (Claude tool use
   produces an ERC-8265 envelope).
2. The human **sees** a typed, decoded preview - function, arguments, sequencer-fee breakdown,
   expiry, policy verdict - before signing, not blind calldata.
3. An on-chain gate **enforces** the rules, so a rogue or compromised agent cannot move value
   outside policy. Five checks in `AgentPolicyGate.executeEnvelope`: forwarded value matches the
   declared value, envelope not already used, recipient allow-listed, value within the spend cap,
   and the EIP-712 signature recovers to the configured agent signer.

The verification layer - not agent autonomy - is the point. It scales to any agent and any
transaction.

## Run it

- **Deploy + capture tx hashes:** [`DEPLOY.md`](./DEPLOY.md) - one funded testnet key, copy-paste.
- **Local dev:** `pnpm dev`, then open `/flow-a`. Until the contracts are deployed the flow runs
  in preview mode (a banner explains, and the agent call is skipped so it spends nothing).
- **Contracts:** `cd contracts && forge test` (20 tests).

## Honest scope

- Scenario A is live end to end. The swap target is a deterministic `MockPendleRouter` (flat
  1:0.995, no token custody) so the gate path executes on a testnet without funding real input
  tokens - real plumbing, mock payload.
- Scenario C's UI is a placeholder; the backend wiring (x402 facilitator, buildRwaEnvelope,
  MockRwaRouter ABI) is implemented in this build. The policy-gate execution is proven on
  Robinhood Chain via the `SmokeExecuteEnvelope` script (same gate, same envelope shape, real tx).
  Deploy MockRwaRouter and update `contracts/deployed.json` to activate the full RWA flow.
