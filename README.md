<p align="center">
  <img src="https://txkit.dev/logo.svg" width="64" height="64" alt="txKit" />
</p>

<h1 align="center">txKit</h1>

<p align="center">
  Embeddable Web3 UI components for React - connect wallets, display balances, send transactions.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@txkit/react"><img src="https://img.shields.io/npm/v/@txkit/react.svg" alt="npm version" /></a>
  <a href="https://github.com/txkit/mono/actions/workflows/ci.yml"><img src="https://github.com/txkit/mono/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/txkit/mono/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@txkit/react.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" />
</p>

---

## What is txKit?

txKit is a set of React components with built-in Web3 logic. Think **Stripe Elements, but for Web3** - drop in a component, get a production-ready UI with wallet connection, token balances, and transaction handling.

Works standalone or alongside **RainbowKit**, **AppKit**, **ConnectKit**, or any wagmi-based setup.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@txkit/react`](./packages/react) | React components and headless hooks | [![npm](https://img.shields.io/npm/v/@txkit/react.svg)](https://www.npmjs.com/package/@txkit/react) |
| [`@txkit/core`](./packages/core) | Framework-agnostic utilities and types | [![npm](https://img.shields.io/npm/v/@txkit/core.svg)](https://www.npmjs.com/package/@txkit/core) |
| [`@txkit/themes`](./packages/themes) | CSS themes (light, dark, variants) | [![npm](https://img.shields.io/npm/v/@txkit/themes.svg)](https://www.npmjs.com/package/@txkit/themes) |

## Quick Start

```bash
npm install @txkit/react @txkit/themes
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

## Components

- **ConnectWallet** - multi-wallet connection with ENS, balance display, chain switching
- **TokenBalance** - native + ERC-20 balance with fiat pricing and auto-formatting
- **TransactionButton** - multi-step transaction flow with simulation, approval, and anti-phishing
- **ContractForm** - ABI-driven form generation with validation and security warnings
- **FlowSteps** / **FlowProgress** / **FlowToast** - compound components for transaction flow UI

Every component supports three customization levels:
1. **Zero-config** - drop in and it works
2. **Custom render** - `children` as render function for custom UI
3. **Headless hooks** - full control, bring your own UI

## Features

- Built on [wagmi](https://wagmi.sh) + [viem](https://viem.sh) - no vendor lock-in
- CSS custom properties for full style control
- Tree-shakeable subpath imports (`@txkit/react/connect`, `/balance`, `/transaction`, `/contract`)
- WCAG 2.1 AA accessible
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
  core/      - Framework-agnostic types, utilities, constants
  react/     - React components and hooks
  themes/    - CSS themes and visual variants
app/
  docs/      - Documentation site (Vocs)
  story/     - Component playground (Vite)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Documentation

Visit [txkit.dev](https://txkit.dev) for full documentation.

## License

[MIT](./LICENSE)
