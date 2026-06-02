import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@/src/chains'
import {
  checkIsAgentPolicyGateDeployed,
  checkIsMockPendleRouterDeployed,
} from '@/src/config/deployed'


/**
 * Proactive banner for the Pendle flow while the on-chain contracts are still
 * placeholder addresses in contracts/deployed.json. It surfaces the deploy gap
 * up front so the demo reads as "preview mode" instead of letting a visitor
 * type a prompt and only then hit a runtime "not deployed yet" error from
 * /api/agent. Renders nothing once both AgentPolicyGate and MockPendleRouter
 * hold real addresses (i.e. after the forge deploy + deployed.json update).
 */
export const DeployPendingBanner = () => {
  const isGateDeployed = checkIsAgentPolicyGateDeployed(ARBITRUM_SEPOLIA_CHAIN_ID)
  const isRouterDeployed = checkIsMockPendleRouterDeployed(ARBITRUM_SEPOLIA_CHAIN_ID)
  const isFullyDeployed = isGateDeployed && isRouterDeployed
  if (isFullyDeployed) {
    return null
  }

  const missingParts: string[] = []
  if (!isGateDeployed) {
    missingParts.push('AgentPolicyGate')
  }
  if (!isRouterDeployed) {
    missingParts.push('MockPendleRouter')
  }
  const missingLabel = missingParts.join(' + ')
  const hasMultipleMissing = missingParts.length > 1
  const verb = hasMultipleMissing ? 'are' : 'is'

  return (
    <div
      role="status"
      className="rounded-md border border-dashed border-[color:var(--color-warning)] bg-[color:var(--color-warning-bg)] px-4 py-3 text-sm"
    >
      <p className="font-medium text-[color:var(--color-warning)]">
        Preview mode - contracts not deployed yet
      </p>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
        {missingLabel} on Arbitrum Sepolia {verb} still a placeholder address. You can
        explore the flow, but preparing an envelope returns a &ldquo;not deployed yet&rdquo;
        notice until the contracts are live. Deploy steps:{' '}
        <span className="font-mono text-[color:var(--color-foreground)]">examples/arbitrum-london/DEPLOY.md</span>.
      </p>
    </div>
  )
}
