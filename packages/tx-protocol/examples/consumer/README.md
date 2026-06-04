# ERC-8265 consumer demo

A minimal, runnable reference for the **consumer** side of [ERC-8265 (Prepared
Transaction Envelope)](https://ethereum-magicians.org/t/erc-8265-prepared-transaction-envelope/28557).
It is standards-education code: it shows how a wallet, signer, or policy engine
re-verifies an envelope rather than trusting it.

## What it demonstrates

The specification's core consumer thesis (Spec §5.5, §7, and the Rationale
"Re-preparation at consumption time"):

> A consumer re-verifies an envelope against the RAW `calls[]` / signature
> content and its own policy, and NEVER trusts the presentational
> `description` / `metadata`.

`description.short` and `description.action` are presentational. A malicious or
compromised producer can prepare calldata that drains an account while
supplying a benign description. So every policy decision here is computed from
canonically-authoritative fields only:

- `calls[].operation`, `calls[].to`, `calls[].data`
- `validity.notAfter` / `expiresAt`
- `origin.verifyStatus`
- `producer.signature`

The engine never reads `description.short` or `description.action` when deciding.

### The adversarial case

The centerpiece fixture, `lyingDescriptionEnvelope`, carries a benign
description over a hostile raw call:

- `description.short` says **"Approve 100 USDC to Uniswap V3"** (`action: 'approve'`)
- the raw `calls[0]` is a **`delegatecall` to an unknown address**

A description-trusting consumer would allow it. This engine reads `calls[0]`,
sees a `delegatecall` to a target outside its allowlist, and **BLOCKs**. That is
the entire anti-spoof thesis (Spec Security Considerations, "Delegate-call
concealment") in one runnable case.

## Policy rules (all derived from raw fields)

| Rule | Source field(s) | Code | Decision |
|---|---|---|---|
| delegatecall to a target not in the allowlist | `calls[].operation` + `calls[].to` | `delegatecall-to-unknown` | BLOCK |
| unbounded approval (metadata flag OR raw `approve(spender, MAX_UINT256)`) | `tokenMovements[].isUnlimited` OR `calls[].data` | `unbounded-approval` | WARN |
| now past expiry | `validity.notAfter` | `expired` | BLOCK |
| origin attestation mismatch | `origin.verifyStatus === 'MISMATCH'` | `origin-mismatch` | BLOCK |
| origin not attested | `origin.verifyStatus === 'UNVERIFIED'` | `origin-unverified` | WARN |
| no producer signature | `producer.signature` absent | `unsigned-producer` | WARN |
| structurally invalid envelope | `validateEnvelope` fails | `schema-invalid` | BLOCK |

The engine first runs `validateEnvelope` from `@txkit/tx-protocol` (a consumer
that cannot parse the raw fields cannot trust anything), then evaluates the
rules above and returns the spec's consumer-injected `RiskAssessment`
(`{ action, warnings: [{ code, severity, message }] }`, Spec §7).

The delegatecall allowlist holds a single audited target (Safe
MultiSendCallOnly) as an illustration; a real consumer owns and maintains this
set.

## Files

- [`policy-engine.ts`](./policy-engine.ts) - `assessEnvelope(envelope, options)`: validate, then evaluate the raw rules into a `RiskAssessment`.
- [`fixtures.ts`](./fixtures.ts) - envelope factories mirroring the package examples, plus the adversarial lying-description envelope.
- [`run.ts`](./run.ts) - CLI that feeds each fixture through the engine and prints the decision + reasons, with the adversarial case rendered side by side.
- [`policy-engine.spec.ts`](./policy-engine.spec.ts) - the test suite (written first): clean transfer → ALLOW; delegatecall-to-unknown → BLOCK; lying description over raw delegatecall → BLOCK on raw; unbounded approval → WARN; expired → BLOCK; unsigned producer → WARN; origin MISMATCH/UNVERIFIED.

## Running

```bash
# from the repository root
pnpm install
pnpm --filter @txkit/tx-protocol build   # the demo imports the built package

# run the CLI (prints every decision + the adversarial spotlight)
pnpm exec tsx packages/tx-protocol/examples/consumer/run.ts

# run the tests
pnpm exec vitest run packages/tx-protocol/examples/consumer/policy-engine.spec.ts

# type-check the demo
pnpm exec tsc --noEmit -p packages/tx-protocol/examples/consumer/tsconfig.json
```

## See also

- [`../README.md`](../README.md) - the producer-side examples (constructing envelopes).
- [`../../README.md`](../../README.md) - `@txkit/tx-protocol` API reference.
