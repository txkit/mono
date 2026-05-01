# @txkit/core

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release covering shared utilities and types consumed by `@txkit/react` and downstream packages.

### Added
- `FlowStatus` type union with `canceled` status separate from `error` (neutral path on user reject vs. failure path)
- `StepStatus` type union with `canceled` (cascade-cancel after a sibling step fails)
- `TransactionErrorCode` (11 codes): `USER_REJECTED`, `INSUFFICIENT_FUNDS`, `SIMULATION_FAILED`, `EXECUTION_REVERTED`, `GAS_ESTIMATION_FAILED`, `NETWORK_ERROR`, `TIMEOUT`, `CHAIN_MISMATCH`, `APPROVAL_FAILED`, `RISK_BLOCKED`, `UNKNOWN`
- `classifyError` and `getErrorMessage` for structured error handling
- Utility functions: `cx`, `shortenAddress`, `formatTokenAmount`, `formatFiatAmount`, `deepEqual`, `getExplorerUrl`, `isMaxApproval`, `formatDecodedCalldata`, `pollUntil`, `copyToClipboard`
- Constants: `DEFILLAMA_PRICE_URL`, `FRANKFURTER_API_URL`, `CHAIN_TO_DEFILLAMA`, `NATIVE_PRICE_IDS`
- Error classes: `TxKitError`, `InvalidConfigError`, `ProviderNotFoundError`, `MissingWagmiProviderError`, `NestedProviderError`
- Types: `TransactionError`, `TransactionReceipt`, `DecodedCalldata`, `DecodedArg`, `RiskResult`
