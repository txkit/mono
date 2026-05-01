# @txkit/tx-decoder

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release. Decodes raw EVM calldata into `PreparedTransaction` clearSigning trees via ABI-based + ERC-7730 registry-based + 4byte-fallback dispatch.

- `decodeCall` API for ABI-based + registry-based + 4byte-fallback calldata decoding
- `buildRegistry` + `registryKey` helpers for in-memory ERC-7730 registry construction
- `BUILTIN_REGISTRY` empty starter (entries to be added as JSON files in subsequent releases)
- TypeScript types: `DecodedCall`, `DecodedArg`, `DecoderSource`, `RegistryDescriptor`, `DecodeCallOptions`, `DecodeCallInput`
- 5 vitest tests covering ETH transfer, ABI-prop, registry, 4byte fallback, unknown selector
- Zero React or wagmi dependencies. Depends on `viem` for ABI parsing and `@txkit/tx-protocol` for envelope types.
