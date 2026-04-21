/**
 * Kind discriminator values for PreparedEnvelope.
 *
 * Implemented in v0.2:
 *  - evm-tx     : single EVM transaction (calls.length === 1)
 *  - evm-batch  : EIP-5792 batch (calls.length > 1, atomicRequired capability)
 *  - signature  : EIP-712 typed data / personal-sign / SIWE
 *
 * Reserved v0.2 (strict validator rejects; namespace taken so v0.3+ adds are non-breaking):
 *  - evm-userop : ERC-4337 v0.7/v0.8 UserOperation
 *  - evm-frame  : EIP-8141 Frame Transaction
 *  - evm-7702   : SET_CODE tx type 0x04 with authorization_list
 *  - mandate    : Google AP2 / Visa TAP / Mastercard Verifiable Intent
 *  - intent     : ERC-7683 / Anoma / UniswapX Dutch / RFQ
 *  - psbt       : Bitcoin Partially Signed
 *  - svm-tx     : Solana (versioned) transaction
 *  - move-tx    : Aptos / Sui Move
 *  - cosmos-tx  : Cosmos SDK Any-wrapped messages
 */

export const IMPLEMENTED_KINDS = [ 'evm-tx', 'evm-batch', 'signature' ] as const

export const RESERVED_KINDS = [
  'evm-userop',
  'evm-frame',
  'evm-7702',
  'mandate',
  'intent',
  'psbt',
  'svm-tx',
  'move-tx',
  'cosmos-tx',
] as const

export type ImplementedKind = (typeof IMPLEMENTED_KINDS)[number]
export type ReservedKind = (typeof RESERVED_KINDS)[number]
export type Kind = ImplementedKind | ReservedKind
