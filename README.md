<p align="center">
  <img src="https://txkit.dev/logo.svg" width="64" height="64" alt="txKit" />
</p>

<h1 align="center">txKit</h1>

<p align="center">
  Safe bridge between AI agents and Web3 transactions - open protocol + reference implementation.
</p>

<p align="center">
  Embeddable Web3 UI components for React + <a href="./spec/v0.1/prepared-transaction.md"><code>PreparedTransaction</code> spec</a> for AI / MCP tools.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@txkit/react"><img src="https://img.shields.io/npm/v/@txkit/react/alpha.svg" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@txkit/react"><img src="https://img.shields.io/bundlephobia/minzip/@txkit/react" alt="bundle size" /></a>
  <a href="https://github.com/txkit/mono/actions/workflows/ci.yml"><img src="https://github.com/txkit/mono/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/txkit/mono/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@txkit/react.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" />
</p>

---

> **v0.1.0-alpha** - published under the `alpha` npm tag while we refine the public surface. API may shift before v1.0.

## What is txKit?

txKit is a set of React components with built-in Web3 logic. Think **Stripe Elements, but for Web3** - drop in a component, get a production-ready UI with wallet connection, token balances, and transaction handling.

Works standalone or alongside **RainbowKit**, **AppKit**, **ConnectKit**, or any wagmi-based setup.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@txkit/react`](./packages/react) | React components and headless hooks | [![npm](https://img.shields.io/npm/v/@txkit/react.svg)](https://www.npmjs.com/package/@txkit/react) |
| [`@txkit/core`](./packages/core) | Framework-agnostic utilities and types | [![npm](https://img.shields.io/npm/v/@txkit/core.svg)](https://www.npmjs.com/package/@txkit/core) |
| [`@txkit/themes`](./packages/themes) | CSS themes (light, dark, variants) | [![npm](https://img.shields.io/npm/v/@txkit/themes.svg)](https://www.npmjs.com/package/@txkit/themes) |
| [`@txkit/tx-protocol`](./packages/tx-protocol) | Open protocol: `PreparedTransaction` types + zod schemas | [![npm](https://img.shields.io/npm/v/@txkit/tx-protocol.svg)](https://www.npmjs.com/package/@txkit/tx-protocol) |

## Quick Start

```bash
npm install @txkit/react@alpha @txkit/themes@alpha wagmi viem @tanstack/react-query
```

```tsx
import { TxKitProvider, ConnectWallet } from '@txkit/react'
import '@txkit/themes'
import { mainnet } from 'viem/chains'
import { http } from 'viem'

function App() {
  return (
    <TxKitProvider
      config={{
        chains: [ mainnet ],
        transports: { [mainnet.id]: http() },
      }}
    >
      <ConnectWallet />
    </TxKitProvider>
  )
}
```

### Peer Dependencies

| Package | Version |
|---------|---------|
| `react` / `react-dom` | >= 18 |
| `wagmi` | >= 2 |
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

- **ConnectWallet** - multi-wallet connection with ENS, balance display, chain switching
- **TokenBalance** - native + ERC-20 balance with fiat pricing and auto-formatting
- **TransactionButton** - multi-step transaction flow with simulation, approval, and anti-phishing
- **FlowSteps** / **FlowProgress** / **FlowToast** - compound components for transaction flow UI

Every component supports three customization levels:
1. **Zero-config** - drop in and it works
2. **Custom render** - `children` as render function for custom UI
3. **Headless hooks** - full control, bring your own UI

**Coming in v0.1.0:** `ContractForm` (ABI-driven form generation), `SwapWidget`, `StakingPanel`, `ApprovalManager`.

## Protocol

[`@txkit/tx-protocol`](./packages/tx-protocol) defines an open envelope + content shape flowing between **producers** (AI / MCP tools, DeFi protocol adapters) and **consumers** (wallets, signer orchestrators, UI preview layers, policy engines).

> _"OWS signs. txKit decides what's safe to sign."_

v0.1 covers three kinds today: `evm-tx` (single EVM transaction), `evm-batch` (EIP-5792 atomic batch), `signature` (EIP-712 / SIWE / personal-sign). Nine more are reserved: `evm-userop`, `evm-frame`, `evm-7702`, `mandate`, `intent`, `psbt`, `svm-tx`, `move-tx`, `cosmos-tx`.

- [**Spec v0.1**](./spec/v0.1/prepared-transaction.md) - canonical RFC
- [**Examples**](./examples/) - StakeWise deposit, Uniswap Permit2 + swap, Safe delegatecall warning
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
const result = validateEnvelope(envelope, { mode: 'strict' })
// See packages/tx-protocol/README.md for the full API
```

### Regulatory notice (MiCA / US frameworks)

`@txkit/tx-protocol` is a **presentational protocol** for human-readable transaction previews. Off-chain fields (`description`, `metadata`, `origin`, `risk`, `decoderRef`, `clearSigning`, `meta`) carry no cryptographic integrity guarantee on their own. Integrity comes from optional `producer.signature` covering the envelope (post-quantum schemes reserved) plus consumer-side decoder re-verification. The authoritative representation of on-chain effect is the raw `{chain, calls[*].to, calls[*].data, calls[*].value}` tuple (or `{scheme, domain, message}` for signatures). Under **EU MiCA** and similar frameworks, liability for transaction execution rests with the signing party (wallet / signer provider), not with txKit. This project does not custody keys, broker trades, or provide investment advice.

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
  core/         - Framework-agnostic types, utilities, constants
  react/        - React components and hooks
  themes/       - CSS themes and visual variants
  tx-protocol/  - Open PreparedTransaction protocol (types + zod schemas)
spec/
  v0.1/         - Canonical RFC for tx-protocol spec
examples/       - Runnable TypeScript examples
app/
  docs/         - Documentation site (Vocs)
  story/        - Component playground (Vite)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Documentation

Visit [txkit.dev](https://txkit.dev) for full documentation.

## License

[MIT](./LICENSE)
