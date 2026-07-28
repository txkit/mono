# @txkit/react

## 0.1.0-alpha.5

### Patch Changes

- Wallet connect UX and client-SPA boot fixes.
  - `ConnectWallet` exposes a headless `WalletList`, so host apps can render the
    wallet picker inside their own sheet or modal.
  - New opt-in `cookiePersistence` config: persists the wagmi store to a cookie and
    hydrates it as `initialState`, so a client-only SPA reconnects on the first
    render instead of flashing the disconnected state.
  - The account dropdown now dismisses on capture-phase `pointerdown` instead of
    bubble-phase `mousedown`, so it closes when a react-aria (or other Pointer
    Events based) overlay opens. Previously two overlays could be open at once.
  - Connect skeleton settles its grace window once per app load.
  - Mask-icon fixes in the chain mismatch flow, wider dropdown and wallet gap.
  - `@txkit/themes` aligns its forced-colors skeleton fallback with `@txkit/react`.

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release.

### Components

- `TxKitProvider` - standalone and embedded modes (works with RainbowKit, AppKit, ConnectKit)
- `ConnectWallet` - multi-wallet connection with ENS, balance display, wrong chain detection
- `TokenBalance` - native and ERC-20 balance with fiat pricing via DeFiLlama
- `TransactionButton` - 10-state transaction lifecycle with simulation, ERC-20 approval flow, and anti-phishing UI

### Hooks

- `useWalletState` - headless wallet connection state
- `useTokenBalance` - single token balance (native + ERC-20)
- `useTokenBalances` - batch multi-token balances via multicall
- `useTokenPrice` - token USD price via DeFiLlama + fiat conversion
- `useTransactionState` - headless transaction lifecycle with simulation, approval, and risk assessment

### Features

- Three customization levels: zero-config, custom render function, headless hooks
- Single export surface: `@txkit/react`
- CSS custom properties for theming (`--txkit-*`)
- Full a11y: ARIA attributes, focus traps, keyboard navigation, screen reader support

### Added

- TokenBalance: optional retry icon button on error state when `onRetry` callback is provided
- TokenBalance: scales icon to 32px when `showFiat` enables a two-line layout
- (Story playground only) icon-source picker control for TokenBalance demos: None / Trust Wallet / 1inch / Custom URL

### Changed

- TokenBalance: error state shows token symbol next to dash placeholder (matches ready state width)
- TokenBalance: dash placeholder color in error state matches ready (amount = text, fiat = tertiary)
- FlowToast: cancelled flows render as neutral info toast with "Transaction canceled" copy
- TransactionButton: button click on cancelled flow triggers retry (same as rejected)
- FlowProgress: data-status="canceled" maps to neutral grey bar

### Fixed

- Themes cascade: primary tokens scoped to `:root` only - `.txkit-color-*` schemes no longer shadowed by inner TxKitProvider
