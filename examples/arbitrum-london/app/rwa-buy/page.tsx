import Link from 'next/link'

import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import {
  checkIsAgentPolicyGateDeployed,
  checkIsMockRwaRouterDeployed,
} from '@/src/config/deployed'
import { WalletConnectButton } from '../yield-swap/WalletConnectButton'
import { RwaAgentChat } from './RwaAgentChat'


/**
 * Robinhood deploy-pending banner: renders only when AgentPolicyGate or
 * MockRwaRouter is still a placeholder on Robinhood Chain (46630). Both
 * contracts are deployed as of 2026-06-08, so this renders nothing in the
 * current deployed.json state. Kept for correctness if deployed.json is rolled
 * back or used against a fresh environment.
 */
const RobinhoodDeployPendingBanner = () => {
  const isGateDeployed = checkIsAgentPolicyGateDeployed(ROBINHOOD_TESTNET_CHAIN_ID)
  const isRouterDeployed = checkIsMockRwaRouterDeployed(ROBINHOOD_TESTNET_CHAIN_ID)
  const isFullyDeployed = isGateDeployed && isRouterDeployed
  if (isFullyDeployed) {
    return null
  }

  const missingParts: string[] = []
  if (!isGateDeployed) {
    missingParts.push('AgentPolicyGate')
  }
  if (!isRouterDeployed) {
    missingParts.push('MockRwaRouter')
  }
  const missingLabel = missingParts.join(' + ')
  const hasMultipleMissing = missingParts.length > 1
  const verb = hasMultipleMissing ? 'are' : 'is'

  return (
    <div
      role="status"
      className="rounded-md border border-dashed border-warning bg-warning-bg px-4 py-3 text-sm"
    >
      <p className="font-medium text-warning">
        Preview mode - contracts not deployed yet
      </p>
      <p className="mt-1 text-xs text-muted">
        {missingLabel} on Robinhood Chain testnet (46630) {verb} still a placeholder address.
        You can explore the flow, but preparing an envelope returns a &ldquo;not deployed
        yet&rdquo; notice until the contracts are live. Deploy steps:{' '}
        <span className="font-mono text-foreground">examples/arbitrum-london/DEPLOY.md</span>.
      </p>
    </div>
  )
}

/**
 * Server component shell for Scenario C: x402-paid RWA agent on Robinhood
 * Chain testnet (chainId 46630).
 *
 * The flow is live end-to-end:
 * - Self-hosted x402 facilitator (GET/POST /api/x402) verifies EIP-712 payment
 *   authorizations. Settlement is honestly stubbed on testnet - the signature is
 *   the receipt; no on-chain transfer occurs.
 * - AgentPolicyGate (0x0d4E461d) + MockRwaRouter (0x3a57f2d3) are deployed and
 *   allow-listed on Robinhood Chain testnet (verified on-chain 2026-06-08).
 * - A real RWA buy envelope was executed: tx
 *   0xff64404144bdaea4e08c94e973166af180b29fed621b1e3632757703e9b080fa
 *   (RwaPurchased TSLA x5 + EnvelopeExecuted, status 0x1).
 */
const FlowC = () => {

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">&larr; Back</Link>
        <WalletConnectButton chainId={ROBINHOOD_TESTNET_CHAIN_ID} />
      </div>

      <header>
        <p className="text-xs uppercase tracking-wider text-accent mb-2">
          Robinhood Chain testnet (46630)
        </p>
        <h1 className="text-3xl font-bold mb-3">x402-paid RWA agent</h1>
        <p className="opacity-80">
          Pay via x402 (EIP-712 authorization, self-hosted facilitator), then ask the
          agent to buy a mock RWA token (TSLA / AMZN / PLTR) on Robinhood Chain testnet.
          The agent prepares a typed envelope, the policy gate enforces the rules
          on chain. Settlement is stubbed on testnet - verification is real.
        </p>
      </header>

      <RobinhoodDeployPendingBanner />

      <RwaAgentChat />

      <footer className="border-t border-border pt-6 text-xs opacity-60">
        <p>
          x402 payment: verify is real (EIP-712 signer recovery), settle is stubbed
          on testnet (the signature is the receipt). The self-hosted facilitator
          handles Robinhood Chain (Arbitrum Orbit) - Coinbase&apos;s facilitator does not
          support Orbit chains. On-chain contracts: AgentPolicyGate
          0x0d4E461d19788B0c2Bd72f527F2e43E1eea54d35, MockRwaRouter
          0x3a57f2d32b1eBaa38AEB26957B3Cbc0fB7ee4c3C.
        </p>
      </footer>
    </main>
  )
}

export default FlowC
