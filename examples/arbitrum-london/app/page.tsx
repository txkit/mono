import Link from 'next/link'


/**
 * Landing page for the Buildathon demo. Two scenario cards, each linking
 * to its own /flow-* page. Lift-pitch above the fold, technical context
 * below, repo + ERC links in footer.
 */
const Home = () => {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-16">
        <p className="text-sm uppercase tracking-wider text-[color:var(--color-accent)] mb-3">
          txKit - Arbitrum Open House London Buildathon
        </p>
        <h1 className="text-4xl font-bold mb-4">
          ERC-8265 envelopes, on-chain enforced
        </h1>
        <p className="text-lg opacity-80 max-w-2xl">
          An autonomous agent prepares a transaction. You see a typed,
          decoded preview before signing. A minimum-viable policy gate
          enforces the rules on-chain. Two scenarios below show the flow
          end to end.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 mb-16">
        <Link
          href="/flow-a"
          className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 hover:border-[color:var(--color-accent)] transition-colors"
        >
          <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Scenario A</p>
          <h2 className="text-2xl font-semibold mb-2">Pendle yield swap</h2>
          <p className="opacity-80 mb-4">
            Agent rotates yield by swapping a base token for Pendle PT
            on Arbitrum Sepolia. Envelope decoded with
            <code className="bg-black/30 px-1 rounded mx-1">@txkit/tx-decoder</code>,
            executed via AgentPolicyGate.
          </p>
          <p className="text-sm text-[color:var(--color-accent)]">Open demo &rarr;</p>
        </Link>

        <Link
          href="/flow-c"
          className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 hover:border-[color:var(--color-accent)] transition-colors"
        >
          <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Scenario C</p>
          <h2 className="text-2xl font-semibold mb-2">x402 RWA agent</h2>
          <p className="opacity-80 mb-4">
            Pay 0.1 USDC via x402, the agent then prepares a tokenised
            equity buy on Robinhood Chain testnet. Mock TSLA / AMZN / PLTR
            from the official faucet.
          </p>
          <p className="text-sm text-[color:var(--color-accent)]">Open demo &rarr;</p>
        </Link>
      </section>

      <footer className="border-t border-[color:var(--color-border)] pt-8 text-sm opacity-70">
        <p className="mb-2">
          Source:{' '}
          <a className="underline" href="https://github.com/txkit/mono">
            github.com/txkit/mono
          </a>
          {' '}- ERC PR:{' '}
          <a className="underline" href="https://github.com/ethereum/ERCs/pull/1753">
            ethereum/ERCs#1753
          </a>
          {' '}- Discussion:{' '}
          <a
            className="underline"
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
