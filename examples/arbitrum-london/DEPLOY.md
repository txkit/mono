# Deploy runbook - txKit Arbitrum London Buildathon demo

Copy-paste deploy of the demo's on-chain pieces to Arbitrum Sepolia (scenario A, Pendle yield swap) and Robinhood Chain testnet (scenario C, x402-paid RWA buy). Both scenarios are live on both chains. Every command below is meant to be pasted as-is after you fill the env vars and the captured addresses.

Verified state (2026-06-08): `forge build` + `forge test` green (25 tests: 15 AgentPolicyGate + 5 MockPendleRouter + 5 MockRwaRouter incl. end-to-end gate->router integration tests), app `tsc --noEmit` + `next build` + 10 vitest clean. The deployed addresses + real tx hashes are in the README "Live on-chain" tables and `contracts/deployed.json`; this runbook reproduces them from a funded key you hold.

## What gets deployed

| Contract | Chain | Why | Verify on explorer |
|---|---|---|---|
| `AgentPolicyGate` | Arbitrum Sepolia (421614) | scenario A + C policy enforcement point | yes (Arbiscan) |
| `MockPendleRouter` | Arbitrum Sepolia (421614) | scenario A inner swap target | yes (Arbiscan) |
| `MockRwaRouter` | Arbitrum Sepolia (421614) | scenario C inner buy target (bonus proof) | yes (Arbiscan) |
| `AgentPolicyGate` | Robinhood Chain testnet (46630) | scenario A + C gate (sponsor chain) | no (explorer verifier API not published) |
| `MockPendleRouter` | Robinhood Chain testnet (46630) | scenario A inner target (proof) | no |
| `MockRwaRouter` | Robinhood Chain testnet (46630) | scenario C inner buy target (live /rwa-buy) | no |

Both scenarios are live: `buildPendleEnvelope` targets Arbitrum Sepolia (`/yield-swap`), `buildRwaEnvelope` targets Robinhood Chain (`/rwa-buy`, x402-gated). The RWA router was also deployed on Arbitrum as a bonus proof. See section 3d for the Robinhood RWA deploy and the Orbit gas gotcha.

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
export ARB_SEPOLIA_RPC_URL=https://arbitrum-sepolia-rpc.publicnode.com   # official sepolia-rollup.arbitrum.io can give tls-eof under load
export ROBINHOOD_TESTNET_RPC_URL=https://rpc.testnet.chain.robinhood.com  # NOTE host order: rpc.testnet, not testnet.rpc
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
forge test            # expect: 25 passed

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

Same shape as step 2 but on chainId 46630, no `--verify` (explorer verifier API not published).

**IMPORTANT - Orbit gas gotcha.** Robinhood's `eth_estimateGas` under-reports CREATE + L1-data cost, and `forge script` does NOT honour `--gas-estimate-multiplier` or `--gas-limit` here, so CREATE txs OOG at the raw estimate (observed gasUsed == gasLimit, status 0x0). Use `forge create --gas-limit` for contract deploys and `cast send --gas-limit` for state-changing calls; both honour the explicit limit (you only pay gasUsed). If a script-based deploy in 3a/3b OOGs, redo that contract with `forge create ... --gas-limit 3000000`.

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

### 3d. MockRwaRouter (scenario C, live /rwa-buy)

Deploy via `forge create` (not `forge script`) because of the Orbit gas gotcha above:

```bash
forge create src/MockRwaRouter.sol:MockRwaRouter \
  --rpc-url robinhood_testnet \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --gas-limit 3000000
export RWA_ROUTER_ROBINHOOD=0x...   # paste "Deployed to:"

# allow-list it on the gate (explicit gas)
cast send $GATE_ROBINHOOD "setAllowedRecipient(address,bool)" $RWA_ROUTER_ROBINHOOD true \
  --rpc-url robinhood_testnet --private-key $DEPLOYER_PRIVATE_KEY --gas-limit 300000
```

Bonus: the same `forge create` against `--rpc-url arbitrum_sepolia --verify --etherscan-api-key $ARBISCAN_API_KEY` deploys + verifies the RWA router on Arbitrum too (Arbitrum honours normal gas estimation; the explicit `--gas-limit` is harmless there). Capture it as `RWA_ROUTER_ARB` and allow-list on `GATE_ARB`.

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
    "421614": { "address": "<ROUTER_ARB>", "deployedAt": "...", "blockExplorer": "https://sepolia.arbiscan.io/address/<ROUTER_ARB>" },
    "46630": { "address": "<ROUTER_ROBINHOOD>", "deployedAt": "...", "blockExplorer": "https://explorer.testnet.chain.robinhood.com/address/<ROUTER_ROBINHOOD>" }
  },
  "MockRwaRouter": {
    "421614": { "address": "<RWA_ROUTER_ARB>", "deployedAt": "...", "blockExplorer": "https://sepolia.arbiscan.io/address/<RWA_ROUTER_ARB>" },
    "46630": { "address": "<RWA_ROUTER_ROBINHOOD>", "deployedAt": "...", "blockExplorer": "https://explorer.testnet.chain.robinhood.com/address/<RWA_ROUTER_ROBINHOOD>" }
  }
}

Also create `decoder-data/mock-rwa-router.json` (mirror `mock-pendle-router.json`: a `buy(address,bytes32,uint256)` descriptor with a `RwaPurchased` event + clear-signing labels) for both chains so the RWA inner call decodes as "Buy 5 TSLA" in the preview.
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
ARB_SEPOLIA_RPC_URL=https://arbitrum-sepolia-rpc.publicnode.com
ROBINHOOD_TESTNET_RPC_URL=https://rpc.testnet.chain.robinhood.com
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

Open `/yield-swap`, ask the agent to prepare a Pendle yield swap. Expect:

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

RWA buy (scenario C). On Robinhood, `forge script --broadcast` OOGs (Orbit gas gotcha), so dry-run to compute the signed calldata, then send it with `cast` (which honours `--gas-limit`). On Arbitrum the script broadcast is fine.

```bash
# Robinhood RWA buy (dry-run then cast send)
GATE_ADDRESS=$GATE_ROBINHOOD ROUTER_ADDRESS=$RWA_ROUTER_ROBINHOOD AGENT_SIGNER_PRIVATE_KEY=$AGENT_SIGNER_PRIVATE_KEY \
forge script script/SmokeRwaBuy.s.sol --rpc-url robinhood_testnet   # NO --broadcast (dry-run)
RWA_CALLDATA=$(python3 -c "import json;t=json.load(open('broadcast/SmokeRwaBuy.s.sol/46630/dry-run/run-latest.json'))['transactions'][0]['transaction'];print(t.get('input') or t.get('data'))")
cast send $GATE_ROBINHOOD "$RWA_CALLDATA" --rpc-url robinhood_testnet --private-key $DEPLOYER_PRIVATE_KEY --gas-limit 1500000

# Arbitrum RWA buy (script broadcast works)
GATE_ADDRESS=$GATE_ARB ROUTER_ADDRESS=$RWA_ROUTER_ARB AGENT_SIGNER_PRIVATE_KEY=$AGENT_SIGNER_PRIVATE_KEY \
forge script script/SmokeRwaBuy.s.sol --rpc-url arbitrum_sepolia --broadcast
```

The tx hash prints in the broadcast output and is saved to `broadcast/<Script>.s.sol/<chainId>/run-latest.json` under `transactions[0].hash` (for the cast-sent Robinhood RWA buy, the hash is in the `cast send` output). Paste both contract addresses and the tx hashes into the "Live on-chain" tables in `examples/arbitrum-london/README.md` - that is the verifiable proof judges check.

The gate enforces the prerequisites on-chain: a signer-pair mismatch reverts `InvalidSignature`, a missing allow-list reverts `RecipientNotAllowed`. If the script succeeds, the demo path is sound.

## Gotchas captured during scaffolding

- `MockPendleRouter` did not exist before 2026-05-29; the app referenced it but the contract + deploy script were missing. They are now in `contracts/src/MockPendleRouter.sol` + `contracts/script/DeployMockPendleRouter.s.sol`.
- The allow-list step (2c) is the single easiest thing to forget - the gate compiles and deploys fine without it, then reverts only at execute time.
- Signer-pair mismatch (step 1) fails the same way: silent until execute. Check it before you spend gas.
- Robinhood verify is intentionally skipped; do not pass `--verify` there or the broadcast errors out on a missing verifier.
- Orbit gas gotcha (Robinhood): `forge script` ignores `--gas-estimate-multiplier` and `--gas-limit` in Foundry 1.7.1, and `eth_estimateGas` under-reports CREATE/L1-data, so script-broadcast deploys OOG at the raw estimate. Fix: `forge create --gas-limit 3000000` for deploys, and for executeEnvelope-style calls run the smoke script as a dry-run (no `--broadcast`) then `cast send <gate> <calldata> --gas-limit 1500000`. `cast` honours the explicit limit.
- Robinhood RPC host is `rpc.testnet.chain.robinhood.com` (not `testnet.rpc...`). The public RPC is rate-limited; an Alchemy Robinhood key is more reliable for repeated calls.
