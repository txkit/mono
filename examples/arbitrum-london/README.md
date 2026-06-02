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
| AgentPolicyGate | [`0x__PENDING__`](https://sepolia.arbiscan.io/address/0x__PENDING__) |
| MockPendleRouter | [`0x__PENDING__`](https://sepolia.arbiscan.io/address/0x__PENDING__) |
| Agent-executed tx (`executeEnvelope`) | [`0x__PENDING__`](https://sepolia.arbiscan.io/tx/0x__PENDING__) |

### Robinhood Chain testnet - chainId 46630 (sponsor bonus)

| What | Value |
|---|---|
| AgentPolicyGate | [`0x__PENDING__`](https://explorer.testnet.chain.robinhood.com/address/0x__PENDING__) |
| MockPendleRouter | [`0x__PENDING__`](https://explorer.testnet.chain.robinhood.com/address/0x__PENDING__) |
| Agent-executed tx (`executeEnvelope`) | [`0x__PENDING__`](https://explorer.testnet.chain.robinhood.com/tx/0x__PENDING__) |

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
- Scenario C's UI is a placeholder; the policy-gate execution is still proven on Robinhood Chain
  via the `SmokeExecuteEnvelope` script (same gate, same envelope shape, real tx).
