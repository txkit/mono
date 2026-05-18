# @txkit/tx-protocol

## [0.1.0-alpha.3] - 2026-05-18

### Changed

- **License changed from MIT to Apache-2.0.** Aligns the reference implementation with the txKit open-core licensing decided in the 2026-05-05 strategic pivot: the open distribution layer is Apache-2.0. The `0.1.0-alpha.0` and `0.1.0-alpha.1` versions on npm remain MIT; `0.1.0-alpha.3` and later are Apache-2.0. (`0.1.0-alpha.2` was bumped in-repo but never published.)

## [0.1.0-alpha.2] - 2026-05-11

Aligns the reference implementation with the ERC `Prepared Transaction Envelope` body draft (Phase 3 complete, ready for Phase 4 red-team). Five breaking changes follow.

### Breaking changes

- **Drop `version` field from `BaseEnvelope`.** The `$schema` URL is the version contract per ERC §1.2: envelopes MUST NOT carry a separate `version` field. `SPEC_VERSION` constant and `SpecVersion` type removed from exports. `SPEC_SCHEMA_URL` retained as the canonical version identifier.
- **Drop reserved post-quantum signature schemes from `SignatureScheme`.** `'ml-dsa-44' | 'ml-dsa-65' | 'ml-dsa-87' | 'slh-dsa-sha2-128s'` literals removed. The type remains an open string per ERC §3.2: implementations MAY use any scheme by agreement between producer and consumer, including future post-quantum algorithms, without revising this type.
- **Rename `'smart-account-7702'` → `'delegated-eoa'` in `RequiredAccountType`.** Removes the explicit EIP-7702 callout from the normative enum per ERC review decision H3. Same semantic (an EOA with installed code), neutral naming.
- **Close `RiskWarning.severity` enum to four lowercase values.** Was `'INFO' | 'WARN' | 'CRITICAL'`. Now `'low' | 'medium' | 'high' | 'critical'`, matching ERC §7 (CVSS-style severity ladder). Policy engines now have a fixed vocabulary across vendors.
- **Constrain `ScannerVerdict.verdict` to a closed enum.** Was `string`. Now `'ALLOW' | 'WARN' | 'BLOCK'`, matching `RiskAssessment.action` and ERC §7. Scanner verdicts share the same three-valued action language as the overall risk verdict.

### Spec sync

Canonical spec at `packages/tx-protocol/spec/v0.1/prepared-transaction.md` synced with the same five changes (drop `version`, drop PQ enums, rename account type, close severity, close verdict).

### Migration

Producers that emitted `version: '0.1'` MUST stop including the field. Consumers MAY accept old envelopes with the field for one release cycle by ignoring it. Producers using PQ scheme literals MUST switch to the open-string form; consumers MUST NOT reject envelopes solely because the scheme is not one of the recognised three values (§3.2). Producers using `'smart-account-7702'` MUST rename to `'delegated-eoa'`. Producers emitting `RiskWarning` MUST use lowercase severity values from the new four-value enum. Producers emitting `ScannerVerdict.verdict` MUST use one of `'ALLOW' | 'WARN' | 'BLOCK'`.

### Reference

ERC body draft is complete in private wiki (`projects/txkit-erc-draft/erc-draft_prepared_tx_envelope.md`). Will be submitted to `ethereum/ERCs` in Phase 6 after Phase 4 red-team (security + standards-process agents) and Phase 5 pre-Magicians outreach.

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release. Defines the `PreparedEnvelope` shape for agent-to-wallet
handoff, with three implemented kinds (`evm-tx`, `evm-batch`, `signature`)
and nine reserved kinds for v0.1+ expansion. Published without provenance
while the source repository is private; npm provenance enables on the
v0.1.0 GA cut after the public-repo migration.

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
