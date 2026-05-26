---
"@txkit/tx-decoder": minor
"@txkit/core": patch
---

**tx-decoder MVP: BUILTIN_REGISTRY ships with ERC-7730-style descriptors**

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
