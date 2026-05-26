import Link from 'next/link'

import { RwaAgentChat } from './RwaAgentChat'


/**
 * Server component shell for Scenario C (x402-paid RWA agent on Robinhood Chain).
 * Lands in Buildathon Phase 2 (May 31 - Jun 7). For now ships as a placeholder
 * so the landing page links resolve and the layout structure is locked in.
 */
const FlowC = () => {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <Link href="/" className="text-sm opacity-70 hover:opacity-100">&larr; Back</Link>

      <header>
        <p className="text-xs uppercase tracking-wider text-[color:var(--color-accent)] mb-2">
          Scenario C - Robinhood Chain testnet
        </p>
        <h1 className="text-3xl font-bold mb-3">x402-paid RWA agent</h1>
        <p className="opacity-80">
          Pay 0.1 USDC via x402, then ask the agent to buy a mock RWA token
          (TSLA / AMZN / PLTR) on Robinhood Chain testnet. The agent prepares
          a typed envelope, the policy gate enforces the rules on chain.
        </p>
      </header>

      <RwaAgentChat />

      <footer className="border-t border-[color:var(--color-border)] pt-6 text-xs opacity-60">
        <p>
          Lands in Buildathon Phase 2 (May 31 - Jun 7). Until then the chat
          surface is placeholder; the x402 facilitator routes (/api/x402/*)
          and RWA envelope builder are scaffolded but not wired.
        </p>
      </footer>
    </main>
  )
}

export default FlowC
