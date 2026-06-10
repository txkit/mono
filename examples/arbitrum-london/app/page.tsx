import Link from 'next/link'

import { Icon } from '@/src/ui/Icon'
import { WalletConnectButton } from '@/src/ui/WalletConnectButton'


/**
 * Landing page for the Buildathon demo. Leads with the txKit value prop and
 * the ERC-8265 credential, then two live-demo cards: the Pendle yield swap on
 * Arbitrum Sepolia and the x402-paid RWA agent on Robinhood Chain. Both are
 * deployed and execute real envelopes on-chain.
 */
const Home = () => {

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 flex items-center justify-end">
        <WalletConnectButton />
      </div>

      <header className="mb-16">
        <p className="text-sm uppercase tracking-wider text-accent mb-3">
          txKit - Arbitrum Open House London Buildathon
        </p>
        <h1 className="text-4xl font-bold mb-4">
          Verify before you sign
        </h1>
        <p className="text-lg text-muted max-w-2xl mb-4">
          An autonomous agent prepares an Arbitrum transaction. You see a
          typed, decoded preview of exactly what it does before signing, and a
          minimum-viable policy gate enforces the rules on-chain.
        </p>
        <p className="text-muted max-w-2xl">
          txKit is the reference implementation of ERC-8265, a
          transaction-safety standard authored by{' '}
          <span className="text-foreground">Mike Diamond</span> and submitted to
          Ethereum.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 mb-16">
        <Link
          href="/yield-swap"
          className="rounded-lg border border-border bg-card p-6 hover:border-accent transition-colors"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wider text-success font-mono">Live demo</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <span className="size-2 rounded-full bg-[#28a0f0]" />
              Arbitrum Sepolia
            </span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Pendle yield swap</h2>
          <p className="text-muted mb-4">
            Agent swaps a base token for a fixed-yield Pendle PT position on
            Arbitrum Sepolia. Envelope decoded with
            <code className="font-mono bg-card-sunken px-1 rounded mx-1">@txkit/tx-decoder</code>,
            executed via AgentPolicyGate.
          </p>
          <p className="text-sm text-accent">Open demo &rarr;</p>
        </Link>

        <Link
          href="/rwa-buy"
          className="rounded-lg border border-border bg-card p-6 hover:border-accent transition-colors"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wider text-success font-mono">Live demo</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <span className="size-2 rounded-full bg-[#00c805]" />
              Robinhood Chain
            </span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">x402 RWA agent</h2>
          <p className="text-muted mb-4">
            x402-paid agent buying tokenised equity on Robinhood Chain testnet.
            Same policy gate, a second Arbitrum Orbit chain.
          </p>
          <p className="text-sm text-accent">Open demo &rarr;</p>
        </Link>
      </section>

      <footer className="border-t border-border pt-8 text-sm text-muted">
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            href="https://github.com/txkit/mono"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" className="size-4" />
            txKit/mono
          </a>
          <a
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            href="https://github.com/ethereum/ERCs/pull/1753"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="git-pull-request" className="size-4" />
            ERC-8265 (PR #1753)
          </a>
          <a
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            href="https://ethereum-magicians.org/t/erc-8265-prepared-transaction-envelope/28557"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="message-square" className="size-4" />
            Magicians discussion
          </a>
        </div>
        <p>Built for the Arbitrum Open House London Buildathon, due June 14 2026</p>
      </footer>
    </main>
  )
}


export default Home
