---
"@txkit/tx-decoder": minor
"@txkit/core": patch
---

**tx-decoder MVP: BUILTIN_REGISTRY ships with ERC-7730-style descriptors**

The starter registry is no longer empty. `BUILTIN_REGISTRY` now contains roughly 30 contract / chain descriptors covering ~70% of typical mainnet DeFi calldata:

- ERC-20 standard - USDC, WETH, USDT (mainnet) with transfer / approve / transferFrom / deposit / withdraw
- Permit2 - mainnet + Arbitrum + Base + Optimism + Polygon (single-token permit variant)
- Uniswap V3 SwapRouter02 - mainnet + Arbitrum + Optimism + Polygon + Base (exactInputSingle / exactInput / exactOutputSingle / multicall)
- Aave V3 Pool - mainnet + Arbitrum + Optimism + Polygon + Base (supply + withdraw)
- CoW Swap ETH Flow - mainnet + Gnosis (validated against StakeWise frontwise production ABI)
- AgentPolicyGate - Arbitrum Sepolia + Robinhood Chain testnet (Buildathon demo, placeholder addresses pending Mike's deploy)

The decoder engine (`decodeCall`, `buildRegistry`, `registryKey`) is unchanged - this release only populates registry data. 14 prior tests + 15 new integration tests pass (29 total), with round-trip viem `encodeFunctionData` validation per protocol.

`@txkit/core` bump: added Robinhood Chain testnet (chainId 46630) to the EXPLORERS map.
