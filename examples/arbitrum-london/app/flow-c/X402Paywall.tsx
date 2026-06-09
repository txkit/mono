'use client'

import { useState } from 'react'
import { useAccount, useChainId, useSignTypedData, useSwitchChain } from 'wagmi'
import { keccak256, toBytes } from 'viem'

import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import {
  X402_DOMAIN,
  X402_MERCHANT_ADDRESS,
  X402_PAYMENT_TYPES,
  X402_REQUIRED_AMOUNT,
  hashPaymentRequirements,
  type SignedPaymentBody,
} from '@/src/x402/facilitator'


type X402PaywallProps = {
  onUnlocked: (payment: SignedPaymentBody) => void,
}

type RequirementsShape = {
  accepts: Array<{
    scheme: string,
    network: string,
    payTo: string,
    asset: string,
    maxAmountRequired: string,
    resource: string,
  }>,
  settlement: string,
}

type VerifyResponseShape = {
  verified?: boolean,
  settlement?: string,
  proof?: unknown,
  error?: string,
}

/**
 * x402 paywall gate for scenario C. Fetches GET /api/x402 to display the
 * payment requirements, then on "Pay and unlock" builds a PaymentAuthorization
 * (EIP-712), signs it via wagmi useSignTypedData, POSTs to /api/x402 for
 * verification, and calls onUnlocked with the signed payment body so the parent
 * can pass it to /api/agent for re-verification.
 *
 * Settlement is honestly stubbed on testnet: the signature IS the receipt -
 * no on-chain transfer occurs. The verify step (EIP-712 signer recovery,
 * amount + expiry checks) is real.
 *
 * Design mirrors the flow-a empty-state card.
 */
export const X402Paywall = (props: X402PaywallProps) => {
  const { onUnlocked } = props

  const { address: connectedAddress, isConnected } = useAccount()
  const activeChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const [ isPending, setIsPending ] = useState(false)
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null)
  const [ requirements, setRequirements ] = useState<RequirementsShape | null>(null)

  const { signTypedDataAsync } = useSignTypedData()

  const fetchRequirements = async (): Promise<RequirementsShape | null> => {
    try {
      const response = await fetch('/api/x402')
      const json = (await response.json()) as RequirementsShape
      return json
    } catch {
      return null
    }
  }

  const handlePayAndUnlock = async () => {
    if (!isConnected || connectedAddress === undefined) {
      setErrorMessage('Connect your wallet first')
      return
    }

    setIsPending(true)
    setErrorMessage(null)

    try {
      // The x402 EIP-712 domain is bound to Robinhood Chain (46630). MetaMask
      // rejects signTypedData when its active chain differs ("provided chainId
      // must match the active chainId"), so switch the wallet first. switchChain
      // also triggers wallet_addEthereumChain when the chain is not yet known.
      if (activeChainId !== ROBINHOOD_TESTNET_CHAIN_ID) {
        await switchChainAsync({ chainId: ROBINHOOD_TESTNET_CHAIN_ID })
      }

      const fetched = await fetchRequirements()
      if (fetched !== null) {
        setRequirements(fetched)
      }

      // Build payment authorization fields. validUntil = now + 600s.
      const validUntil = Math.floor(Date.now() / 1000) + 600
      // nonce: keccak256 of a random UUID encoded to bytes32
      const nonce = keccak256(toBytes(crypto.randomUUID())) as `0x${string}`

      const paymentRequirementsHash = hashPaymentRequirements({
        payee: X402_MERCHANT_ADDRESS,
        amount: X402_REQUIRED_AMOUNT,
        validUntil,
        nonce,
      })

      // Sign EIP-712 payment authorization. Domain + types MUST match
      // src/x402/facilitator.ts exactly so the server can recover the signer.
      const signature = await signTypedDataAsync({
        domain: X402_DOMAIN,
        types: X402_PAYMENT_TYPES,
        primaryType: 'X402Payment',
        message: {
          paymentRequirementsHash,
          payer: connectedAddress,
          payee: X402_MERCHANT_ADDRESS,
          amount: X402_REQUIRED_AMOUNT,
          validUntil: BigInt(validUntil),
        },
      })

      // Build the wire body (amount as decimal string - JSON has no bigint).
      const signedBody: SignedPaymentBody = {
        payer: connectedAddress,
        payee: X402_MERCHANT_ADDRESS,
        amount: X402_REQUIRED_AMOUNT.toString(),
        validUntil,
        nonce,
        paymentRequirementsHash,
        signature,
      }

      // POST to /api/x402 for server-side EIP-712 verification.
      const response = await fetch('/api/x402', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedBody),
      })
      const json = (await response.json()) as VerifyResponseShape

      if (!response.ok || json.verified !== true) {
        const reason = json.error ?? 'Payment verification failed'
        setErrorMessage(reason)
        return
      }

      // Pass the signed body (not the proof) to the parent - /api/agent
      // re-verifies the raw payment for defense-in-depth.
      onUnlocked(signedBody)
    } catch (paymentError) {
      if (paymentError instanceof Error && paymentError.message.includes('User rejected')) {
        setErrorMessage('Signature rejected')
      } else {
        setErrorMessage(`Payment failed: ${String(paymentError)}`)
      }
    } finally {
      setIsPending(false)
    }
  }

  const requirementsNode = requirements !== null ? (
    <div className="mt-3 rounded-md bg-card-sunken px-4 py-3 font-mono text-xs space-y-1">
      {requirements.accepts.map((accept, index) => (
        <div key={index} className="text-muted">
          <span className="text-foreground">{accept.maxAmountRequired}</span>
          {' '}
          <span>{accept.asset}</span>
          {' on '}
          <span className="text-accent">{accept.network}</span>
        </div>
      ))}
      <div className="text-muted text-xs pt-1 italic">
        Settlement: {requirements.settlement}
      </div>
    </div>
  ) : null

  const errorNode = errorMessage !== null ? (
    <div role="alert" className="mt-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
      {errorMessage}
    </div>
  ) : null

  const pendingStatusNode = isPending ? (
    <p role="status" aria-live="polite" className="mt-3 text-xs text-muted">
      Waiting for wallet signature...
    </p>
  ) : null

  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 px-5 py-8 text-center space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">
          x402 payment required
        </p>
        <p className="text-xs text-muted">
          Sign a payment authorization to unlock the RWA agent.
          Verification is real (EIP-712 signer recovery). Settlement is stubbed on testnet.
        </p>
      </div>

      {requirementsNode}

      <button
        type="button"
        disabled={isPending || !isConnected}
        onClick={handlePayAndUnlock}
        className="rounded-md bg-accent px-6 py-2.5 text-sm text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Signing...' : 'Pay and unlock'}
      </button>

      {!isConnected ? (
        <p className="text-xs text-muted">Connect your wallet to pay</p>
      ) : null}

      {pendingStatusNode}
      {errorNode}
    </div>
  )
}
