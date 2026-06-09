# Scenario C (x402-paid RWA agent) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second buildathon scenario - an x402-paywalled agent that prepares a mock RWA stock purchase on Robinhood Chain testnet (46630), executed through the same `AgentPolicyGate`, with a real on-chain buy tx hash.

**Architecture:** Mirror Scenario A (Pendle) end to end. New `MockRwaRouter` (event-only mock, like `MockPendleRouter`) is the inner call; the outer call is `AgentPolicyGate.executeEnvelope` on 46630. A self-hosted x402 facilitator route gates the agent: real HTTP 402 + EIP-712 payment-authorization + real `verify`, with `settle` honestly stubbed on testnet. Verified on `anvil --chain-id 46630`; Mike deploys to real Robinhood after.

**Tech Stack:** Solidity 0.8.28 + Foundry, Next.js 15 (App Router, route handlers), viem (EIP-712 sign/recover), wagmi, zod, Anthropic SDK (claude-haiku-4-5).

**Design spec:** `examples/arbitrum-london/docs/scenario-c-design.md`. All paths below are relative to `examples/arbitrum-london/`.

**Spec refinement (locked here):** `MockRwaRouter` is an event-only deterministic mock (mirrors `MockPendleRouter`), so it verifies on anvil and needs no token funding. Moving real faucet stock tokens is an explicit out-of-scope Robinhood-only upgrade, not the spine.

**Reuse map (read these as templates):**
- Contract + test: `contracts/src/MockPendleRouter.sol`, `contracts/test/MockPendleRouter.t.sol`
- Envelope + sign: `src/agent/envelope-builder.ts` (`buildPendleEnvelope`), `src/agent/signing.ts`, `src/agent/policy-gate-abi.ts`
- Deployed config: `src/config/deployed.ts`, `contracts/deployed.json`
- Decoder: `decoder-data/mock-pendle-router.json`, `app/api/decode/route.ts`
- Deploy + smoke: `contracts/script/DeployRobinhoodTestnet.s.sol`, `contracts/script/SmokeExecuteEnvelope.s.sol`
- UI: `app/yield-swap/PendleAgentChat.tsx`, `app/yield-swap/SignEnvelopeActions.tsx`, `app/yield-swap/utils/*`
- Agent route: `app/api/agent/route.ts`

---

## Phase 1 - Contracts (TDD, anvil-verifiable)

### Task 1: MockRwaRouter contract

**Files:**
- Create: `contracts/src/MockRwaRouter.sol`
- Test: `contracts/test/MockRwaRouter.t.sol`

- [ ] **Step 1: Write the failing test** (`contracts/test/MockRwaRouter.t.sol`)

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";

import { AgentPolicyGate } from "../src/AgentPolicyGate.sol";
import { MockRwaRouter } from "../src/MockRwaRouter.sol";

contract MockRwaRouterTest is Test {
    MockRwaRouter internal router;
    address internal receiver;
    bytes32 internal ticker;

    function setUp() public {
        router = new MockRwaRouter();
        receiver = makeAddr("receiver");
        ticker = bytes32("TSLA");
    }

    function test_buy_recordsHolding() public {
        router.buy(receiver, ticker, 5);
        assertEq(router.holdings(receiver, ticker), 5, "holding should be credited");
    }

    function test_buy_accumulates() public {
        router.buy(receiver, ticker, 5);
        router.buy(receiver, ticker, 3);
        assertEq(router.holdings(receiver, ticker), 8, "holdings should accumulate");
    }

    function test_buy_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit MockRwaRouter.RwaPurchased(receiver, address(this), ticker, 5);
        router.buy(receiver, ticker, 5);
    }

    function test_revert_whenAmountZero() public {
        vm.expectRevert(MockRwaRouter.ZeroAmount.selector);
        router.buy(receiver, ticker, 0);
    }

    function test_integration_throughAgentPolicyGate() public {
        (address agentSigner, uint256 agentSignerKey) = makeAddrAndKey("agentSigner");
        address owner = makeAddr("owner");

        vm.prank(owner);
        AgentPolicyGate gate = new AgentPolicyGate(owner, agentSigner);
        vm.prank(owner);
        gate.setAllowedRecipient(address(router), true);

        bytes memory innerData = abi.encodeCall(MockRwaRouter.buy, (receiver, ticker, 5));
        bytes32 envelopeHash = keccak256("rwa-envelope-integration");
        uint256 value = 0;

        bytes32 structHash = keccak256(
            abi.encode(
                gate.EXECUTE_ENVELOPE_TYPEHASH(),
                envelopeHash,
                address(router),
                keccak256(innerData),
                value
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", gate.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        gate.executeEnvelope(envelopeHash, signature, address(router), innerData, value);

        assertTrue(gate.usedEnvelopes(envelopeHash), "envelope should be consumed");
        assertEq(router.holdings(receiver, ticker), 5, "buy should execute through the gate");
    }
}
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd contracts && forge test --match-contract MockRwaRouterTest`
Expected: FAIL - `MockRwaRouter` source not found.

- [ ] **Step 3: Implement `contracts/src/MockRwaRouter.sol`**

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

/**
 * @title MockRwaRouter
 * @notice Deterministic stand-in for an RWA brokerage router, used only by the
 *         txKit Arbitrum London Buildathon demo (scenario C) on Robinhood Chain
 *         testnet. It does NOT custody or transfer real tokens - it credits an
 *         internal holdings ledger and emits an event, so the agent ->
 *         AgentPolicyGate -> router call path executes end to end on a testnet
 *         (or anvil) without funding the caller with real stock tokens.
 *
 * @dev Out of scope (demo only): real token custody, settlement against the
 *      faucet-issued stock tokens, pricing, dividends. Moving real faucet
 *      TSLA/AMZN/PLTR is a Robinhood-only upgrade, not needed to demonstrate
 *      the envelope review-and-sign flow.
 */
contract MockRwaRouter {
    /// @notice receiver => ticker (bytes32) => accumulated mock holding.
    mapping(address receiver => mapping(bytes32 ticker => uint256 amount)) public holdings;

    error ZeroAmount();

    event RwaPurchased(
        address indexed receiver,
        address indexed caller,
        bytes32 indexed ticker,
        uint256 amount
    );

    /**
     * @notice Buy a mock RWA position.
     * @param receiver Address credited with the mock holding.
     * @param ticker Asset ticker as bytes32 (e.g. bytes32("TSLA")).
     * @param amount Whole-token quantity (mock units).
     */
    function buy(address receiver, bytes32 ticker, uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }
        holdings[receiver][ticker] += amount;
        emit RwaPurchased(receiver, msg.sender, ticker, amount);
    }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd contracts && forge test --match-contract MockRwaRouterTest -vv`
Expected: PASS (5 tests).

- [ ] **Step 5: Run full forge suite (no regressions)**

Run: `cd contracts && forge test`
Expected: PASS - prior 20 + 5 new.

- [ ] **Step 6: Commit**

```bash
git add contracts/src/MockRwaRouter.sol contracts/test/MockRwaRouter.t.sol
git commit -m "feat(example): add MockRwaRouter mock for scenario C"
```

### Task 2: Robinhood deploy (router + allow-list) and RWA smoke script

**Files:**
- Modify: `contracts/script/DeployRobinhoodTestnet.s.sol`
- Create: `contracts/script/SmokeRwaBuy.s.sol`

- [ ] **Step 1: Extend `DeployRobinhoodTestnet.s.sol` to deploy the router + allow-list it**

Replace the body of `run()` so it deploys the gate AND `MockRwaRouter`, then allow-lists the router on the gate (owner == deployer, so the broadcast can call `setAllowedRecipient`). Add `import { MockRwaRouter } from "../src/MockRwaRouter.sol";`. New `run()`:

```solidity
function run() external returns (AgentPolicyGate gate, MockRwaRouter router) {
    uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
    address agentSigner = vm.envAddress("AGENT_SIGNER_ADDRESS");
    address owner = vm.addr(deployerKey);

    vm.startBroadcast(deployerKey);
    gate = new AgentPolicyGate(owner, agentSigner);
    router = new MockRwaRouter();
    gate.setAllowedRecipient(address(router), true);
    vm.stopBroadcast();

    console2.log("AgentPolicyGate deployed at:", address(gate));
    console2.log("MockRwaRouter deployed at:", address(router));
    console2.log("Router allow-listed on gate. Owner:", owner);
    console2.log("Agent signer:", agentSigner);
    console2.log("Chain:", block.chainid);
}
```

- [ ] **Step 2: Create `SmokeRwaBuy.s.sol`** (mirror `SmokeExecuteEnvelope.s.sol`, RWA inner)

Copy `contracts/script/SmokeExecuteEnvelope.s.sol` to `SmokeRwaBuy.s.sol`, rename the contract to `SmokeRwaBuy`, and change the inner calldata block + constants:

```solidity
// constants (replace PT_PLACEHOLDER / AMOUNT_IN)
bytes32 private constant TICKER = bytes32("TSLA");
uint256 private constant AMOUNT = 5;

// inner action (replace the swapExactTokenForPt encode)
bytes memory innerData = abi.encodeWithSignature(
    "buy(address,bytes32,uint256)",
    receiver,
    TICKER,
    AMOUNT
);
```

Keep the rest identical (env vars `DEPLOYER_PRIVATE_KEY` / `AGENT_SIGNER_PRIVATE_KEY` / `GATE_ADDRESS` / `ROUTER_ADDRESS`, `gate.hashExecuteEnvelope` digest, `vm.sign`, broadcast). Update the doc comment to say scenario C / Robinhood.

- [ ] **Step 3: Build**

Run: `cd contracts && forge build`
Expected: clean (both scripts compile).

- [ ] **Step 4: Commit**

```bash
git add contracts/script/DeployRobinhoodTestnet.s.sol contracts/script/SmokeRwaBuy.s.sol
git commit -m "feat(example): deploy MockRwaRouter on robinhood + RWA smoke script"
```

---

## Phase 2 - Backend (TDD)

### Task 3: Fix Robinhood RPC URL (found via research)

**Files:**
- Modify: `src/chains/robinhoodTestnet.ts:17`
- Modify: `src/config/env.ts:27`

- [ ] **Step 1: Fix both occurrences** - `testnet.rpc.chain.robinhood.com` -> `rpc.testnet.chain.robinhood.com` (subdomain order). In `robinhoodTestnet.ts` the `rpcUrls.default.http[0]`; in `env.ts` the `ROBINHOOD_TESTNET_RPC_URL` default.

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @txkit/arbitrum-london-example exec tsc --noEmit` (or the example's `tsc --noEmit`)
Expected: 0 errors.

```bash
git add src/chains/robinhoodTestnet.ts src/config/env.ts
git commit -m "fix(example): correct robinhood testnet rpc host"
```

### Task 4: deployed.json + deployed.ts MockRwaRouter section

**Files:**
- Modify: `contracts/deployed.json`
- Modify: `src/config/deployed.ts`

- [ ] **Step 1: Add `MockRwaRouter` to `contracts/deployed.json`** (sibling of `MockPendleRouter`):

```json
"MockRwaRouter": {
  "46630": {
    "address": "0x__PENDING__",
    "deployedAt": null,
    "blockExplorer": "https://explorer.testnet.chain.robinhood.com/address/0x__PENDING__",
    "note": "Pending Mike deploy via forge script DeployRobinhoodTestnet.s.sol --broadcast (deploys gate + router + allow-list)"
  }
}
```

- [ ] **Step 2: Extend `src/config/deployed.ts`** - add `MockRwaRouter` to `DeployedMap`, then add three helpers mirroring the MockPendleRouter ones:

```typescript
// in DeployedMap type:
MockRwaRouter: Record<string, DeployedEntry>,

// new helpers (append):
export const getMockRwaRouterAddress = (chainId: number): `0x${string}` => {
  const entry = deployed.MockRwaRouter[String(chainId)]
  if (entry === undefined) {
    throw new Error(`MockRwaRouter not configured for chainId ${chainId}`)
  }
  if (!checkIsDeployed(entry)) {
    throw new Error(
      `MockRwaRouter on chainId ${chainId} is not deployed yet. ` +
      `Run forge script DeployRobinhoodTestnet.s.sol and update contracts/deployed.json.`,
    )
  }
  return entry.address as `0x${string}`
}

export const getMockRwaRouterExplorerUrl = (chainId: number): string => {
  const entry = deployed.MockRwaRouter[String(chainId)]
  if (entry === undefined) {
    throw new Error(`MockRwaRouter not configured for chainId ${chainId}`)
  }
  return entry.blockExplorer
}

export const checkIsMockRwaRouterDeployed = (chainId: number): boolean => {
  const entry = deployed.MockRwaRouter[String(chainId)]
  if (entry === undefined) {
    return false
  }
  return checkIsDeployed(entry)
}
```

- [ ] **Step 3: Typecheck + commit**

Run: example `tsc --noEmit`. Expected: 0 errors.

```bash
git add contracts/deployed.json src/config/deployed.ts
git commit -m "feat(example): add MockRwaRouter deployed config + helpers"
```

### Task 5: buildRwaEnvelope (TDD)

**Files:**
- Modify: `src/agent/envelope-builder.ts` (replace the `buildRwaEnvelope` throw stub)
- Test: `src/agent/buildRwaEnvelope.spec.ts`

- [ ] **Step 1: Write the failing test** (`src/agent/buildRwaEnvelope.spec.ts`)

```typescript
import { decodeFunctionData, hexToString } from 'viem'
import { describe, expect, it } from 'vitest'

import { buildRwaEnvelope } from './envelope-builder'

const RECEIVER = '0x1111111111111111111111111111111111111111' as const

// NOTE: requires MockRwaRouter + AgentPolicyGate addresses present in
// contracts/deployed.json for 46630. For the unit test we rely on the
// deployed.json placeholder being filled by a test fixture OR we assert the
// throw path until deployed. See Step 3 note.

describe('buildRwaEnvelope', () => {
  it('builds an evm-tx envelope with a MockRwaRouter.buy inner call', () => {
    const envelope = buildRwaEnvelope({ asset: 'TSLA', amount: 5 }, RECEIVER)

    expect(envelope.kind).toBe('evm-tx')
    expect(envelope.chain).toBe('eip155:46630')

    const inner = decodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'buy',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'ticker', type: 'bytes32' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      data: envelope.inner.data,
    })
    expect(inner.functionName).toBe('buy')
    expect(inner.args[0]).toBe(RECEIVER)
    expect(hexToString(inner.args[1] as `0x${string}`, { size: 32 })).toBe('TSLA')
    expect(inner.args[2]).toBe(5n)
    expect(envelope.inner.label).toContain('TSLA')
  })
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm exec vitest run src/agent/buildRwaEnvelope.spec.ts`
Expected: FAIL - builder throws "not implemented" (and/or MockRwaRouter not configured).

Note: this test needs a deployed MockRwaRouter address for 46630. Use a vitest fixture that writes a real-looking address into `contracts/deployed.json` for 46630 before the run, OR (simpler) seed `deployed.json` with valid-hex placeholder addresses for 46630 in BOTH `MockRwaRouter` (`0x000000000000000000000000000000000000aaaa`) and `AgentPolicyGate` (`0x000000000000000000000000000000000000bbbb`), which pass the existing `checkIsDeployed` regex (40 hex chars, no "PENDING"). Document that these are unit-test placeholders overwritten at deploy.

- [ ] **Step 3: Implement `buildRwaEnvelope`** in `src/agent/envelope-builder.ts` (replace the throwing stub). Mirror `buildPendleEnvelope` exactly; deltas: chain 46630, `getMockRwaRouterAddress`/`getAgentPolicyGateAddress(ROBINHOOD_TESTNET_CHAIN_ID)`, inner = `buy`, ticker via `stringToHex(args.asset, { size: 32 })`, amount `BigInt(args.amount)`, value 0.

```typescript
// add imports
import { encodeAbiParameters, encodeFunctionData, keccak256, stringToHex, type Hex } from 'viem'
import { ARBITRUM_SEPOLIA_CHAIN_ID, ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import { getAgentPolicyGateAddress, getMockPendleRouterAddress, getMockRwaRouterAddress } from '@/src/config/deployed'

const MOCK_RWA_ROUTER_ABI = [
  {
    type: 'function',
    name: 'buy',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'ticker', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

export const buildRwaEnvelope = (
  args: PrepareRwaBuyArgs,
  receiverAddress: `0x${string}`,
): DemoEnvelope => {
  const routerAddress = getMockRwaRouterAddress(ROBINHOOD_TESTNET_CHAIN_ID)
  const ticker = stringToHex(args.asset, { size: 32 })
  const amount = BigInt(args.amount)

  const innerCallData = encodeFunctionData({
    abi: MOCK_RWA_ROUTER_ABI,
    functionName: 'buy',
    args: [ receiverAddress, ticker, amount ],
  })
  const innerValueHex = '0x0' as `0x${string}`
  const innerLabel = `RWA: buy ${args.amount} ${args.asset} (mock router)`

  const inner = {
    to: routerAddress,
    data: innerCallData,
    value: innerValueHex,
    label: innerLabel,
  }

  const nonce = generateNonce()
  const envelopeHash = computeReplayEnvelopeHash(ROBINHOOD_TESTNET_CHAIN_ID, inner, nonce)
  const policyGateAddress = getAgentPolicyGateAddress(ROBINHOOD_TESTNET_CHAIN_ID)

  const outerCallData = encodeFunctionData({
    abi: AGENT_POLICY_GATE_ABI,
    functionName: 'executeEnvelope',
    args: [ envelopeHash, '0x' as Hex, inner.to, inner.data, BigInt(inner.value) ],
  })

  return {
    kind: 'evm-tx',
    chain: `eip155:${ROBINHOOD_TESTNET_CHAIN_ID}`,
    call: { to: policyGateAddress, data: outerCallData, value: innerValueHex },
    inner,
    meta: {
      envelopeHash,
      nonce: nonce.toString(),
      validity: { notAfter: Math.floor(Date.now() / 1000) + TWO_HOURS_SECONDS },
      builder: 'arbitrum-london-buildathon',
    },
  }
}
```

`attachAgentSignature` already reads the chainId from `envelope.chain`, so it works unchanged for 46630.

- [ ] **Step 4: Run, verify pass.** Run: `pnpm exec vitest run src/agent/buildRwaEnvelope.spec.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/agent/envelope-builder.ts src/agent/buildRwaEnvelope.spec.ts contracts/deployed.json
git commit -m "feat(example): implement buildRwaEnvelope for scenario C"
```

### Task 6: x402 payment-authorization sign + verify (TDD)

> **REUSE NOTE (decided 2026-06-04 after inspecting `@txkit/x402-adapter`):** Do NOT invent a standalone `PaymentAuthorization` type. The workspace package `@txkit/x402-adapter` already exports the canonical shapes `X402PaymentProof` / `X402Intent` + `attachX402Proof` / `attachX402Intent` / `extractX402`. The facilitator must PRODUCE an `X402PaymentProof` (its `paymentReceipt` field is documented as "Tx hash or signature receipt" - hold the EIP-712 signature there for the verify-only/stubbed-settle case; `paymentRequirementsHash` = the 402 challenge hash; map `chain` / `asset` / `amount` (hex) / `payee` / `paidAt`). Embed the proof in the RWA envelope via `attachX402Proof` so `EnvelopePreview` can surface it. The EIP-712 sign/verify crypto stays custom (the adapter does no crypto), but the data shapes are the canonical ones. This aligns Tasks 6/7/10/11 with the real package (precedent > invention) and demos `@txkit/x402-adapter`. The code blocks below still show the verify logic; swap the bespoke `PaymentAuthorization` for `X402PaymentProof` + a signed `X402Intent`-style challenge when implementing.

**Files:**
- Create: `src/x402/payment-authorization.ts` (EIP-712 sign + verify, producing `X402PaymentProof`)
- Test: `src/x402/payment-authorization.spec.ts`

- [ ] **Step 1: Write the failing test** (`src/x402/payment-authorization.spec.ts`)

```typescript
import { privateKeyToAccount } from 'viem/accounts'
import { describe, expect, it } from 'vitest'

import {
  X402_MERCHANT_ADDRESS,
  X402_REQUIRED_AMOUNT,
  signPaymentAuthorization,
  verifyPaymentAuthorization,
} from './payment-authorization'

const PAYER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const
const payer = privateKeyToAccount(PAYER_KEY).address

const buildAuth = (overrides: Partial<{ amount: bigint, validUntil: number }> = {}) => ({
  payer,
  payTo: X402_MERCHANT_ADDRESS,
  amount: overrides.amount ?? X402_REQUIRED_AMOUNT,
  nonce: ('0x' + '11'.repeat(32)) as `0x${string}`,
  validUntil: overrides.validUntil ?? Math.floor(Date.now() / 1000) + 600,
})

describe('payment authorization', () => {
  it('verifies a well-formed signed authorization', async () => {
    const auth = buildAuth()
    const signature = await signPaymentAuthorization(auth, PAYER_KEY)
    const result = await verifyPaymentAuthorization({ ...auth, signature })
    expect(result.ok).toBe(true)
  })

  it('rejects a signature from a different signer (recovered != payer)', async () => {
    const auth = buildAuth()
    const otherKey = ('0x' + '22'.repeat(32)) as `0x${string}`
    const signature = await signPaymentAuthorization(auth, otherKey)
    const result = await verifyPaymentAuthorization({ ...auth, signature })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('signer')
  })

  it('rejects an expired authorization', async () => {
    const auth = buildAuth({ validUntil: Math.floor(Date.now() / 1000) - 1 })
    const signature = await signPaymentAuthorization(auth, PAYER_KEY)
    const result = await verifyPaymentAuthorization({ ...auth, signature })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('expired')
  })

  it('rejects an underpayment', async () => {
    const auth = buildAuth({ amount: X402_REQUIRED_AMOUNT - 1n })
    const signature = await signPaymentAuthorization(auth, PAYER_KEY)
    const result = await verifyPaymentAuthorization({ ...auth, signature })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('amount')
  })
})
```

- [ ] **Step 2: Run, verify it fails.** Run: `pnpm exec vitest run src/x402/payment-authorization.spec.ts`. Expected: FAIL - module not found.

- [ ] **Step 3: Implement `src/x402/payment-authorization.ts`**

```typescript
import { recoverTypedDataAddress, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'


/**
 * Self-hosted x402 facilitator primitives for scenario C. We implement the
 * x402 `verify` step for real (EIP-712 payment authorization, signer recovery,
 * amount/expiry checks). `settle` is honestly stubbed on testnet - Coinbase's
 * facilitator does not support Robinhood Chain, so any x402 here is self-hosted
 * by definition. See docs/scenario-c-design.md.
 */

// Demo merchant that receives the (stubbed) x402 payment. Fixed for the demo.
// All-lowercase on purpose: viem rejects a mixed-case non-checksummed address.
export const X402_MERCHANT_ADDRESS = '0x000000000000000000000000000000000000c402' as const
// 0.1 "mock USDC" at 6 decimals.
export const X402_REQUIRED_AMOUNT = 100000n

const X402_DOMAIN = {
  name: 'txKit-x402',
  version: '1',
  chainId: ROBINHOOD_TESTNET_CHAIN_ID,
} as const

const PAYMENT_AUTHORIZATION_TYPES = {
  PaymentAuthorization: [
    { name: 'payer', type: 'address' },
    { name: 'payTo', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
    { name: 'validUntil', type: 'uint256' },
  ],
} as const

export type PaymentAuthorization = {
  payer: `0x${string}`,
  payTo: `0x${string}`,
  amount: bigint,
  nonce: `0x${string}`,
  validUntil: number,
}

export type VerifyResult = { ok: true } | { ok: false, reason: string }

export const signPaymentAuthorization = async (
  auth: PaymentAuthorization,
  signerPrivateKey: Hex,
): Promise<Hex> => {
  const account = privateKeyToAccount(signerPrivateKey)

  return account.signTypedData({
    domain: X402_DOMAIN,
    types: PAYMENT_AUTHORIZATION_TYPES,
    primaryType: 'PaymentAuthorization',
    message: {
      payer: auth.payer,
      payTo: auth.payTo,
      amount: auth.amount,
      nonce: auth.nonce,
      validUntil: BigInt(auth.validUntil),
    },
  })
}

export const verifyPaymentAuthorization = async (
  signed: PaymentAuthorization & { signature: Hex },
): Promise<VerifyResult> => {
  const { signature, ...auth } = signed

  if (auth.payTo.toLowerCase() !== X402_MERCHANT_ADDRESS.toLowerCase()) {
    return { ok: false, reason: 'payTo is not the demo merchant' }
  }
  if (auth.amount < X402_REQUIRED_AMOUNT) {
    return { ok: false, reason: 'amount is below the required payment' }
  }
  if (auth.validUntil <= Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: 'authorization expired' }
  }

  const recovered = await recoverTypedDataAddress({
    domain: X402_DOMAIN,
    types: PAYMENT_AUTHORIZATION_TYPES,
    primaryType: 'PaymentAuthorization',
    message: {
      payer: auth.payer,
      payTo: auth.payTo,
      amount: auth.amount,
      nonce: auth.nonce,
      validUntil: BigInt(auth.validUntil),
    },
    signature,
  })

  if (recovered.toLowerCase() !== auth.payer.toLowerCase()) {
    return { ok: false, reason: 'recovered signer does not match payer' }
  }

  return { ok: true }
}
```

- [ ] **Step 4: Run, verify pass.** Run: `pnpm exec vitest run src/x402/payment-authorization.spec.ts`. Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/x402/payment-authorization.ts src/x402/payment-authorization.spec.ts
git commit -m "feat(example): add x402 payment authorization sign + verify"
```

### Task 7: x402 facilitator route

**Files:**
- Create: `app/api/x402/route.ts`

- [ ] **Step 1: Implement the 402 challenge + verify handler.** GET returns the requirements; POST with a `PAYMENT-SIGNATURE` header verifies. Respond 402 + `PAYMENT-REQUIRED` when unpaid, 200 + `PAYMENT-RESPONSE` (settlement stubbed) when verified.

```typescript
import { NextResponse, type NextRequest } from 'next/server'

import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import {
  X402_MERCHANT_ADDRESS,
  X402_REQUIRED_AMOUNT,
  verifyPaymentAuthorization,
  type PaymentAuthorization,
} from '@/src/x402/payment-authorization'

export const runtime = 'nodejs'

const paymentRequired = () => ({
  scheme: 'exact',
  network: `eip155:${ROBINHOOD_TESTNET_CHAIN_ID}`,
  maxAmountRequired: X402_REQUIRED_AMOUNT.toString(),
  payTo: X402_MERCHANT_ADDRESS,
  asset: 'mock-USDC',
  description: 'Unlock the RWA agent on Robinhood Chain testnet',
})

export const GET = async () => {
  return NextResponse.json({ accepts: [ paymentRequired() ] }, { status: 402 })
}

export const POST = async (request: NextRequest) => {
  let body: (PaymentAuthorization & { signature: `0x${string}` }) | null = null
  try {
    body = (await request.json()) as PaymentAuthorization & { signature: `0x${string}` }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await verifyPaymentAuthorization({
    ...body,
    amount: BigInt(body.amount),
  })

  if (!result.ok) {
    return NextResponse.json(
      { accepts: [ paymentRequired() ], error: result.reason },
      { status: 402 },
    )
  }

  // settle stubbed on testnet - see docs/scenario-c-design.md
  return NextResponse.json({
    verified: true,
    settlement: 'stubbed-testnet',
    proof: { payer: body.payer, amount: body.amount.toString(), nonce: body.nonce },
  })
}
```

Note: `amount` arrives as a string over JSON; coerce with `BigInt`. The client sends the same `{ ...auth, amount: auth.amount.toString(), signature }` body to `/api/agent` so the server re-verifies.

- [ ] **Step 2: Typecheck + commit**

Run: example `tsc --noEmit`. Expected: 0 errors.

```bash
git add app/api/x402/route.ts
git commit -m "feat(example): add self-hosted x402 facilitator route"
```

### Task 8: Wire the rwa scenario in /api/agent

**Files:**
- Modify: `app/api/agent/route.ts`

- [ ] **Step 1: Add Robinhood cost-guard + x402 re-verify + RWA build/sign.** Changes:
  1. Import `ROBINHOOD_TESTNET_CHAIN_ID`, `buildRwaEnvelope`, `checkIsAgentPolicyGateDeployed`/`checkIsMockRwaRouterDeployed`, `getAgentPolicyGateAddress`, `verifyPaymentAuthorization`.
  2. Extend `AgentRequestBody` with `paymentProof?: PaymentAuthorization & { signature, amount: string }`.
  3. Add a cost-guard branch for `scenario === 'rwa'` mirroring the pendle one but for 46630 + `checkIsMockRwaRouterDeployed`.
  4. Before the Claude call (rwa only): require `paymentProof` and re-verify it; on failure return 402.
  5. Replace the `scenario !== 'pendle'` 501 block: when `scenario === 'rwa'` and the tool is `prepare_rwa_buy`, parse `prepareRwaBuyArgs`, `buildRwaEnvelope`, `signEnvelope({ ..., chainId: ROBINHOOD_TESTNET_CHAIN_ID, gateAddress: getAgentPolicyGateAddress(ROBINHOOD_TESTNET_CHAIN_ID) })`, `attachAgentSignature`, return. Import `prepareRwaBuyArgs` from tools.

Reference the existing pendle branch for the exact build/sign/return shape (lines ~198-276). The signing call is identical except `chainId`/`gateAddress` use `ROBINHOOD_TESTNET_CHAIN_ID`.

- [ ] **Step 2: Manual check** - typecheck + a curl against a running dev server (optional here; full path is exercised in the anvil rehearsal, Task 13).

Run: example `tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/agent/route.ts
git commit -m "feat(example): wire rwa scenario through the agent route"
```

---

## Phase 3 - UI + decoding

### Task 9: RWA decoder data + merge

**Files:**
- Create: `decoder-data/mock-rwa-router.json`
- Modify: `app/api/decode/route.ts`
- Modify: `src/ui/EnvelopePreview.tsx` (bytes32 ticker -> ASCII display)

- [ ] **Step 1: Create `decoder-data/mock-rwa-router.json`** (mirror `mock-pendle-router.json`, chain 46630, `buy` fn + `RwaPurchased` event + clearSigning):

```json
[
  {
    "chain": "eip155:46630",
    "address": "0x0000000000000000000000000000000000000000",
    "label": "MockRwaRouter (Buildathon, Robinhood Chain testnet - PENDING DEPLOY)",
    "abi": [
      {
        "type": "function",
        "name": "buy",
        "stateMutability": "nonpayable",
        "inputs": [
          { "name": "receiver", "type": "address" },
          { "name": "ticker", "type": "bytes32" },
          { "name": "amount", "type": "uint256" }
        ],
        "outputs": []
      }
    ],
    "clearSigning": {
      "buy": {
        "title": "Buy mock RWA (Robinhood Chain testnet)",
        "fields": {
          "receiver": "Recipient of the mock RWA holding",
          "ticker": "Asset ticker (bytes32, ASCII)",
          "amount": "Whole-token quantity (mock units)"
        }
      }
    }
  }
]
```

- [ ] **Step 2: Merge in `app/api/decode/route.ts`** - import `mockRwaRouterData`, add a `resolveDescriptors(mockRwaRouterData, 'MockRwaRouter')` entry to `exampleDescriptors`.

- [ ] **Step 3: Render bytes32 ticker as ASCII in `EnvelopePreview.tsx`** - where decoded arg values render, when `type === 'bytes32'` and the value is printable, show `hexToString(value, { size: 32 })` alongside the hex. Keep it a small, isolated helper.

- [ ] **Step 4: Typecheck + commit**

```bash
git add decoder-data/mock-rwa-router.json app/api/decode/route.ts src/ui/EnvelopePreview.tsx
git commit -m "feat(example): decode MockRwaRouter.buy with ascii ticker"
```

### Task 10: X402Paywall component

**Files:**
- Create: `app/rwa-buy/X402Paywall.tsx`

- [ ] **Step 1: Implement the paywall gate.** Props: `onUnlocked(proof)`. Fetches `GET /api/x402` to show requirements; on "Pay & unlock" builds a `PaymentAuthorization` (payer = connected address, payTo = merchant, amount = required, nonce = `crypto.randomUUID` hashed to bytes32, validUntil = now + 600), signs via wagmi `useSignTypedData`, POSTs to `/api/x402`, and on `{ verified: true }` calls `onUnlocked(proof)`. Mirror the visual style of `app/yield-swap` empty-state cards. Include: `role="status"` for pending, `role="alert"` for errors, focus-visible on the button. Honestly label "settlement stubbed on testnet".

The EIP-712 domain/types MUST match `src/x402/payment-authorization.ts` exactly (import the constants/types from there; keep the `signTypedData` config identical).

- [ ] **Step 2: Typecheck + commit**

```bash
git add app/rwa-buy/X402Paywall.tsx
git commit -m "feat(example): add x402 paywall gate for scenario C"
```

### Task 11: RwaAgentChat (mirror PendleAgentChat, gated)

**Files:**
- Modify: `app/rwa-buy/RwaAgentChat.tsx` (replace the 19-line stub)

- [ ] **Step 1: Implement, mirroring `app/yield-swap/PendleAgentChat.tsx`.** Deltas:
  - Local `isUnlocked` + `paymentProof` state; render `<X402Paywall onUnlocked={...} />` until unlocked, then the chat.
  - `handleSubmit` POSTs to `/api/agent` with `{ messages: next, scenario: 'rwa', receiverAddress: connectedAddress, paymentProof }`.
  - Empty-state hint: `Try: Buy 5 TSLA`.
  - Input `aria-label="Describe an RWA purchase"`, placeholder `Buy 5 TSLA...`.
  - Reuse `EnvelopePreview`, `SignEnvelopeActions`, `ChatMessage`, `fetchDecoded`, `formatChainLabel`/`formatExplorerBase`/`resolveReplyText` unchanged (already multi-chain).
  - `SequencerFeeRow` takes `chain={envelope.chain as ArbitrumChainId}`. CHECK whether `ArbitrumChainId` from `@txkit/arbitrum-adapter` includes 46630. If NOT, conditionally render the fee row only for Arbitrum chains (Robinhood omits it) - do not force-cast an unsupported chain id. Document the choice inline.

- [ ] **Step 2: Typecheck + commit**

```bash
git add app/rwa-buy/RwaAgentChat.tsx
git commit -m "feat(example): implement RwaAgentChat for scenario C"
```

### Task 12: rwa-buy honesty + deploy-pending banner

**Files:**
- Modify: `app/rwa-buy/page.tsx`
- Modify: `src/ui/DeployPendingBanner.tsx` (generalize for Robinhood) OR create a thin Robinhood variant

- [ ] **Step 1: Fix the false claim in `app/rwa-buy/page.tsx`** - the footer says x402 routes "are scaffolded but not wired" and labels the page a roadmap placeholder. Replace with accurate copy now that scenario C is live (mention the self-hosted x402 facilitator + stubbed settlement honestly).

- [ ] **Step 2: Show a deploy-pending banner for Robinhood** when `checkIsMockRwaRouterDeployed(46630)` / `checkIsAgentPolicyGateDeployed(46630)` is false. Generalize `DeployPendingBanner` to take a chainId + contract predicates, or add a small `rwa-buy` banner. Mirror the existing banner copy.

- [ ] **Step 3: Typecheck + commit**

```bash
git add app/rwa-buy/page.tsx src/ui/DeployPendingBanner.tsx
git commit -m "feat(example): honest rwa-buy copy + robinhood deploy-pending banner"
```

---

## Phase 4 - Verify + docs

### Task 13: anvil rehearsal + full verification + docs

**Files:**
- Modify: `DEPLOY.md`, `README.md`

- [ ] **Step 1: anvil rehearsal on chainId 46630.** In one terminal: `anvil --chain-id 46630`. Then, using the anvil dev keys (deployer acct0, agent signer acct1), deploy via `DeployRobinhoodTestnet.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` (set `DEPLOYER_PRIVATE_KEY`, `AGENT_SIGNER_ADDRESS`), capture gate + router addresses, then `SmokeRwaBuy.s.sol` with `GATE_ADDRESS`/`ROUTER_ADDRESS`/`AGENT_SIGNER_PRIVATE_KEY` (acct1 key) `--broadcast`. Confirm ONCHAIN EXECUTION SUCCESSFUL + a real local tx hash. This proves the gate->MockRwaRouter path on 46630 exactly as Mike will run it on real Robinhood.

- [ ] **Step 2: Full green gate.** Run, all must pass:
  - `cd contracts && forge test` (25 tests)
  - example `tsc --noEmit`
  - `pnpm exec vitest run` (buildRwaEnvelope + x402 specs)
  - `pnpm exec eslint app src`
  - `pnpm --filter @txkit/arbitrum-london-example build` (next build)
  - em-dash scan: `git diff main...HEAD | grep -nP '[\x{2014}\x{2013}]'` -> empty

- [ ] **Step 3: Update `DEPLOY.md`** - the Robinhood section now deploys gate + MockRwaRouter + allow-list in one script; add the `SmokeRwaBuy` capture step; note faucet (ETH + stock tokens) + Alchemy Robinhood RPC + the corrected host.

- [ ] **Step 4: Update `README.md`** - add scenario C to the "Live on-chain" tables (Robinhood gate + MockRwaRouter addresses + the buy tx hash, PENDING until Mike deploys). Describe the x402 paywall honestly (verify real, settle stubbed).

- [ ] **Step 5: Commit**

```bash
git add DEPLOY.md README.md
git commit -m "docs(example): scenario C deploy runbook + on-chain tables"
```

---

## Open risks / notes for the executor

- **`ArbitrumChainId` may not include 46630** (Task 11): if `SequencerFeeRow` rejects it, omit the fee row on Robinhood rather than force-casting.
- **buildRwaEnvelope unit test needs real-format addresses** in `deployed.json` for 46630 (Task 5): seed unit-test placeholders that pass `checkIsDeployed`, overwritten at deploy.
- **`@txkit/arbitrum-london-example` package name**: confirm the exact name in `package.json` before using it in `pnpm --filter` (adjust the verify commands).
- **Mike's external deps** (not blockers): faucet (ETH + stock tokens), Alchemy Robinhood key, real Robinhood deploy + `SmokeRwaBuy` -> paste hashes into README.
- **x402 replay store** is expiry-bounded only (single session); a durable nonce store is out of scope.
