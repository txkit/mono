<p align="center">
  <img src="https://txkit.dev/logo.svg" width="64" height="64" alt="txKit" />
</p>

<h1 align="center">@txkit/core</h1>

<p align="center">
  Core utilities and types for txKit.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@txkit/core"><img src="https://img.shields.io/npm/v/@txkit/core/alpha.svg" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@txkit/core"><img src="https://img.shields.io/bundlephobia/minzip/@txkit/core" alt="bundle size" /></a>
  <a href="https://github.com/txkit/mono/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@txkit/core.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" />
</p>

---

> **v0.1.0-alpha** - stable utilities consumed by `@txkit/react`. Framework-agnostic, safe to use standalone.

## Overview

Framework-agnostic utilities, types, constants, and error classes used across the txKit ecosystem. Built on [viem](https://viem.sh), zero React dependency.

## Install

```bash
npm install @txkit/core viem
```

## API

### Utilities

- `cx(...args)` - conditional className utility
- `shortenAddress(address, chars?)` - truncate address to `0x1234...5678`
- `formatTokenAmount(value, decimals, options?)` - progressive token formatting
- `formatTokenAmountSplit(value, decimals, options?)` - split into integer/fraction parts
- `formatFiatAmount(value, currency?)` - fiat currency formatting
- `getExplorerUrl(chainId, hash, type?)` - block explorer link
- `classifyError(error)` - classify Web3 errors by type
- `getErrorMessage(code)` - human-readable error message
- `isMaxApproval(amount)` - check for MAX_UINT256 approval
- `formatDecodedCalldata(decoded)` - format decoded calldata for display
- `deepEqual(a, b)` - deep equality comparison
- `pollUntil(fn, options?)` - poll until truthy value or timeout
- `copyToClipboard(text)` - async clipboard write with fallback

### Constants

- `CHAIN_TO_DEFILLAMA` - chain ID to DeFiLlama platform mapping
- `NATIVE_PRICE_IDS` - native token price identifiers
- `DEFILLAMA_PRICE_URL` - DeFiLlama price API URL
- `FRANKFURTER_API_URL` - Frankfurter forex API URL

### Errors

- `TxKitError` - base error class with `docsPath` for documentation links
- `InvalidConfigError` - invalid provider configuration
- `ProviderNotFoundError` - component used outside TxKitProvider
- `MissingWagmiProviderError` - embedded mode without WagmiProvider

### Types

- `TransactionErrorCode` - categorized error codes
- `TransactionError` - structured transaction error
- `TransactionReceipt` - transaction receipt data
- `DecodedCalldata`, `DecodedArg` - decoded calldata types
- `RiskResult` - transaction risk assessment
- `StepStatus` - step state within a flow
- `FlowStatus` - overall flow state

## Documentation

Visit [txkit.dev](https://txkit.dev) for full documentation.

## License

[Apache-2.0](./LICENSE)
