# @txkit/tx-protocol

## 0.2.0

First public npm release. Supersedes the unpublished v0.1 draft (see `spec/v0.1/prepared-transaction.md` for the deprecated historical shape).

### Why 0.2 not 0.1

v0.1 was redesigned before publication after a 3-agent deep-research pass (EIP landscape, production shapes + security incidents, future-proofing) plus 2 rounds of red-team self-critique. Three structural flaws forced the bump:

1. No integrity binding between `description` and `data`. A malicious MCP tool could claim "stake 1 ETH" while shipping `transfer(attacker, MAX)` in calldata and the shape had no way to detect it.
2. Incompatible with EIP-5792 `wallet_sendCalls`, ERC-7579 / 7821 modular batches, EIP-8141 frames, and ERC-4337 UserOperations. All use `calls[]`; v0.1 had single top-level `{to, data, value}`.
3. `chainId: number` is EVM-only. Coinbase x402 natively uses CAIP-2. AP2, Visa TAP, Mastercard Verifiable Intent, and every non-EVM MCP tool require `namespace:reference` chain ids.

### Added

- **Envelope / content split.** `BaseEnvelope<K, C>` with stable envelope fields (`$schema`, `version`, `kind`, `id`, `issuedAt`, `expiresAt`, `nonce`, `producer`, `origin`, `content`, `risk`, `capabilities`, `meta`) and kind-specific `content`. Matches PSBT roles pattern; allows producer signing that covers the whole envelope.
- **Kind discriminator.** Implemented: `evm-tx`, `evm-batch`, `signature`. Reserved (strict validator rejects today; v0.3+ will add without breaking): `evm-userop`, `evm-frame`, `evm-7702`, `mandate`, `intent`, `psbt`, `svm-tx`, `move-tx`, `cosmos-tx`.
- **CAIP-2 chain identifiers.** `content.chain: "eip155:1"` is primary; `content.chainId: number` remains as a deprecated legacy alias for one release cycle.
- **`calls[]` unconditional.** Single tx is the degenerate case (`evm-tx` with `calls.length === 1`). Batches are `evm-batch` with length >= 2. Maps losslessly to EIP-5792.
- **Per-call `operation: 'call' | 'delegatecall'`.** First-class field. Validator emits a warning when `operation === 'delegatecall'` (Bybit $1.4B, UXLINK, Radiant lesson).
- **Per-call `capabilities`.** EIP-5792 aligned open record.
- **`validity: { notAfter, notBefore?, nonceKind?, blockhashRecency? }`.** `notAfter` is REQUIRED for EVM tx content (Drift $285M dormant-tx lesson). `nonceKind` surfaces `durable` / `bitmap` patterns explicitly.
- **`description.action` closed enum + `'other'`.** 17 canonical actions. New additions via spec PR.
- **Rich `TokenMovement`.** `from` and `to` REQUIRED on every movement. `kind: 'transfer' | 'approve' | 'permit' | 'mint' | 'burn' | 'revoke'`. `isUnlimited?: boolean` flags MAX_UINT256 approvals. `standard: 'erc20' | 'erc721' | 'erc1155' | 'native'` + optional `tokenId` covers NFTs and semi-fungibles.
- **`Counterparty` with `role` and `labelSource`.** `role: 'recipient' | 'spender' | 'swap-venue' | 'pool' | 'bridge' | 'admin' | 'unknown'`; `labelSource: 'contact_book' | 'protocol_directory' | 'recent_interaction' | 'untrusted'`. Address-poisoning defense.
- **`FeeBreakdown` and `Estimation`.** Aligned with Vibekit / Morpho Agents output fields.
- **`kind: 'signature'`.** EIP-712 / personal-sign / SIWE with full `domain`, `types`, `primaryType`, `message`. Covers Permit, Permit2, CoW orders, UniswapX Dutch orders.
- **`Producer`.** Agent identity (`id` as DID / CAIP-10 / ERC-8004 / URL) with optional signature. `ProducerSignature.scheme` is an open enum covering `secp256k1`, `ed25519`, `p256` plus reserved post-quantum schemes `ml-dsa-44/65/87`, `slh-dsa-sha2-128s` (NIST FIPS 204/205).
- **`Origin: { url, verifyStatus, attestation? }`.** dApp binding to resist UI-spoofing (Ledger Connect Kit supply-chain lesson, WalletConnect phishing).
- **`RiskAssessment`.** Unbound slot for wallets and scanners (Blockaid / GoPlus / Blowfish common shape): `{ action, score?, warnings[], scanners[] }`.
- **`Capabilities`.** EIP-5792 open record: `atomicRequired`, `paymasterService`, ERC-7715 `permissions.context`, `requiresAccountType`.
- **Helpers.** `createEvmTx`, `createEvmBatch`, `createSignature` pre-fill envelope fields from content.
- **Validator modes.** `validateEnvelope(input, { mode: 'strict' | 'permissive' })`. Strict rejects unknown and reserved kinds; permissive accepts unknown with warnings.
- **Warnings.** Validator returns non-blocking advisories for unlimited approvals and delegatecall operations.
- **`CALLS_STATUS`.** EIP-5792 status taxonomy constant: 100 pending, 200 confirmed, 400 off-chain failure, 500 reverted, 600 partially reverted.
- **`validatePreparedTx`** remains exported as a thin alias for `validateEnvelope(input, { mode: 'strict' })`.

### Changed (from unpublished v0.1 draft)

- `PreparedTransaction` type replaced by `PreparedEnvelope` discriminated union.
- `to`, `data`, `value` moved from top level into `content.calls[]`.
- `chainId: number` replaced by `chain: "eip155:N"` (CAIP-2).
- `description` moved into `content`; `action` is a closed enum.
- `metadata.tokenMovements[].direction: 'in' | 'out'` replaced by explicit `from` / `to` addresses; `kind` field added.
- `sequence` removed from content; ordering handled via `evm-batch` calls[].
- `decoderRef` remains on content (unchanged).

### Security

- Producer signature covers envelope bytes. Consumers SHOULD re-run decoders locally on `calls[*].data` and assert derived movements equal producer-claimed `metadata.tokenMovements`. Defense in depth.
- Unknown signature schemes treated as unsigned with warning, not hard block. Consumers MAY escalate.
- All off-chain fields (`description`, `metadata`, `origin`, `risk`, `decoderRef`, `clearSigning`, `meta`) are explicitly presentational. Policy engines MUST validate on raw `{chain, calls[*].to, calls[*].data, calls[*].value}`.

### Regulatory notice

`@txkit/tx-protocol` is a presentational protocol for human-readable transaction previews. It does not provide cryptographic integrity guarantees for off-chain data on its own (signatures and decoder re-verification provide the integrity layer). Under EU MiCA and similar frameworks, liability for transaction execution rests with the signing party (wallet / signer provider), not with txKit. This package does not custody keys, broker trades, or provide investment advice.

### References

Research synthesis: `wiki/projects/txkit-tx-protocol-spec-v0.2-research-2026-04-21.md`. Spec: `spec/v0.2/prepared-transaction.md`. Driving standards: EIP-5792, ERC-7730, ERC-7579, ERC-7821, ERC-7715, EIP-4337 v0.7, EIP-7702, EIP-8141, CAIP-2/10/25/27. Driving incidents: Bybit $1.4B, Kelp DAO $293M, Drift $285M, 450K+ EIP-7702 drainers, Permit2 $55M DAI phishing, swap-as-drainer (Blockaid), address poisoning USENIX 2025.
