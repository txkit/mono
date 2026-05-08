<p align="center">
  <img src="https://txkit.dev/logo.svg" width="64" height="64" alt="txKit" />
</p>

<h1 align="center">@txkit/react</h1>

<p align="center">
  React components for Web3 - connect, transact, display.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@txkit/react"><img src="https://img.shields.io/npm/v/@txkit/react/alpha.svg" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@txkit/react"><img src="https://img.shields.io/bundlephobia/minzip/@txkit/react" alt="bundle size" /></a>
  <a href="https://github.com/txkit/mono/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@txkit/react.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" />
</p>

---

> **v0.1.0-alpha** - core primitives and transaction flow are stable. v0.2 adds `<TxApproval />` (review-before-sign), `<AllowanceGrant />`, and `<TxHistory />`.

## Features

- Works with **RainbowKit**, **AppKit**, **ConnectKit**, or built-in `ConnectWallet`
- **TokenBalance** - native + ERC-20 with fiat pricing and auto-formatting
- **TransactionButton** - multi-step transaction flow with simulation + anti-phishing
- **FlowSteps / FlowProgress / FlowToast** - compound UI for active transaction flows
- Three customization levels: zero-config, custom render, headless hooks
- Built on [wagmi](https://wagmi.sh) + [viem](https://viem.sh) - no vendor lock-in
- CSS custom properties for full style control
- WCAG 2.1 AA - focus traps, keyboard navigation, 44px touch targets

## Install

```bash
npm install @txkit/react @txkit/themes
```

Peer dependencies: `react >= 18`, `wagmi >= 3`, `viem >= 2`, `@tanstack/react-query >= 5`.

## Quick Start

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

Already using RainbowKit, AppKit, or another wagmi-based connector? Use embedded mode - no need to replace your wallet connection:

```tsx
import { TxKitProvider, TransactionButton, txStep } from '@txkit/react'
import { parseEther } from 'viem'
import '@txkit/themes'

// Inside your existing WagmiProvider
function MyComponent() {
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

| Component | Description |
|-----------|-------------|
| [`ConnectWallet`](https://txkit.dev/docs/components/connect-wallet) | Multi-wallet connection with ENS, balance, chain switching |
| [`TokenBalance`](https://txkit.dev/docs/components/token-balance) | Native + ERC-20 balance display with fiat pricing |
| [`TransactionButton`](https://txkit.dev/docs/components/transaction-button) | Multi-step transaction flow with simulation and approval |
| `FlowSteps` / `FlowProgress` / `FlowToast` | Compound components for transaction flow UI |

## Headless Hooks

Every component has a corresponding headless hook for full control:

```tsx
import {
  useWalletState,
  useTokenBalance,
  useTokenBalances,
  useTokenPrice,
  useTransactionFlow,
  useFlowState,
} from '@txkit/react'
```

## Transaction Flow

Multi-step flows compose from `txStep`, `approveAndExecute`, `signAndSubmit` helpers:

```tsx
import { TransactionButton, FlowSteps, FlowToast, approveAndExecute } from '@txkit/react'
import { parseUnits } from 'viem'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

function SwapButton() {
  return (
    <>
      <TransactionButton
        steps={approveAndExecute({
          token: USDC,
          spender: '0xRouter...',
          amount: parseUnits('100', 6),
          tx: { to: '0xRouter...', data: '0x...' },
        })}
      />
      <FlowSteps />
      <FlowToast />
    </>
  )
}
```

## Documentation

Visit [txkit.dev](https://txkit.dev) for full documentation, guides, and examples.

## License

[MIT](./LICENSE)
