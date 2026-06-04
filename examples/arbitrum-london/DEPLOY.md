# Deploy runbook - txKit Arbitrum London Buildathon demo

Copy-paste deploy of the demo's on-chain pieces to Arbitrum Sepolia (scenario A, Pendle yield swap) and Robinhood Chain testnet (scenario C, gate only for now). Every command below is meant to be pasted as-is after you fill the env vars and the captured addresses.

Verified state at time of writing (2026-05-29): `forge build` + `forge test` green (20 tests: 15 AgentPolicyGate + 5 MockPendleRouter incl. an end-to-end gate->router integration test), app `tsc --noEmit` clean. The only thing standing between the repo and a live demo is this deploy, which needs a funded key you hold.

## What gets deployed

| Contract | Chain | Why | Verify on explorer |
|---|---|---|---|
| `AgentPolicyGate` | Arbitrum Sepolia (421614) | scenario A policy enforcement point | yes (Arbiscan) |
| `MockPendleRouter` | Arbitrum Sepolia (421614) | scenario A inner swap target | yes (Arbiscan) |
| `AgentPolicyGate` | Robinhood Chain testnet (46630) | multi-chain story; scenario C gate | no (explorer verifier API not published) |

Scenario C (RWA on Robinhood) does NOT need a router yet: `buildRwaEnvelope` still throws "not implemented" (lands Phase 2 Day 10), and `buildPendleEnvelope` hardcodes the router on Arbitrum Sepolia only. Deploy the Robinhood gate now purely for the "deployed on both chains" claim.

## 0. Prerequisites

Tooling (already present on this machine):

```bash
forge --version   # foundry
cast --version
```

Contract deps (already vendored under contracts/lib):

```bash
cd examples/arbitrum-london/contracts
ls lib   # expect: forge-std  openzeppelin-contracts
```

Environment. The forge/cast commands read these from the shell. Easiest path: create `contracts/.env` (foundry auto-loads `.env` from the dir you run `forge` in) or export them inline. Source the template at `examples/arbitrum-london/.env.example`:

```bash
# required for both chains
export DEPLOYER_PRIVATE_KEY=0x...          # funded on BOTH testnets
export AGENT_SIGNER_ADDRESS=0x...          # address the gate will trust
export AGENT_SIGNER_PRIVATE_KEY=0x...      # its private key (used by /api/agent)

# RPC + verify
export ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export ROBINHOOD_TESTNET_RPC_URL=https://testnet.rpc.chain.robinhood.com
export ARBISCAN_API_KEY=...                # only needed for --verify
```

Funds:

- Arbitrum Sepolia ETH: any ArbSepolia faucet (e.g. the Alchemy or QuickNode faucet) to `DEPLOYER_PRIVATE_KEY`'s address.
- Robinhood Chain testnet ETH: https://faucet.testnet.chain.robinhood.com

## 1. Pre-flight checks (do not skip)

Confirm the signer pair matches. The gate stores `AGENT_SIGNER_ADDRESS` in its constructor and recovers ECDSA signatures from `/api/agent`, which signs with `AGENT_SIGNER_PRIVATE_KEY`. A mismatch means every `executeEnvelope` reverts `InvalidSignature` AFTER deploy - silent until the demo runs.

```bash
# Must print exactly AGENT_SIGNER_ADDRESS
cast wallet address --private-key $AGENT_SIGNER_PRIVATE_KEY
```

Confirm tests green and balances funded:

```bash
cd examples/arbitrum-london/contracts
forge build
forge test            # expect: 20 passed

DEPLOYER=$(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)
cast balance $DEPLOYER --rpc-url arbitrum_sepolia
cast balance $DEPLOYER --rpc-url robinhood_testnet
```

## 2. Deploy to Arbitrum Sepolia

### 2a. AgentPolicyGate

```bash
forge script script/DeployArbSepolia.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY
```

Capture the printed `AgentPolicyGate deployed at:` address.

```bash
export GATE_ARB=0x...   # paste from console
```

### 2b. MockPendleRouter

```bash
forge script script/DeployMockPendleRouter.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY
```

```bash
export ROUTER_ARB=0x...   # paste from console
```

### 2c. Allow-list the router on the gate (REQUIRED)

`executeEnvelope` reverts `RecipientNotAllowed` if the inner target is not allow-listed. The inner target for scenario A is the router.

```bash
cast send $GATE_ARB "setAllowedRecipient(address,bool)" $ROUTER_ARB true \
  --rpc-url arbitrum_sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Spend limit: scenario A forwards `value = 0`, and `spendLimit` defaults to `0` (`value > spendLimit` is `0 > 0` = false, so it passes). You do NOT need `setSpendLimit` for the Pendle demo. Only set it if a future scenario forwards ETH:

```bash
# OPTIONAL - only if forwarding ETH later
cast send $GATE_ARB "setSpendLimit(uint256)" 1000000000000000000 \
  --rpc-url arbitrum_sepolia --private-key $DEPLOYER_PRIVATE_KEY
```

## 3. Deploy to Robinhood Chain testnet (sponsor bonus - real tx on a second chain)

Same shape as step 2 but on chainId 46630, no `--verify` (explorer verifier API not published as of 2026-05-26). Deploying the router here too lets `SmokeExecuteEnvelope` (step 7) land a real `executeEnvelope` tx on Robinhood - the only way to get a Robinhood tx hash while scenario C has no UI flow.

### 3a. AgentPolicyGate

```bash
forge script script/DeployRobinhoodTestnet.s.sol \
  --rpc-url robinhood_testnet \
  --broadcast
```

```bash
export GATE_ROBINHOOD=0x...   # paste from console
```

### 3b. MockPendleRouter

```bash
forge script script/DeployMockPendleRouter.s.sol \
  --rpc-url robinhood_testnet \
  --broadcast
```

```bash
export ROUTER_ROBINHOOD=0x...   # paste from console
```

### 3c. Allow-list the router on the gate (REQUIRED)

```bash
cast send $GATE_ROBINHOOD "setAllowedRecipient(address,bool)" $ROUTER_ROBINHOOD true \
  --rpc-url robinhood_testnet \
  --private-key $DEPLOYER_PRIVATE_KEY
```

## 4. Wire the addresses into the app

Three files carry `0x__PENDING__` / `0x000...0` placeholders. The app throws a clear "not deployed yet" error until they hold real addresses (the regex gate is `^0x[a-fA-F0-9]{40}$` with no "PENDING" substring).

### 4a. `contracts/deployed.json`

Replace all three entries:

```json
{
  "AgentPolicyGate": {
    "421614": {
      "address": "<GATE_ARB>",
      "deployedAt": "2026-05-29T00:00:00Z",
      "blockExplorer": "https://sepolia.arbiscan.io/address/<GATE_ARB>"
    },
    "46630": {
      "address": "<GATE_ROBINHOOD>",
      "deployedAt": "2026-05-29T00:00:00Z",
      "blockExplorer": "https://explorer.testnet.chain.robinhood.com/address/<GATE_ROBINHOOD>"
    }
  },
  "MockPendleRouter": {
    "421614": {
      "address": "<ROUTER_ARB>",
      "deployedAt": "2026-05-29T00:00:00Z",
      "blockExplorer": "https://sepolia.arbiscan.io/address/<ROUTER_ARB>"
    }
  }
}
```

### 4b. `decoder-data/agent-policy-gate.json`

Set the top-level `address` and drop "PENDING DEPLOY" from `label` on both entries (chain `eip155:421614` -> `GATE_ARB`, chain `eip155:46630` -> `GATE_ROBINHOOD`).

### 4c. `decoder-data/mock-pendle-router.json`

Set the single entry's `address` (chain `eip155:421614`) to `ROUTER_ARB` and drop "PENDING DEPLOY" from `label`.

### 4d. App env

Ensure `examples/arbitrum-london/.env.local` has:

```bash
ANTHROPIC_API_KEY=sk-ant-...
AGENT_SIGNER_PRIVATE_KEY=0x...   # SAME pair as the gate's agentSigner
ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ROBINHOOD_TESTNET_RPC_URL=https://testnet.rpc.chain.robinhood.com
```

## 5. Post-deploy verification

```bash
# Gate trusts the right signer (must equal AGENT_SIGNER_ADDRESS)
cast call $GATE_ARB "agentSigner()(address)" --rpc-url arbitrum_sepolia

# Router is allow-listed (must be true)
cast call $GATE_ARB "allowedRecipients(address)(bool)" $ROUTER_ARB --rpc-url arbitrum_sepolia

# Router conversion sanity (1_000_000 -> 995_000)
cast call $ROUTER_ARB "swapExactTokenForPt(address,address,uint256,uint256)(uint256)" \
  $(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY) \
  0x0000000000000000000000000000000000000001 1000000 0 \
  --rpc-url arbitrum_sepolia
```

## 6. Smoke test the demo

```bash
cd examples/arbitrum-london
pnpm dev   # http://localhost:3000
```

Open `/flow-a`, ask the agent to prepare a Pendle yield swap. Expect:

- no "not deployed yet" error,
- the envelope preview shows the outer call to `GATE_ARB` and the inner call to `ROUTER_ARB`,
- the decoded inner action reads as `swapExactTokenForPt(...)` via `decoder-data/mock-pendle-router.json`.

That is the recordable Loom path for scenario A.

## 7. Capture real tx hashes (required - AI Agentic category)

The UI sign button already lands a real `executeEnvelope` tx (the recordable Loom moment). For a reproducible, no-wallet artifact - and the only way to land a tx on Robinhood Chain, where scenario C has no UI yet - run the smoke script. It reproduces exactly what the dApp does: the agent signs an envelope, then it executes through the gate. The full path (deploy -> allow-list -> smoke tx) was rehearsed on a local anvil before shipping.

Arbitrum Sepolia:

```bash
cd examples/arbitrum-london/contracts
GATE_ADDRESS=$GATE_ARB ROUTER_ADDRESS=$ROUTER_ARB \
forge script script/SmokeExecuteEnvelope.s.sol --rpc-url arbitrum_sepolia --broadcast
```

Robinhood Chain testnet (bonus):

```bash
GATE_ADDRESS=$GATE_ROBINHOOD ROUTER_ADDRESS=$ROUTER_ROBINHOOD \
forge script script/SmokeExecuteEnvelope.s.sol --rpc-url robinhood_testnet --broadcast
```

The tx hash prints in the broadcast output and is saved to `broadcast/SmokeExecuteEnvelope.s.sol/<chainId>/run-latest.json` under `transactions[0].hash`. Paste both contract addresses and the tx hashes into the "Live on-chain" tables in `examples/arbitrum-london/README.md` - that is the verifiable proof judges check.

The gate enforces the prerequisites on-chain: a signer-pair mismatch reverts `InvalidSignature`, a missing allow-list reverts `RecipientNotAllowed`. If the script succeeds, the demo path is sound.

## Gotchas captured during scaffolding

- `MockPendleRouter` did not exist before 2026-05-29; the app referenced it but the contract + deploy script were missing. They are now in `contracts/src/MockPendleRouter.sol` + `contracts/script/DeployMockPendleRouter.s.sol`.
- The allow-list step (2c) is the single easiest thing to forget - the gate compiles and deploys fine without it, then reverts only at execute time.
- Signer-pair mismatch (step 1) fails the same way: silent until execute. Check it before you spend gas.
- Robinhood verify is intentionally skipped; do not pass `--verify` there or the broadcast errors out on a missing verifier.
