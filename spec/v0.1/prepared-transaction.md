# txKit tx-protocol - Prepared Transaction Spec v0.1 (DEPRECATED)

> **DEPRECATED 2026-04-21.** This spec was superseded by [v0.2](../v0.2/prepared-transaction.md) before it was ever published to npm. v0.1 had three structural flaws (no integrity binding between `description` and `data`, incompatible with EIP-5792 batches, EVM-only `chainId`) that made it unsafe for production. See [v0.2 §0 "Why v0.2 (not v0.1.1)"](../v0.2/prepared-transaction.md#0-why-v02-not-v011) and the [research synthesis in wiki](https://github.com/mike-diamond/claude-wiki/blob/main/projects/txkit-tx-protocol-spec-v0.2-research-2026-04-21.md) for the full rationale.
>
> This file is retained as a historical design journal. Do not implement against it.

| | |
|---|---|
| **Status** | **DEPRECATED** (superseded by v0.2) |
| **Version** | 0.1 (unpublished) |
| **Canonical location** | `spec/v0.2/prepared-transaction.md` |
| **Reference implementation** | [`@txkit/tx-protocol@0.2.x`](../../packages/tx-protocol) on npm |
| **Last updated** | 2026-04-21 |

Open protocol for Web3 transactions prepared by AI / MCP tools and consumed by wallet / signer orchestrators. Defines the `PreparedTransaction` shape and the accompanying `tx-decoder` registry schema.

---

## Scope and guarantees

> **This is a presentational protocol.**
>
> `PreparedTransaction.description` is a human-readable summary produced by the sender (typically an MCP tool). It is **NOT** signed by the protocol, **NOT** attestable on-chain, and carries **no integrity guarantee**.
>
> The only authoritative representation of on-chain effects is the raw tuple `{chainId, to, data, value}`. Consumers **MUST** treat `description`, `metadata`, and `decoderRef` as UX hints, not as security boundaries.
>
> Policy engines, allowlists, and spend limits **MUST** validate on raw fields (`to`, `data`, `value`, decoded selector + args), **NOT** on the `description` string.
>
> A compromised producer can emit `{to: victim, data: transfer(victim, MAX_UINT)}` with `description.short: "Stake 1 ETH"`. The decoder layer (`@txkit/tx-decoder`) is the mitigation, not the description itself.

### Field-level guarantees

| Field | Guarantee | Rationale |
|---|---|---|
| `version` | enforced (literal `"0.1"`) | compatibility gate |
| `chainId`, `to`, `data`, `value` | enforced | authoritative on-chain effect |
| `description.short` | **presentational** (required) | minimum for confirmation UI |
| `description.long` | **presentational** | extended preview |
| `description.action` | **presentational hint** | UX categorization, not authorization |
| `metadata.protocol` | **presentational** | UI grouping |
| `metadata.tokenMovements` | **presentational** | minimum for policy engine - but MUST be cross-checked against decoded calldata |
| `metadata.counterparties` | **presentational** | address list - MUST be cross-checked against `to` and decoded args |
| `metadata.simulation` | **presentational hint** | advisory only; consumer SHOULD re-simulate |
| `sequence` | **presentational** | flow ordering hint |
| `decoderRef` | **presentational pointer** | lazy-load hint for registry |
| `extensions` | **opaque / untrusted** | namespaced escape hatch |

---

## Why an open spec (not just a function)

| Private `prepareTx()` function | Open spec |
|---|---|
| Single implementer | MCP in TypeScript, Python, Rust - all compatible |
| Breaking changes silently shipped | Versioned; breaking changes bump `version` |
| Per-implementation security audit | Audit once + conformance tests |
| No external incentive to support | Standard → network effects |
| Internal abstraction | Protocol (like WalletConnect) |

---

## Artifact 1 - Prepared Transaction shape

Minimum shape returned by any `prepare_*` MCP tool:

```typescript
interface PreparedTransaction {
  version: "0.1"

  // Authoritative on-chain effect (enforced)
  chainId: number
  to: `0x${string}`
  data: `0x${string}`
  value: bigint

  // Human-readable preview (presentational)
  description: {
    short: string                    // "Stake 1 ETH in Genesis Vault"
    long?: string
    action: ActionType               // UX categorization
  }

  // Policy inputs (presentational - cross-check against decoded calldata)
  metadata: {
    protocol: string                 // "stakewise-v3"
    primaryToken?: TokenMovement
    tokenMovements: TokenMovement[]
    counterparties: Address[]
    estimatedGas?: bigint
    simulation?: SimulationHint
  }

  // Multi-step flow hint (presentational)
  sequence?: {
    stepIndex: number
    totalSteps: number
    previousTxHashes?: `0x${string}`[]
  }

  // Registry pointer (presentational)
  decoderRef?: string                // "stakewise-v3/vault/deposit"

  // Namespaced extensions (opaque)
  extensions?: Record<string, unknown>
}

interface TokenMovement {
  token: Address | "native"
  symbol: string
  decimals: number
  amount: bigint
  direction: "in" | "out"            // from the user's perspective
  usdValue?: number
}

type ActionType =
  | "stake" | "unstake"
  | "swap" | "approve"
  | "mint" | "burn"
  | "claim" | "deposit" | "withdraw"
  | "delegate" | "transfer"
  | "other"
```

### Field design rationale

- **`to + data + value + chainId`** - minimum set for any wallet. Chain-agnostic within EVM.
- **`description`** - human MUST see "what will happen" before signing. Prompt-injection mitigation is the decoder cross-check, not this field.
- **`metadata.tokenMovements`** - structured movements enable policy engines ("LLM can sign tx with out ≤ 0.5 ETH/day"). REQUIRED and MUST be cross-checked.
- **`sequence`** - covers legacy EOA (two tx) and EIP-7702/4337 (batched). Presentational.
- **`decoderRef`** - lazy pointer into the registry; optional.

---

## Artifact 2 - Tx-decoder Registry schema

The decoder registry is a **content artifact**, not code. Public JSON registry contributed via PRs:

```jsonc
// registry/stakewise-v3/vault/deposit.json
{
  "protocol": "stakewise-v3",
  "protocolWebsite": "https://stakewise.io",
  "protocolAudit": ["ConsenSys 2024", "ChainSecurity 2024"],
  "contracts": {
    "1": {
      "0xAC0F906E433d58FA868F936E8A43230473652885": {
        "displayName": "Genesis Vault",
        "category": "liquid-staking",
        "trustLevel": "verified"
      }
    }
  },
  "methods": {
    "0x6e553f65": {
      "name": "deposit",
      "abi": "function deposit(uint256 assets, address receiver, address referrer)",
      "description": {
        "template": "Stake {assets.eth} ETH in {contract.displayName}",
        "longTemplate": "Deposits {assets.eth} ETH into {contract.displayName}. Mints vault shares. Earns ~{contract.currentApy}% APY."
      },
      "riskFlags": [],
      "confirmationType": "standard"
    }
  }
}
```

### Why registry is a public artifact

- **Collaborative contribution**: Lido / Rocket / Aave can PR their protocols → viral channel
- **Versioned**: `registry-v1.2.json` - semver
- **Offline-usable**: wallets can cache and display readable tx without internet
- **Standalone value**: `@txkit/tx-decoder` npm package is useful on its own

---

## Deliverables v0.1

1. **`spec/v0.1/prepared-transaction.md`** (this file) - RFC with motivation, examples, FAQ
2. **[`@txkit/tx-protocol`](../../packages/tx-protocol)** npm package - TypeScript types + zod schemas. No React, no wagmi, no UI deps
3. **Validation helper** - `validatePreparedTx(input)` in the package
4. **Serialize / deserialize** - JSON transport with `bigint` roundtrip
5. **Reference consumer** - `@txkit/react` `useExecutePreparedTx` hook (forthcoming)
6. **Reference producer** - `stakewise/llm-tools` `prepare_stake_tx` tool (PR after read-only MCP merge)

---

## Design principles

### 1. Minimalism

v0.1 **does NOT** cover:
- Multi-signature / social recovery
- Cross-chain bridge tx in a single `PreparedTransaction`
- Meta-transactions via relayers (sponsored tx)
- Every possible DeFi primitive

v0.1 **DOES** cover:
- Single chain, single or sequential tx
- Common actions (stake/swap/mint/burn/claim/deposit/withdraw)
- Basic token movements
- Human-readable description

This covers ~90% of DeFi staking/swap/mint/burn cases. Rest → v0.2+.

### 2. Extensibility via `extensions` field

Namespaced escape hatch (no spec bump needed for experimentation):

```typescript
extensions?: {
  "x-stakewise.vaultVersion"?: number
  "x-uniswap.route"?: string
  // ...
}
```

Consumers **MUST** treat extensions as opaque and untrusted.

### 3. Validation-first

Spec ships with runtime validators (zod schemas). Any consumer:

```ts
import { validatePreparedTx } from '@txkit/tx-protocol'
const result = validatePreparedTx(jsonFromMcp)
if (!result.ok) throw new Error(result.error)
```

Without validators, spec is just markdown. With validators, conformance is checkable in CI.

### 4. Security-first shape requirements

Required fields for safety:
- `description.short` - minimum for confirmation UI (presentational)
- `metadata.tokenMovements` - minimum for policy engine (presentational, cross-check required)
- `metadata.counterparties` - minimum for blacklist checks (cross-check required)

Producers **cannot** emit `{to, data, value}` without human-readable context. Schema rejects such shape.

### 5. Chain-agnostic

`chainId: number` - any EVM chain (mainnet, Gnosis, Arbitrum, Base, Optimism). Future `v0.2` may extend to non-EVM via discriminated union.

---

## Conformance tests (v0.1 release criteria)

- [x] Reference validator (`@txkit/tx-protocol`) passes ≥6 unit tests
- [ ] Reference producer (`stakewise/llm-tools`) implements `prepare_stake_tx` - **forthcoming**
- [ ] Reference consumer (`@txkit/react` hook) renders preview + delegates signing - **forthcoming**
- [ ] End-to-end demo: Claude Code → StakeWise MCP → hook → wallet signature (testnet) - **forthcoming**

---

## Open questions (for v0.2)

1. **Fee / slippage for swaps** - in the shape or in `extensions`?
2. **Multi-chain in one `PreparedTransaction`** - for bridge tx. Deferred to v0.2.
3. **Relative amounts** ("50% of my stake") - user intent; resolve before producer. Separate "intent shape" above prepared-tx?
4. **EIP-712 permits off-chain signatures** - separate shape or step 0 of `sequence`?
5. **ERC-8211 atomic batches** - when standard finalizes, add as `sequence.mode: "atomic"`.
6. **Non-EVM chains** - discriminated union on `chainId` namespace?

---

## Decision log

- **2026-04-17** - use `bigint` in shape (not string). Requires JSON serializer/deserializer, but type-safe. String in JSON, bigint in TS types after parsing.
- **2026-04-17** - `to` not optional → `PreparedTransaction` does not cover contract deployment. Deployment = separate shape (v0.2+).
- **2026-04-17** - `decoderRef` format `"{protocol}/{category}/{method}"`, path-like. Enables lazy-load of registry JSON.
- **2026-04-21** - `description`, `metadata`, `decoderRef`, `extensions` explicitly flagged as **presentational, no integrity guarantee**. Policy engines validate on raw `{to, data, value}`.

---

## Not normative

This is v0.1 of an evolving draft. Breaking changes bump the `version` field (e.g., `"0.2"`), **NOT** the semver-major of the npm package. Producers and consumers **MUST** gate behavior on the `version` field in each transaction.

See also:
- [`packages/tx-protocol/README.md`](../../packages/tx-protocol/README.md) - package API reference
- [OWS complementarity](../../app/docs/pages/protocol/ows.mdx) - how this spec composes with MoonPay Open Wallet Standard
- [`examples/stakewise-deposit.ts`](../../examples/stakewise-deposit.ts) - runnable example
