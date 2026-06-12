'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount, useSignTypedData, useSwitchChain } from 'wagmi'
import { formatUnits, keccak256, toBytes } from 'viem'

import { robinhoodTestnet, ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import { openConnectWalletModal } from '@/src/ui/openConnectWalletModal'
import { AgentGreeting } from '../yield-swap/AgentGreeting'
import { resolveSendErrorText } from '../yield-swap/utils/formatters'
import {
  X402_ASSET,
  X402_DOMAIN,
  X402_MERCHANT_ADDRESS,
  X402_PAYMENT_TYPES,
  X402_REQUIRED_AMOUNT,
  X402_RESOURCE,
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

// The 402 challenge is built from compile-time facilitator constants - the same
// ones GET /api/x402 serves - so the paywall renders the requirements on first
// paint instead of waiting for the fetch. That removes the pop-in / height jump
// (previously requirements started null and only appeared after the round-trip).
// The background fetch still runs (real x402 handshake) and returns identical
// values, so it never changes the rendered box.
const STATIC_REQUIREMENTS: RequirementsShape = {
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
  settlement: 'simulated (testnet)',
}

// Render the x402 challenge amount as a human value. A native-asset amount is in
// wei, so format it against the chain's native currency (ETH, 18 decimals) and
// show the symbol; a non-native asset (an ERC-20 address) falls back to the raw
// amount + asset string.
const formatAcceptAmount = (asset: string, rawAmount: string): string => {
  if (asset !== 'native') {
    return `${rawAmount} ${asset}`
  }

  const { decimals, symbol } = robinhoodTestnet.nativeCurrency

  return `${formatUnits(BigInt(rawAmount), decimals)} ${symbol}`
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
 * Rendered as the agent's locked-state turn: the same AgentReasoning card
 * every bot message uses (via the AgentGreeting entrance), pinned to the
 * bottom of the chat like a fresh message rather than a centered empty-state.
 */
export const X402Paywall = (props: X402PaywallProps) => {
  const { onUnlocked } = props

  const { address: connectedAddress, isConnected, chainId: walletChainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const [ isPending, setIsPending ] = useState(false)
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null)
  const [ requirements, setRequirements ] = useState<RequirementsShape | null>(STATIC_REQUIREMENTS)
  // Set when "Pay and unlock" is clicked while disconnected: the click opens
  // the connect modal, and once the wallet actually connects the payment flow
  // resumes by itself - connecting was just the missing prerequisite (the
  // same auto-resume contract as the chat's connect prompt).
  const [ isAwaitingConnect, setAwaitingConnect ] = useState(false)

  // A wallet change is a session change for the paywall too: an error from
  // the previous wallet ("User rejected the request", a failed switch) must
  // not linger under the next session. Adjust-during-render, same pattern as
  // the chats - disconnect and account switch both clear it synchronously.
  const [ sessionAddress, setSessionAddress ] = useState(connectedAddress)
  if (connectedAddress !== sessionAddress) {
    setSessionAddress(connectedAddress)
    setErrorMessage(null)
  }

  const { signTypedDataAsync } = useSignTypedData()

  const fetchRequirements = useCallback(async (): Promise<RequirementsShape | null> => {
    try {
      // GET /api/x402 returns HTTP 402 by design (the body IS the x402
      // challenge), so response.ok is intentionally not checked - only a
      // thrown network error counts as a failure.
      const response = await fetch('/api/x402')
      const json = (await response.json()) as RequirementsShape
      return json
    } catch {
      return null
    }
  }, [])

  // Load the payment requirements on mount so the price (amount + asset +
  // network) is visible before the user commits to "Pay and unlock", instead
  // of only appearing mid-flow after the first click.
  useEffect(() => {
    let cancelled = false
    const loadRequirements = async () => {
      const fetched = await fetchRequirements()
      if (!cancelled && fetched !== null) {
        setRequirements(fetched)
      }
    }
    void loadRequirements()

    return () => {
      cancelled = true
    }
  }, [ fetchRequirements ])

  const handlePayAndUnlock = async () => {
    // The button stays active while disconnected: the first thing paying
    // requires is a wallet, so the click opens the connect modal instead of
    // showing a dead disabled state - and the connect resume below finishes
    // the flow.
    if (!isConnected || connectedAddress === undefined) {
      setAwaitingConnect(true)
      openConnectWalletModal()
      return
    }

    setAwaitingConnect(false)
    setIsPending(true)
    setErrorMessage(null)

    try {
      // The x402 EIP-712 domain is bound to Robinhood Chain (46630). MetaMask
      // rejects signTypedData when its active chain differs ("provided chainId
      // must match the active chainId"), so switch the wallet first. switchChain
      // also triggers wallet_addEthereumChain when the chain is not yet known.
      // The check reads the WALLET's chain (useAccount), not useChainId: the
      // wagmi config chain can claim 46630 (persisted from a prior session)
      // while the freshly connected wallet sits elsewhere - that skipped the
      // switch and left the wallet on the wrong network after unlocking.
      if (walletChainId !== ROBINHOOD_TESTNET_CHAIN_ID) {
        await switchChainAsync({ chainId: ROBINHOOD_TESTNET_CHAIN_ID })
      }

      const fetched = await fetchRequirements()
      if (fetched !== null) {
        setRequirements(fetched)
      }

      // Build payment authorization fields. validUntil = now + 1h, so the unlock
      // restored from sessionStorage stays valid across navigation for a session.
      const validUntil = Math.floor(Date.now() / 1000) + 3600
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
      // resolveSendErrorText reduces wallet/RPC errors (including the user
      // rejecting the signature) to their one-line shortMessage.
      const message = paymentError instanceof Error ? resolveSendErrorText(paymentError) : String(paymentError)
      setErrorMessage(message)
    } finally {
      setIsPending(false)
    }
  }

  // Resume the payment once the wallet the user was asked for is actually
  // connected: chain switch + EIP-712 prompt fire without a second click.
  useEffect(() => {
    if (!isAwaitingConnect || !isConnected || connectedAddress === undefined) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the external wagmi connect event into the payment flow: consume the pending intent and resume the signature the user already asked for
    void handlePayAndUnlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlePayAndUnlock is an unstable closure; the guard above makes the effect idempotent (the handler clears the flag), so reacting to connection changes is sufficient
  }, [ isAwaitingConnect, isConnected, connectedAddress ])

  const requirementsNode = requirements !== null ? (
    <div className="mt-3 rounded-md bg-card-sunken px-4 py-3 font-mono text-xs space-y-1">
      {requirements.accepts.map((accept) => (
        <div key={accept.network} className="text-muted">
          <span className="text-foreground">{formatAcceptAmount(accept.asset, accept.maxAmountRequired)}</span>
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

  return (
    <AgentGreeting greetingId="rwa-paywall" status="locked">
      <p className="text-sm leading-relaxed text-foreground">
        This agent is paid - sign an x402 payment authorization to unlock it.
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Verification is real (EIP-712 signer recovery); settlement is mocked for this testnet demo.
      </p>

      {requirementsNode}

      <button
        type="button"
        disabled={isPending}
        onClick={handlePayAndUnlock}
        className="mt-4 w-full rounded-md bg-accent px-6 py-3 text-sm text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Signing...' : 'Pay and unlock'}
      </button>

      {errorNode}
    </AgentGreeting>
  )
}
