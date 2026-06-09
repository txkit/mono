import Link from 'next/link'

import { arbitrumSepolia } from '@/src/chains'
import { DeployPendingBanner } from '@/src/ui/DeployPendingBanner'

import { PendleAgentChat } from './PendleAgentChat'
import { WalletConnectButton } from './WalletConnectButton'


/**
 * Server component shell for Scenario A (Pendle yield swap on Arbitrum Sepolia).
 * Static lift-pitch + technical note + client-side chat below the fold.
 */
const FlowA = () => {

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">&larr; Back</Link>
        <WalletConnectButton chainId={arbitrumSepolia.id} />
      </div>

      <header>
        <p className="text-xs uppercase tracking-wider text-accent mb-2">
          Arbitrum Sepolia
        </p>
        <h1 className="text-3xl font-bold mb-3">Pendle yield swap</h1>
        <p className="opacity-80">
          Tell the agent which token to swap into a Pendle PT (Principal Token -
          a fixed-yield position). It prepares a typed envelope through a mock
          Pendle router, you review the decoded preview, then sign once via
          AgentPolicyGate.executeEnvelope.
        </p>
      </header>

      <DeployPendingBanner />

      <PendleAgentChat />

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
    </main>
  )
}

export default FlowA
