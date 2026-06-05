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
| AgentPolicyGate | [`0x8C696D9f12e83c9E36E9d64e973C064DF1ECe784`](https://sepolia.arbiscan.io/address/0x8C696D9f12e83c9E36E9d64e973C064DF1ECe784) |
| MockPendleRouter | [`0x92d8a5C349DF76aF764e91d6cb92101D2d8623C5`](https://sepolia.arbiscan.io/address/0x92d8a5C349DF76aF764e91d6cb92101D2d8623C5) |
| Agent-executed tx (`executeEnvelope`) | [`0x97ca441d66a1a934f94de1cde628cde145359f45e114270184894f35cadb9c3a`](https://sepolia.arbiscan.io/tx/0x97ca441d66a1a934f94de1cde628cde145359f45e114270184894f35cadb9c3a) |

Both contracts were deployed 2026-06-05 (gate [deploy tx](https://sepolia.arbiscan.io/tx/0xfddcde74bc449d37035820faf1ddd42ffe2d953c04e3a96641df3048fc319f1d), router [deploy tx](https://sepolia.arbiscan.io/tx/0x003637ee7cc10942bd51455256d6f07e2731c20c0f8e6b043d31bf6312a90bb1)); the agent signer is `0xEC6613578be203e23e360A3985EA1601435D5907` and the router is allow-listed on the gate. The `executeEnvelope` tx above is a real `SmokeExecuteEnvelope` run (see [`DEPLOY.md`](./DEPLOY.md)) - same gate, same EIP-712 envelope the dApp signs; the `/flow-a` UI lands the same shape.

### Robinhood Chain testnet - chainId 46630 (sponsor bonus)

| What | Value |
|---|---|
| AgentPolicyGate | [`0x03008A57b9f1FA575D891a26b70608381D1Ab19E`](https://explorer.testnet.chain.robinhood.com/address/0x03008A57b9f1FA575D891a26b70608381D1Ab19E) |
| MockPendleRouter | [`0xDCF04578bD2C379dc6BaD97bD21A37aC65F53D51`](https://explorer.testnet.chain.robinhood.com/address/0xDCF04578bD2C379dc6BaD97bD21A37aC65F53D51) |
| Agent-executed tx (`executeEnvelope`) | [`0xfe39ae63191998fb6af0c4fc9868aa7ad7b4c17a506f2f9a22ffee02f17fefcc`](https://explorer.testnet.chain.robinhood.com/tx/0xfe39ae63191998fb6af0c4fc9868aa7ad7b4c17a506f2f9a22ffee02f17fefcc) |

Both contracts were deployed 2026-06-05 (gate [deploy tx](https://explorer.testnet.chain.robinhood.com/tx/0x9dce4f1e054b1178d941b552b3d519781a043ae4d7f0636c538f40f63c2ead95), router [deploy tx](https://explorer.testnet.chain.robinhood.com/tx/0x78eab8464937b8dc29b5682179de1f20531b442428f2679f83967d35b6a54f61)); the agent signer is `0xEC6613578be203e23e360A3985EA1601435D5907` and the router is [allow-listed](https://explorer.testnet.chain.robinhood.com/tx/0x26f3b1015bdd2250cc86995dee807f534105a49ca940a35660c647341f438d6f) on the gate. The `executeEnvelope` tx above is a real `SmokeExecuteEnvelope` run - same gate, same EIP-712 envelope the dApp signs, full five-check path on-chain. Robinhood Chain (Arbitrum Orbit) runs the cancun/PUSH0 bytecode as-is; forge's EIP-3855 "might not work properly" warning is only a stale chain-id allowlist, not a runtime limit.

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
