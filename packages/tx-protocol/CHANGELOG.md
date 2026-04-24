# @txkit/tx-protocol

## 0.1.0-alpha.1 - 2026-04-23

Alpha pre-release of the protocol shape, published without provenance
(the source repository is still private). Once the rest of the monorepo
opens up we will publish `0.1.0` on the `latest` dist-tag with an npm
provenance badge.

## 0.1.0 Defines the `PreparedEnvelope` shape for agent-to-wallet handoff, with three implemented kinds (`evm-tx`, `evm-batch`, `signature`) and nine reserved kinds for v0.1+ expansion.

### Shape

- **Envelope / content split.** `BaseEnvelope<K, C>` with stable envelope fields (`$schema`, `version`, `kind`, `id`, `issuedAt`, `expiresAt`, `nonce`, `producer`, `origin`, `content`, `risk`, `capabilities`, `meta`) and kind-specific `content`. Matches PSBT roles pattern; allows producer signing to cover the whole envelope.
- **Kind discriminator.** Implemented: `evm-tx`, `evm-batch`, `signature`. Reserved (strict validator rejects today; v0.1+ will add without breaking): `evm-userop`, `evm-frame`, `evm-7702`, `mandate`, `intent`, `psbt`, `svm-tx`, `move-tx`, `cosmos-tx`.
- **CAIP-2 chain identifiers.** `content.chain: "eip155:1"` is primary; `content.chainId: number` remains as a deprecated legacy alias for one release cycle.
- **`calls[]` unconditional.** Single tx is the degenerate case (`evm-tx` with `calls.length === 1`). Batches are `evm-batch` with length >= 2. Maps losslessly to EIP-5792.
- **Per-call `operation: 'call' | 'delegatecall'`.** First-class typed field. Validator emits a warning when `operation === 'delegatecall'` (Bybit $1.4B, UXLINK, Radiant lesson).
- **Per-call `capabilities`.** EIP-5792 aligned open record.
- **`validity: { notAfter, notBefore?, nonceKind?, blockhashRecency? }`.** `notAfter` REQUIRED for EVM tx content (Drift $285M dormant-tx lesson). `nonceKind` surfaces `durable` / `bitmap` patterns explicitly.
- **`description.action` closed enum + `'other'`.** 17 canonical actions. New additions via spec PR.
- **Rich `TokenMovement`.** `from` and `to` REQUIRED on every movement. `kind: 'transfer' | 'approve' | 'permit' | 'mint' | 'burn' | 'revoke'`. `isUnlimited?: boolean` flags MAX_UINT256 approvals. `standard: 'erc20' | 'erc721' | 'erc1155' | 'native'` + optional `tokenId` covers NFTs and semi-fungibles.
- **`Counterparty` with `role` and `labelSource`.** `role: 'recipient' | 'spender' | 'swap-venue' | 'pool' | 'bridge' | 'admin' | 'unknown'`; `labelSource: 'contact_book' | 'protocol_directory' | 'recent_interaction' | 'untrusted'`. Address-poisoning defense.
- **`FeeBreakdown` and `Estimation`.** Aligned with Vibekit / Morpho Agents output fields.
- **`kind: 'signature'`.** EIP-712 / personal-sign / SIWE with full `domain`, `types`, `primaryType`, `message`. Covers Permit, Permit2, CoW orders, UniswapX Dutch orders.
- **`Producer`.** Agent identity (`id` as DID / CAIP-10 / ERC-8004 / URL) with optional signature. `ProducerSignature.scheme` is an open enum covering `secp256k1`, `ed25519`, `p256` plus reserved post-quantum schemes `ml-dsa-44/65/87`, `slh-dsa-sha2-128s` (NIST FIPS 204/205).
- **`Origin: { url, verifyStatus, attestation? }`.** dApp binding to resist UI-spoofing (Ledger Connect Kit supply-chain lesson, WalletConnect phishing).
- **`RiskAssessment`.** Unbound slot for wallets and scanners (Blockaid / GoPlus / Blowfish common shape): `{ action, score?, warnings[], scanners[] }`.
- **`Capabilities`.** EIP-5792 open record: `atomicRequired`, `paymasterService`, ERC-7715 `permissions.context`, `requiresAccountType`.

### API

- `createEvmTx`, `createEvmBatch`, `createSignature` helpers pre-fill envelope fields.
- `validateEnvelope(input)`. Rejects unknown and reserved kinds with distinct error messages; no mode toggle in v0.1.
- Non-blocking advisories emitted on successful validation for unlimited approvals and delegatecall operations.
- `serialize(envelope)` / `deserialize(json)` for canonical JSON transport.
- `CALLS_STATUS` constant mirrors EIP-5792 status taxonomy: 100 pending, 200 confirmed, 400 off-chain failure, 500 reverted, 600 partially reverted.
- `IMPLEMENTED_KINDS`, `RESERVED_KINDS` constants.
- `SPEC_VERSION = '0.1'`, `SPEC_SCHEMA_URL` exposed.
- Zod schemas re-exported from the main entry (discriminated union + all sub-schemas); single export surface means tree-shaking handles unused schemas without a second subpath.

### Security

- Producer signature covers envelope bytes. Consumers SHOULD re-run decoders locally on `calls[*].data` and assert derived movements equal producer-claimed `metadata.tokenMovements`. Defense in depth.
- Unknown signature schemes treated as unsigned with warning, not hard block. Consumers MAY escalate.
- All off-chain fields (`description`, `metadata`, `origin`, `risk`, `decoderRef`, `clearSigning`, `meta`) are explicitly presentational. Policy engines MUST validate on raw `{chain, calls[*].to, calls[*].data, calls[*].value}`.

### Regulatory notice

`@txkit/tx-protocol` is a presentational protocol for human-readable transaction previews. It does not provide cryptographic integrity guarantees for off-chain data on its own (signatures and decoder re-verification provide the integrity layer). Under EU MiCA and similar frameworks, liability for transaction execution rests with the signing party (wallet / signer provider), not with txKit. This package does not custody keys, broker trades, or provide investment advice.

### Dependencies

Runtime: `zod ^3.23.8`. No peer dependencies. Zero UI deps (no React, wagmi, viem, or emotion in the dependency tree). Hex literal types (`0x${string}`) are defined locally.

### References

Driving standards: EIP-5792, ERC-7730, ERC-7579, ERC-7821, ERC-7715, EIP-4337 v0.7, EIP-7702, EIP-8141, CAIP-2/10/25/27. Driving incidents: Bybit $1.4B, Kelp DAO $293M, Drift $285M, 450K+ EIP-7702 drainers, Permit2 $55M DAI phishing, swap-as-drainer (Blockaid), address poisoning USENIX 2025.
