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
          <h1 className="text-3xl font-bold">Pendle yield swap</h1>
        </header>
      )}
      note={(
        <Note icon="info">
          PT-stETH is a Pendle Principal Token - a fixed-yield position. The agent
          calls <code className="rounded bg-card-sunken px-1 font-mono text-foreground">prepare_pendle_yield_swap</code>,
          you review the decoded envelope, then sign in your wallet.
        </Note>
      )}
    />
  )
}

export default FlowA
