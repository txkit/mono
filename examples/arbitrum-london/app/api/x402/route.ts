import { NextResponse, type NextRequest } from 'next/server'

import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import {
  X402_ASSET,
  X402_MERCHANT_ADDRESS,
  X402_REQUIRED_AMOUNT,
  X402_RESOURCE,
  verifyPayment,
  type SignedPayment,
} from '@/src/x402/facilitator'


export const runtime = 'nodejs'

/**
 * Self-hosted x402 facilitator for scenario C. Coinbase's facilitator does not
 * support Robinhood Chain (Arbitrum Orbit), so this implements the x402 flow
 * ourselves: GET advertises the 402 payment requirements, POST verifies a signed
 * payment authorization and returns a canonical X402PaymentProof. Settlement is
 * honestly stubbed on testnet (the signature is the receipt).
 *
 * The canonical x402 wire transport uses the PAYMENT-REQUIRED / PAYMENT-SIGNATURE
 * / PAYMENT-RESPONSE headers; here the React paywall drives a JSON body for
 * simplicity, so the requirements travel in the 402 body rather than a header.
 * Replay protection is expiry-bounded only - a durable nonce store is out of
 * scope for the demo (single session).
 */
const paymentRequired = () => ({
  accepts: [
    {
      scheme: 'exact',
      network: `eip155:${ROBINHOOD_TESTNET_CHAIN_ID}`,
      payTo: X402_MERCHANT_ADDRESS,
      asset: X402_ASSET,
      maxAmountRequired: X402_REQUIRED_AMOUNT.toString(),
      resource: X402_RESOURCE,
    },
  ],
  settlement: 'stubbed-testnet',
})

export const GET = async () => {
  return NextResponse.json(paymentRequired(), { status: 402 })
}

type SignedPaymentBody = Omit<SignedPayment, 'amount'> & { amount: string }

export const POST = async (request: NextRequest) => {
  let body: SignedPaymentBody
  try {
    body = (await request.json()) as SignedPaymentBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let result
  try {
    result = await verifyPayment({ ...body, amount: BigInt(body.amount) })
  } catch (verifyError) {
    return NextResponse.json(
      { error: 'Invalid payment payload', detail: String(verifyError) },
      { status: 400 },
    )
  }

  if (!result.ok) {
    return NextResponse.json({ ...paymentRequired(), error: result.reason }, { status: 402 })
  }

  return NextResponse.json({ verified: true, settlement: 'stubbed-testnet', proof: result.proof })
}
