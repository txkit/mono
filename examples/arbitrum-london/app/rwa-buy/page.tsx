import { ROBINHOOD_TESTNET_CHAIN_ID } from '@/src/chains'
import {
  checkIsAgentPolicyGateDeployed,
  checkIsMockRwaRouterDeployed,
} from '@/src/config/deployed'
import { DemoHeader } from '@/src/ui/DemoHeader'
import { Note } from '@/src/ui/Note'

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
 *   authorizations.
 * - AgentPolicyGate (0x0d4E461d) + MockRwaRouter v2 (0x26623A7f) are deployed,
 *   allow-listed and source-verified on Robinhood Chain testnet (2026-06-11).
 * - The x402 payment loop closes on-chain: every gated buy moves 1 mxUSD
 *   (MockSettlementToken 0x3585aA19, pre-minted to the router) to the x402
 *   merchant treasury. Real RWA buy executed: tx
 *   0xa4736fe73d166ced41813649bcd87e4b041d2fd482e0a956348c82e7e9879d5e
 *   (Transfer + RwaPurchased TSLA x5 + EnvelopeExecuted, status 0x1).
 */
const FlowC = () => {

  return (
    <RwaAgentChat
      header={<DemoHeader current="rwa-buy" chainId={ROBINHOOD_TESTNET_CHAIN_ID} />}
      banner={<RobinhoodDeployPendingBanner />}
      intro={(
        <header>
          <p className="text-xs uppercase tracking-wider text-accent mb-2">
            Robinhood Chain testnet (46630)
          </p>
          <h1 className="text-3xl font-bold">x402-paid RWA agent</h1>
        </header>
      )}
      note={(
        <Note icon="info">
          Pay via x402 (EIP-712 authorization, self-hosted facilitator), then ask the
          agent to buy a mock RWA token (TSLA / AMZN / PLTR) on Robinhood Chain testnet.
          The agent calls <code className="rounded bg-card-sunken px-1 font-mono text-foreground">prepare_rwa_buy</code>,
          you review the decoded envelope, then sign in your wallet. Verification is
          real, and each executed buy settles a mock-scale token transfer on-chain.
        </Note>
      )}
    />
  )
}

export default FlowC
