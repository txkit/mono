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

## Roadmap

The starter registry (`BUILTIN_REGISTRY`) is empty in v0.1.0-alpha. Targets for the JSON registry data:

- Uniswap v2 / v3 / v4 routers
- Aave v3 Pool
- Compound III Comet
- Lido / EigenLayer / StakeWise
- Permit2 (Uniswap)
- 1inch v6 aggregator
- Across v3 SpokePool
- Wormhole Core / Token Bridge
- Safe Multisig
- Chainlink CCIP

Each entry ships as a JSON file under `src/registry/data/` with ERC-7730 manifests for clear-signing rules.

## Status

Skeleton. Implementation lands progressively as JSON registry entries are populated. The decoder API surface is stable.

## License

[Apache-2.0](./LICENSE)
