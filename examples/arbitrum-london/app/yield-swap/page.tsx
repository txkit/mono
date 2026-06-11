import { arbitrumSepolia } from '@/src/chains'
import { DemoHeader } from '@/src/ui/DemoHeader'
import { DeployPendingBanner } from '@/src/ui/DeployPendingBanner'
import { Note } from '@/src/ui/Note'

import { PendleAgentChat } from './PendleAgentChat'


/**
 * Server component shell for Scenario A (Pendle yield swap on Arbitrum Sepolia).
 * Static lift-pitch + technical note + client-side chat below the fold.
 */
const FlowA = () => {

  return (
    <PendleAgentChat
      header={<DemoHeader current="yield-swap" chainId={arbitrumSepolia.id} />}
      banner={<DeployPendingBanner />}
      intro={(
        <header>
          <p className="text-xs uppercase tracking-wider text-accent mb-2">
            Arbitrum Sepolia
          </p>
          <h1 className="text-3xl font-bold mb-3">Pendle yield swap</h1>
          <Note icon="info">
            PT-stETH is a Pendle Principal Token - a fixed-yield position. The agent
            calls <code className="rounded bg-card-sunken px-1 font-mono text-foreground">prepare_pendle_yield_swap</code>,
            you review the decoded envelope, then sign in your wallet.
          </Note>
        </header>
      )}
      footer={(
        <footer className="border-t border-border pt-6 text-xs opacity-60 space-y-1">
          <p>
            Mock Pendle router used on testnet - production envelope shape matches Pendle V2.
          </p>
          <p>
            AgentPolicyGate verifies: (1) msg.value == declared value, (2) recipient allow-listed,
            (3) value within spend cap, (4) envelope hash not used, (5) EIP-712 signature recovers
            to agent signer.
          </p>
        </footer>
      )}
    />
  )
}

export default FlowA
