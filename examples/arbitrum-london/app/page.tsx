import Link from 'next/link'


/**
 * Landing page for the Buildathon demo. Leads with the txKit value prop and
 * the ERC-8265 credential, then a primary call-to-action into the working
 * Pendle flow (Scenario A). Scenario C (RWA on Robinhood) is shown as a
 * roadmap card, honestly labelled, so judges go straight to the live demo.
 */
const Home = () => {

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-16">
        <p className="text-sm uppercase tracking-wider text-accent mb-3">
          txKit - Arbitrum Open House London Buildathon
        </p>
        <h1 className="text-4xl font-bold mb-4">
          Verify before you sign
        </h1>
        <p className="text-lg text-muted max-w-2xl mb-6">
          An autonomous agent prepares an Arbitrum transaction. You see a
          typed, decoded preview of exactly what it does before signing, and a
          minimum-viable policy gate enforces the rules on-chain.
        </p>
        <a
          href="https://github.com/ethereum/ERCs/pull/1753"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-mono text-muted hover:border-accent hover:text-foreground transition-colors"
        >
          <span className="size-1.5 rounded-full bg-accent" />
          Built on ERC-8265 - Ethereum PR #1753
        </a>
      </header>

      <section className="grid gap-6 md:grid-cols-3 mb-16">
        <Link
          href="/flow-a"
          className="md:col-span-2 rounded-lg border border-border bg-card p-6 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-success font-mono">Live demo</span>
            <span className="text-xs uppercase tracking-wider text-muted">Scenario A</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Pendle yield swap</h2>
          <p className="text-muted mb-4">
            Agent rotates yield by swapping a base token for Pendle PT on
            Arbitrum Sepolia. Envelope decoded with
            <code className="font-mono bg-card-sunken px-1 rounded mx-1">@txkit/tx-decoder</code>,
            executed via AgentPolicyGate.
          </p>
          <p className="text-sm text-accent">Open demo &rarr;</p>
        </Link>

        <Link
          href="/flow-c"
          className="rounded-lg border border-dashed border-border bg-card/40 p-6 hover:border-border-hover transition-colors"
        >
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">Roadmap - Phase 2</p>
          <h2 className="text-xl font-semibold mb-2 text-muted">x402 RWA agent</h2>
          <p className="text-sm text-muted">
            x402-paid agent buying tokenised equity on Robinhood Chain testnet.
            Multi-chain envelope flow, landing next.
          </p>
        </Link>
      </section>

      <footer className="border-t border-border pt-8 text-sm text-muted">
        <p className="mb-2">
          Source:{' '}
          <a className="underline hover:text-foreground" href="https://github.com/txkit/mono">
            github.com/txkit/mono
          </a>
          {' '}- ERC PR:{' '}
          <a className="underline hover:text-foreground" href="https://github.com/ethereum/ERCs/pull/1753">
            ethereum/ERCs#1753
          </a>
          {' '}- Discussion:{' '}
          <a
            className="underline hover:text-foreground"
            href="https://ethereum-magicians.org/t/erc-8265-prepared-transaction-envelope/28557"
          >
            Ethereum Magicians thread 28557
          </a>
        </p>
        <p>Built for the Arbitrum Open House London Buildathon, due June 14 2026</p>
      </footer>
    </main>
  )
}


export default Home
