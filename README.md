<p align="center">
  <img src="./logo.svg" width="64" height="64" alt="txKit" />
</p>

<h1 align="center">txKit</h1>

<p align="center">
  Safe bridge between AI agents and Web3 transactions - open protocol + reference implementation.
</p>

<p align="center">
  Embeddable Web3 UI components for React + <a href="./packages/tx-protocol/spec/v0.1/prepared-transaction.md"><code>PreparedTransaction</code> spec</a> for AI / MCP tools.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@txkit/react"><img src="https://img.shields.io/badge/npm-v0.1.0--alpha-blue.svg" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@txkit/react"><img src="https://img.shields.io/bundlephobia/minzip/@txkit/react" alt="bundle size" /></a>
  <a href="https://github.com/txkit/mono/actions/workflows/ci.yml"><img src="https://github.com/txkit/mono/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/txkit/mono/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@txkit/react.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" />
</p>

<p align="center">
  <a href="https://github.com/ethereum/ERCs/pull/1753"><img src="https://img.shields.io/badge/ERC--8265-Draft%20PR%20%231753-success.svg" alt="ERC-8265 PR" /></a>
  <a href="https://ethereum-magicians.org/t/prepared-transaction-envelope-off-chain-producer-to-wallet-handoff/28557"><img src="https://img.shields.io/badge/Ethereum%20Magicians-thread%2028557-blue.svg" alt="Magicians thread 28557" /></a>
  <a href="https://builder.ensgrants.xyz/grants/367"><img src="https://img.shields.io/badge/ENS%20Public%20Goods-grant%20%23367-purple.svg" alt="ENS PG #367" /></a>
</p>

> Reference implementation of [**ERC-8265 Prepared Transaction Envelope**](https://github.com/ethereum/ERCs/pull/1753) - a proposed open standard for pre-execution transaction validation between AI agents, MCP tools, and wallets. Apache-2.0 SDK shipped, ERC draft open in `ethereum/ERCs` (CI green), public discussion live on [Ethereum Magicians](https://ethereum-magicians.org/t/prepared-transaction-envelope-off-chain-producer-to-wallet-handoff/28557).

---

> **v0.1.0-alpha** - published under the `alpha` npm tag while we refine the public surface. API may shift before v1.0.

## What is txKit?

txKit is two things:

1. **`@txkit/tx-protocol`** - an open `PreparedEnvelope` shape for AI-initiated Web3 operations (decode, simulate, preview before signing). Composable with [MoonPay's Open Wallet Standard](https://github.com/open-wallet-standard/core).
2. **`@txkit/react`** - reference UI components that consume `PreparedEnvelope` to render confirmation flows, with full lifecycle handling for wallets, balances, transactions, and signatures.

**Core invariant:** txKit never holds keys. It is an orchestrator, not a signer - keys remain in the wallet, Safe, Turnkey, Privy, or any wagmi-compatible signer.

## Why txKit

- **Never holds keys.** Composes with any wagmi connector, RainbowKit / AppKit / ConnectKit, Privy / Dynamic, MoonPay OWS, Safe, Turnkey.
- **Shipped anti-phishing defenses.** Pre-sign simulation, MAX-approval warning, decoded calldata preview, configurable confirmation delay, pluggable risk provider (Blowfish / Blockaid).
- **Open envelope spec.** PreparedEnvelope shape with attack-defense fields for Drift, Bybit, Kelp, multicall bait, address poisoning. CAIP-2 / EIP-5792 / EIP-712 aligned.
- **Vendor-neutral.** Bring your own RPC, connectors, theme. No lock-in to a hosted RPC, wallet kit, or paymaster.
- **Composes, doesn't replace.** Embedded mode runs alongside your existing wagmi / RainbowKit / AppKit / ConnectKit / Privy setup - no duplicate providers.
- **WCAG 2.1 AA.** Focus management, keyboard nav, reduced-motion fallbacks, screen-reader announcements baked in.
- **Tiny.** 2-7 kB JS gzip per component. Tree-shaken on import.

## Arbitrum London Buildathon

Live submission to the [Arbitrum Open House London Buildathon](https://arbitrum-london.hackquest.io/) (deadline 14 June 2026). Multi-chain deployment surface:

| Chain | CAIP-2 | Role |
|-------|--------|------|
| Arbitrum Sepolia | `eip155:421614` | Primary L2 testbed |
| Robinhood Chain testnet | `eip155:46630` | Financial-grade L2 on Arbitrum Orbit, RWA-focused |
| Ethereum Mainnet / Sepolia | `eip155:1` / `eip155:11155111` | Reference + ENS resolution |

**Why pre-execution safety, why now.** The FCA + Bank of England [joint tokenization framework](https://www.pymnts.com/blockchain/2026/uk-regulators-unveil-blueprint-for-asset-tokenization-in-wholesale-markets/) (18 May 2026) and MiCA Phase 2 obligations on CASPs push agent-driven RWA workflows toward verifiable, audit-ready transaction routing. txKit decodes the envelope before signature - intent, allowance bounds, recipient allowlist, MEV risk - so agents and wallets approve or reject on the decoded picture, not the calldata bytes. Post-execution analysis catches losses after settlement; on tokenized stocks, ETFs, and on-chain bonds, settlement is final.

Live agent demo: [`examples/arbitrum-london/`](./examples/arbitrum-london/) - x402 producer + EIP-7702 signer + `TransactionButton` flow on Arbitrum Sepolia and Robinhood Chain testnet.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@txkit/react`](./packages/react) | React components and headless hooks | [![npm](https://img.shields.io/npm/v/@txkit/react.svg)](https://www.npmjs.com/package/@txkit/react) |
| [`@txkit/core`](./packages/core) | Framework-agnostic utilities and types | [![npm](https://img.shields.io/npm/v/@txkit/core.svg)](https://www.npmjs.com/package/@txkit/core) |
| [`@txkit/themes`](./packages/themes) | CSS themes (light, dark, variants) | [![npm](https://img.shields.io/npm/v/@txkit/themes.svg)](https://www.npmjs.com/package/@txkit/themes) |
| [`@txkit/tx-protocol`](./packages/tx-protocol) | Open protocol: `PreparedTransaction` types + zod schemas | [![npm](https://img.shields.io/npm/v/@txkit/tx-protocol.svg)](https://www.npmjs.com/package/@txkit/tx-protocol) |
| [`@txkit/tx-decoder`](./packages/tx-decoder) | Decode raw EVM calldata into clearSigning trees (ERC-7730 + ABI fallback) | [![npm](https://img.shields.io/npm/v/@txkit/tx-decoder.svg)](https://www.npmjs.com/package/@txkit/tx-decoder) |
| [`@txkit/ows-adapter`](./packages/ows-adapter) | Bridge MoonPay Open Wallet Standard <-> PreparedTransaction | [![npm](https://img.shields.io/npm/v/@txkit/ows-adapter.svg)](https://www.npmjs.com/package/@txkit/ows-adapter) |
| [`@txkit/x402-adapter`](./packages/x402-adapter) | Bridge x402 HTTP payments (Linux Foundation, 2 Apr 2026) <-> PreparedTransaction | [![npm](https://img.shields.io/npm/v/@txkit/x402-adapter.svg)](https://www.npmjs.com/package/@txkit/x402-adapter) |

## Quick Start

```bash
npm install @txkit/react@alpha @txkit/themes@alpha wagmi viem @tanstack/react-query
```

```tsx
import { TxKitProvider, ConnectWallet } from '@txkit/react'
import '@txkit/themes'
import { mainnet } from 'viem/chains'
import { http } from 'viem'

const App = () => (
  <TxKitProvider
    config={{
      chains: [ mainnet ],
      transports: { [mainnet.id]: http() },
    }}
  >
    <ConnectWallet />
  </TxKitProvider>
)
```

### Peer Dependencies

| Package | Version |
|---------|---------|
| `react` / `react-dom` | >= 18 |
| `wagmi` | >= 3 |
| `viem` | >= 2 |
| `@tanstack/react-query` | >= 5 |

If you're adding txKit to an existing dApp (RainbowKit, AppKit, etc.), you likely already have these installed.

## Add to Existing dApp

Already using RainbowKit or another wagmi-based connector? Use embedded mode:

```tsx
import { TxKitProvider, TransactionButton, txStep } from '@txkit/react'
import { parseEther } from 'viem'
import '@txkit/themes'

// Inside your existing WagmiProvider
function SendButton() {
  return (
    <TxKitProvider embedded>
      <TransactionButton
        steps={[
          txStep('send', 'Send ETH', { to: '0x...', value: parseEther('0.01') }),
        ]}
        label="Send 0.01 ETH"
      />
    </TxKitProvider>
  )
}
```

## Components (v0.1.0-alpha)

- **TxKitProvider** - root provider, wraps your app with wagmi + TanStack Query + theme tokens (standalone or embedded mode)
- **ConnectWallet** - multi-wallet connection with ENS, balance display, chain switching
- **TokenBalance** - native + ERC-20 balance with fiat pricing and auto-formatting
- **TransactionButton** - multi-step transaction flow with simulation, approval, and anti-phishing
- **FlowSteps** / **FlowProgress** / **FlowToast** - compound components for transaction flow UI

Every component supports three customization levels:
1. **Zero-config** - drop in and it works
2. **Custom render** - `children` as render function for custom UI
3. **Headless hooks** - full control, bring your own UI

**Coming in v0.2:** `<TxApproval />` (review-before-sign with decode + simulate + risk badges), `<AllowanceGrant />` (policy/limit grants for session keys, agent budgets, multisig spending policies), `<TxHistory />`, `<CollateralRiskBadge />`, ERC-7715 + Skyfire adapters.

## Protocol

[`@txkit/tx-protocol`](./packages/tx-protocol) defines an open envelope + content shape flowing between **producers** (AI / MCP tools, DeFi protocol adapters) and **consumers** (wallets, signer orchestrators, UI preview layers, policy engines).

> _"OWS signs. txKit decides what's safe to sign."_

v0.1 covers three kinds today: `evm-tx` (single EVM transaction), `evm-batch` (EIP-5792 atomic batch), `signature` (EIP-712 / SIWE / personal-sign). Nine more are reserved: `evm-userop`, `evm-frame`, `evm-7702`, `mandate`, `intent`, `psbt`, `svm-tx`, `move-tx`, `cosmos-tx`.

- [**Spec v0.1**](./packages/tx-protocol/spec/v0.1/prepared-transaction.md) - canonical RFC
- [**Examples**](./packages/tx-protocol/examples/) - 4 runnable TypeScript scenarios:

| Example | Pattern |
|---------|---------|
| [`stakewise-deposit.ts`](./packages/tx-protocol/examples/stakewise-deposit.ts) | Single EVM call (`evm-tx`) with attack-defense fields for protocol UI |
| [`uniswap-permit2-swap.ts`](./packages/tx-protocol/examples/uniswap-permit2-swap.ts) | EIP-5792 atomic batch (`evm-batch`) with Permit2 approval |
| [`safe-delegatecall-warning.ts`](./packages/tx-protocol/examples/safe-delegatecall-warning.ts) | Safe wallet delegatecall risk warning + decoded trace |
| [`multicall-batch.ts`](./packages/tx-protocol/examples/multicall-batch.ts) | Multicall-bait detection via attack-defense flags |
- [**OWS composition**](./app/docs/pages/protocol/ows.mdx) - how this composes with MoonPay Open Wallet Standard

```ts
import { createEvmTx, validateEnvelope } from '@txkit/tx-protocol'

const envelope = createEvmTx({
  chain: 'eip155:1',
  calls: [ { to: '0x...', data: '0x...', value: '0xde0b6b3a7640000' } ],
  validity: { notAfter: Math.floor(Date.now() / 1000) + 3600 },
  description: { short: 'Stake 1 ETH', action: 'stake' },
  metadata: { protocol: 'stakewise-v3', tokenMovements: [...], counterparties: [...] },
})
const result = validateEnvelope(envelope)
// See packages/tx-protocol/README.md for the full API
```

### Composes with (not competing with)

txKit is a **decode / preview / risk** layer. It sits between agents that produce intent and wallets that sign. Common neighbors:

- **[x402](https://www.x402.org)** (Linux Foundation, since 2 Apr 2026) - HTTP payment protocol for agents. Agents pay via x402, then need a tx legibility layer before any on-chain follow-up. txKit complements.
- **[Open Wallet Standard (OWS)](https://github.com/open-wallet-standard/core)** - key custody + raw-tx signing for agents. _OWS signs. txKit decides what's safe to sign._ See [OWS composition](./app/docs/pages/protocol/ows.mdx).
- **[Etherspot TransactionKit](https://www.npmjs.com/package/@etherspot/transaction-kit)** (v2.1.x) - headless ERC-4337 hooks (UserOp builders, paymaster config). Etherspot builds **how** to sign, txKit shows **what** is being signed. Complementary, not overlapping.
- **[21st.dev](https://21st.dev)** and similar generic AI-agent UI libraries - txKit is specialized for on-chain transaction UX, not generic agent UI. They can be used together.

### Why open protocol (not a service)

`@txkit/tx-protocol` is an **open Apache-2.0 spec + reference implementation**. There is no escrow, no per-tx fee, no proprietary verification SaaS in the signing path. The shape lives in your repo, your bundler, your audit. This is the deliberate trade-off vs closed verification services: composability and zero vendor lock-in over end-to-end SLA.

### Regulatory posture (US Covered UI Provider, EU MiCA)

txKit is a **non-custodial UI library and presentational protocol**. The component layer holds no keys, routes no orders, executes no trades. The protocol layer carries no cryptographic integrity on its off-chain fields by itself - integrity comes from the optional `producer.signature` over the envelope (post-quantum schemes reserved) plus consumer-side decoder re-verification. Authoritative on-chain effect is the raw `{chain, calls[*].to, calls[*].data, calls[*].value}` tuple (or `{scheme, domain, message}` for signatures).

- **United States.** Aligned with the SEC Division of Trading and Markets [Staff Statement of 13 April 2026](https://www.sec.gov/) on **Covered User Interface Providers** for non-custodial frontend tools (sunset 13 April 2031). For an independent legal interpretation see Jones Day, [_Crypto Interface Providers May Not Be Broker-Dealers_](https://www.jonesday.com/) (22 April 2026).
- **European Union.** Under MiCA and adjacent frameworks, liability for transaction execution rests with the signing party (wallet / signer provider), not with txKit. This project does not custody keys, broker trades, or provide investment advice.

This is positioning, not legal advice. Operators integrating txKit are responsible for their own jurisdiction analysis.

## Features

- Built on [wagmi](https://wagmi.sh) + [viem](https://viem.sh) - zero vendor lock-in, bring your own RPC
- **Anti-phishing** - calldata preview, bounded approvals, simulation, risk scoring
- **WCAG 2.1 AA** - focus traps, keyboard navigation, screen reader support, 44px touch targets
- CSS custom properties (`--txkit-*`) for full style control
- Light + dark themes with visual variants (soft, sharp, rounded)
- ESM + CJS + TypeScript declarations

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm dev              # Dev mode with watch
pnpm typecheck        # Type-check
pnpm lint             # Lint
```

## Project Structure

```
packages/
  core/           - Framework-agnostic types, utilities, constants
  react/          - React components and hooks
  themes/         - CSS themes and visual variants
  tx-protocol/    - Open PreparedTransaction protocol (types + zod schemas)
    spec/v0.1/    - Canonical RFC for the protocol
    examples/     - Runnable TypeScript examples
  tx-decoder/     - Calldata decoder (ERC-7730 + ABI fallback)
  ows-adapter/    - MoonPay Open Wallet Standard bridge
  x402-adapter/   - x402 HTTP payments bridge
app/
  docs/           - Documentation site (Vocs) - docs.txkit.dev
  landing/        - Marketing landing (Astro) - txkit.dev
  story/          - Component playground (Vite)
```

## Known limitations (v0.1.0-alpha)

- **ENS resolution requires mainnet.** ENS records live on Ethereum mainnet, so
  ConnectWallet's ENS name / avatar lookup is silently skipped on chains that
  don't expose a mainnet public client. The testnet preset injects mainnet
  alongside Sepolia for this reason. L2 / cross-chain ENS (CCIP-Read,
  ENSv2 namechain) is on the v0.2 roadmap.
- **CSS-only theming.** Themes ship as CSS classes (`.txkit-light`, `.txkit-dark`,
  `.txkit-soft`, etc). There's no runtime theme API yet; switch by toggling a
  class on the `.txkit-root` wrapper.
- **No SSR helpers.** Components are `'use client'`. Server rendering of
  static markup works, but hydration relies on wagmi's standard SSR config
  (`ssr: true` + `cookieStorage`).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Documentation

Visit [txkit.dev](https://txkit.dev) for full documentation.

## Recognition

- **Standard**: [ERC-8265 Prepared Transaction Envelope](https://github.com/ethereum/ERCs/pull/1753) - draft PR open in `ethereum/ERCs` since 13 May 2026 (CI green). Public discussion on [Ethereum Magicians thread 28557](https://ethereum-magicians.org/t/prepared-transaction-envelope-off-chain-producer-to-wallet-handoff/28557).
- **Public goods funding**: ENS [Public Goods Builder Grant #367](https://builder.ensgrants.xyz/grants/367) submitted 19 May 2026 (Stage 1, 2 ETH, `@txkit/tx-decoder` track). Drips + Optimism RetroPGF receivers configured in [`FUNDING.json`](./FUNDING.json).
- **Standards engagement**: Ethereum Foundation [Trillion Dollar Security Initiative](https://trilliondollarsecurity.org/) outreach 20 May 2026 - inquiry on funding pathways for pre-execution safety primitives.

## License

[MIT](./LICENSE)
