# AgentPolicyGate contracts

Minimum-viable smart contract for the txKit Arbitrum London Buildathon demo.

## Setup

```bash
cd examples/arbitrum-london/contracts
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge build
forge test
```

## Deployment

> Full copy-paste runbook (both chains, MockPendleRouter, allow-list, app wiring, smoke test): [`../DEPLOY.md`](../DEPLOY.md). The section below is the contracts-only quick reference.

Required environment (set via `.env` or inline):

- `DEPLOYER_PRIVATE_KEY` - owner key, signs deployment
- `AGENT_SIGNER_ADDRESS` - address authorised to sign envelopes
- `ARB_SEPOLIA_RPC_URL` - Arbitrum Sepolia RPC
- `ROBINHOOD_TESTNET_RPC_URL` - Robinhood Chain testnet RPC
- `ARBISCAN_API_KEY` - Arbiscan API key (verification on Arbitrum only)

Deploy:

```bash
# Arbitrum Sepolia
forge script script/DeployArbSepolia.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY

# Robinhood Chain testnet (no verification - explorer API not published)
forge script script/DeployRobinhoodTestnet.s.sol \
  --rpc-url robinhood_testnet \
  --broadcast
```

After deploy:

1. Update `contracts/deployed.json` with the deployed address + timestamp.
2. Sync the address into `packages/tx-decoder/src/registry/data/agent-policy-gate.json`.
3. In the Next.js app, import from `contracts/deployed.json` via `src/config/deployed.ts`.

## Scope notes (v0.1, demo only)

Out of scope for this demo - any of these would require an audit pass before mainnet:

- per-recipient spend limits (only a single global per-call cap)
- rolling-window aggregate spend tracking
- revocable allow-list with reason codes
- multi-signer thresholds
- pause / emergency stop
- upgradeability (deliberately immutable for the demo)
