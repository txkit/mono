# @txkit/tx-decoder

[![npm](https://img.shields.io/npm/v/@txkit/tx-decoder/alpha.svg)](https://www.npmjs.com/package/@txkit/tx-decoder)
[![license](https://img.shields.io/npm/l/@txkit/tx-decoder.svg)](https://github.com/txkit/mono/blob/main/LICENSE)

Decode raw EVM calldata into structured `DecodedCall` trees compatible with `@txkit/tx-protocol` `clearSigning` fields.

> **v0.1.0-alpha** - shape and surface may shift before v1.0.

## What it does

Takes an `EvmCall` (`{to, data, value}`) plus a chain ID, returns a `DecodedCall` with:

- function selector (first 4 bytes)
- resolved function name
- decoded arguments typed against an ABI
- optional ERC-7730 `clearSigning` rules

Lookup order:

1. inline `abi` option (highest priority)
2. registry entry for `(chain, to)` (loaded JSON descriptors)
3. async `fourByte` resolver fallback
4. unknown - selector only, no args

## Install

```bash
npm install @txkit/tx-decoder@alpha @txkit/tx-protocol@alpha viem
```

## Usage

```ts
import { decodeCall, buildRegistry } from '@txkit/tx-decoder'

const result = await decodeCall(
  {
    call: { to: '0x...', data: '0xa9059cbb...' },
    chain: 'eip155:1',
  },
  { abi: erc20Abi },
)

// {
//   selector: '0xa9059cbb',
//   functionName: 'transfer',
//   args: [
//     { name: 'to', type: 'address', value: '0x...' },
//     { name: 'amount', type: 'uint256', value: 1000000000000000000n },
//   ],
//   source: 'abi-prop',
// }
```

## Built-in registry (v0.1.0-alpha.4)

`BUILTIN_REGISTRY` ships with descriptors for the highest-volume mainnet + L2 contracts:

| Protocol | Coverage | Chains |
|---|---|---|
| ERC-20 standard (USDC / WETH / USDT) | transfer / approve / transferFrom / deposit / withdraw | Ethereum mainnet |
| Permit2 (Uniswap signed approvals) | permit (single-token variant) | Ethereum + Arbitrum + Base + Optimism + Polygon |
| Uniswap V3 SwapRouter02 | exactInputSingle / exactInput / exactOutputSingle / multicall | Ethereum + Arbitrum + Optimism + Polygon + Base |
| Aave V3 Pool | supply / withdraw | Ethereum + Arbitrum + Optimism + Polygon + Base |
| CoW Swap ETH Flow | createOrder / invalidateOrder (validated against StakeWise frontwise production) | Ethereum + Gnosis |
| AgentPolicyGate (Buildathon demo) | executeEnvelope + admin setters | Arbitrum Sepolia + Robinhood Chain testnet (placeholder addresses pending deploy) |

`~30 descriptors covering ~70% of typical mainnet DeFi calldata.` Each entry ships as a JSON file under `src/registry/data/` with ERC-7730-style clear-signing rules. Coverage will expand iteratively - open a PR with additional descriptors as new protocols ship.

## Roadmap

Next protocols on the registry queue (alpha.5+):

- Uniswap V2 + V4 routers
- Aave V3 Pool borrow / repay (with interest-rate-mode enum)
- Compound III Comet
- Lido / EigenLayer / StakeWise V3 vault generic ABI
- 1inch v6 aggregator
- Across v3 SpokePool
- Wormhole NTT Manager (osETH / SWISE)
- StakeWise LeverageStrategy V2 (Boost / Aave leverage)
- Safe MultiSig
- Chainlink CCIP
- Pendle V2 Router + MockPendleRouter on Arbitrum Sepolia

## Status

Functional with built-in registry. The decoder API surface is stable; registry data files are append-only and curated in PRs.

## License

[Apache-2.0](./LICENSE)
