import {
  encodeAbiParameters,
  keccak256,
  numberToHex,
  recoverTypedDataAddress,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import type { X402PaymentProof } from '@txkit/x402-adapter'


/**
 * Self-hosted x402 facilitator primitives for scenario C. Coinbase's x402
 * facilitator does not support Arbitrum Orbit chains (Robinhood Chain), so any
 * x402 here is self-hosted by definition. We implement the x402 `verify` step
 * for real (EIP-712 payment authorization, signer recovery, amount/expiry
 * checks) and produce the canonical `@txkit/x402-adapter` `X402PaymentProof`.
 * `settle` is honestly stubbed on testnet - the signature IS the receipt (the
 * X402PaymentProof.paymentReceipt field is documented as "Tx hash or signature
 * receipt"). See docs/scenario-c-design.md.
 */

// Demo merchant that receives the (stubbed) x402 payment. All-lowercase on
// purpose: viem rejects a mixed-case non-checksummed address.
export const X402_MERCHANT_ADDRESS = '0x000000000000000000000000000000000000c402' as const
// Verify-only demo: nothing settles on-chain, so asset + amount are illustrative
// challenge values, not a real token transfer. Native = the Robinhood gas token.
export const X402_ASSET = 'native' as const
// Illustrative challenge amount (100000 abstract units) shown in the paywall.
export const X402_REQUIRED_AMOUNT = 100000n
export const X402_RESOURCE = 'flow-c: RWA agent (Robinhood Chain testnet)'

export const X402_DOMAIN = {
  name: 'txKit-x402',
  version: '1',
  chainId: ROBINHOOD_TESTNET_CHAIN_ID,
} as const

export const X402_PAYMENT_TYPES = {
  X402Payment: [
    { name: 'paymentRequirementsHash', type: 'bytes32' },
    { name: 'payer', type: 'address' },
    { name: 'payee', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
  ],
} as const

export type PaymentRequirements = {
  payee: `0x${string}`,
  amount: bigint,
  validUntil: number,
  nonce: `0x${string}`,
}

export type SignedPayment = {
  payer: `0x${string}`,
  payee: `0x${string}`,
  amount: bigint,
  validUntil: number,
  nonce: `0x${string}`,
  paymentRequirementsHash: `0x${string}`,
  signature: Hex,
}

/** Over-the-wire shape of a SignedPayment: amount as a decimal string (JSON has no bigint). */
export type SignedPaymentBody = Omit<SignedPayment, 'amount'> & { amount: string }

export type VerifyResult =
  | { ok: true, proof: X402PaymentProof }
  | { ok: false, reason: string }

const nowSeconds = (): number => Math.floor(Date.now() / 1000)

/**
 * Opaque hash of the 402 challenge requirements - the x402
 * `paymentRequirementsHash`. Binds payee, amount, validity, a server nonce, and
 * the chain so a signature for one challenge cannot be replayed against another.
 */
export const hashPaymentRequirements = (requirements: PaymentRequirements): `0x${string}` => {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'uint256' },
      ],
      [
        requirements.payee,
        requirements.amount,
        BigInt(requirements.validUntil),
        requirements.nonce,
        BigInt(ROBINHOOD_TESTNET_CHAIN_ID),
      ],
    ),
  )
}

/**
 * Sign a payment authorization. Used by tests and as the reference for the
 * browser paywall, which signs the identical EIP-712 payload via wagmi
 * useSignTypedData (same X402_DOMAIN + X402_PAYMENT_TYPES).
 */
export const signPayment = async (
  requirements: PaymentRequirements,
  signerPrivateKey: Hex,
): Promise<SignedPayment> => {
  const account = privateKeyToAccount(signerPrivateKey)
  const paymentRequirementsHash = hashPaymentRequirements(requirements)

  const signature = await account.signTypedData({
    domain: X402_DOMAIN,
    types: X402_PAYMENT_TYPES,
    primaryType: 'X402Payment',
    message: {
      paymentRequirementsHash,
      payer: account.address,
      payee: requirements.payee,
      amount: requirements.amount,
      validUntil: BigInt(requirements.validUntil),
    },
  })

  return {
    payer: account.address,
    payee: requirements.payee,
    amount: requirements.amount,
    validUntil: requirements.validUntil,
    nonce: requirements.nonce,
    paymentRequirementsHash,
    signature,
  }
}

/**
 * Verify a signed payment: merchant + amount + expiry checks, requirements-hash
 * integrity, and EIP-712 signer recovery. On success returns a canonical
 * X402PaymentProof (paymentReceipt = the signature, since settle is stubbed).
 */
export const verifyPayment = async (signed: SignedPayment): Promise<VerifyResult> => {
  const verifiedAt = nowSeconds()

  if (signed.payee.toLowerCase() !== X402_MERCHANT_ADDRESS.toLowerCase()) {
    return { ok: false, reason: 'payee is not the demo merchant' }
  }
  if (signed.amount < X402_REQUIRED_AMOUNT) {
    return { ok: false, reason: 'amount is below the required payment' }
  }
  if (signed.validUntil <= verifiedAt) {
    return { ok: false, reason: 'authorization expired' }
  }

  const expectedHash = hashPaymentRequirements({
    payee: signed.payee,
    amount: signed.amount,
    validUntil: signed.validUntil,
    nonce: signed.nonce,
  })
  if (expectedHash !== signed.paymentRequirementsHash) {
    return { ok: false, reason: 'paymentRequirementsHash does not match the requirements' }
  }

  const recovered = await recoverTypedDataAddress({
    domain: X402_DOMAIN,
    types: X402_PAYMENT_TYPES,
    primaryType: 'X402Payment',
    message: {
      paymentRequirementsHash: signed.paymentRequirementsHash,
      payer: signed.payer,
      payee: signed.payee,
      amount: signed.amount,
      validUntil: BigInt(signed.validUntil),
    },
    signature: signed.signature,
  })
  if (recovered.toLowerCase() !== signed.payer.toLowerCase()) {
    return { ok: false, reason: 'recovered signer does not match payer' }
  }

  const proof: X402PaymentProof = {
    version: '0.1',
    paymentRequirementsHash: signed.paymentRequirementsHash,
    paymentReceipt: signed.signature,
    chain: `eip155:${ROBINHOOD_TESTNET_CHAIN_ID}`,
    asset: X402_ASSET,
    amount: numberToHex(signed.amount),
    payee: signed.payee,
    paidAt: verifiedAt,
    resource: X402_RESOURCE,
  }

  return { ok: true, proof }
}
