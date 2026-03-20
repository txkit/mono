# @txkit/react

## 0.1.0

Initial release.

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
- Subpath imports: `@txkit/react/connect`, `@txkit/react/balance`, `@txkit/react/transaction`
- CSS custom properties for theming (`--txkit-*`)
- Full a11y: ARIA attributes, focus traps, keyboard navigation, screen reader support
