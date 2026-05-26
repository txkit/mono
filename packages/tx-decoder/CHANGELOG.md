# @txkit/tx-decoder

## 0.1.0-alpha.4

### Minor Changes

- [`7b4f9bd`](https://github.com/txkit/mono/commit/7b4f9bd49c7f749d71ef6eb7fe03ee81985c57f0) Thanks [@mike-diamond](https://github.com/mike-diamond)! - **tx-decoder MVP: BUILTIN_REGISTRY ships with ERC-7730-style descriptors**

  The starter registry is no longer empty. `BUILTIN_REGISTRY` now contains 20 contract / chain descriptors across 6 mainstream protocols, covering high-volume mainnet + L2 DeFi calldata:
  - ERC-20 standard - USDC, WETH, USDT (mainnet) with transfer / approve / transferFrom / deposit / withdraw (3 descriptors)
  - Permit2 - mainnet + Arbitrum + Base + Optimism + Polygon (single-token permit variant, 5 descriptors)
  - Uniswap V3 SwapRouter02 - mainnet + Arbitrum + Optimism + Polygon + Base (exactInputSingle / exactInput / exactOutputSingle / multicall, 5 descriptors)
  - Aave V3 Pool - mainnet + Arbitrum + Optimism + Polygon + Base (supply + withdraw, 5 descriptors)
  - CoW Swap ETH Flow - mainnet + Gnosis (validated against StakeWise frontwise production ABI, 2 descriptors)

  The decoder engine (`decodeCall`, `buildRegistry`, `registryKey`) is unchanged - this release only populates registry data. 12 prior tests + 15 new integration tests pass (27 total), each round-tripped through viem `encodeFunctionData` per protocol.

  **Deliberately not in this release:**
  - The Buildathon `AgentPolicyGate` decoder data (Arbitrum Sepolia chainId 421614 + Robinhood Chain testnet chainId 46630) lives in `examples/arbitrum-london/decoder-data/` and is loaded by the example app only. Bundling it into `BUILTIN_REGISTRY` before the contract is deployed would register a placeholder zero-address descriptor in the public package - so it stays in `examples/` until deploy lands.
  - Pendle V2 Router decoder data is deferred to a follow-up: it depends on either real Arbitrum Sepolia deployments or the Buildathon `MockPendleRouter.sol` contract still being scaffolded.

  `@txkit/core` bump: added Robinhood Chain testnet (chainId 46630) to the EXPLORERS map.

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release. Decodes raw EVM calldata into `PreparedTransaction` clearSigning trees via ABI-based + ERC-7730 registry-based + 4byte-fallback dispatch.

- `decodeCall` API for ABI-based + registry-based + 4byte-fallback calldata decoding
- `buildRegistry` + `registryKey` helpers for in-memory ERC-7730 registry construction
- `BUILTIN_REGISTRY` empty starter (entries to be added as JSON files in subsequent releases)
- TypeScript types: `DecodedCall`, `DecodedArg`, `DecoderSource`, `RegistryDescriptor`, `DecodeCallOptions`, `DecodeCallInput`
- 5 vitest tests covering ETH transfer, ABI-prop, registry, 4byte fallback, unknown selector
- Zero React or wagmi dependencies. Depends on `viem` for ABI parsing and `@txkit/tx-protocol` for envelope types.
