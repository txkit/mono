import Link from 'next/link'


/**
 * 404 page. Renders inside the root layout, so it inherits the dark txKit theme
 * and points back to the two live demos.
 */
const NotFound = () => {

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-3 text-sm uppercase tracking-wider text-accent">txKit</p>
      <p className="mb-2 font-mono text-6xl font-bold">404</p>
      <h1 className="mb-3 text-2xl font-semibold">Page not found</h1>
      <p className="mb-8 max-w-md text-muted">
        That route does not exist. The live demos are the Pendle yield swap and
        the x402 RWA agent.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-accent px-4 py-2 text-sm text-accent-text transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to home
        </Link>
        <Link
          href="/yield-swap"
          className="rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Open a demo
        </Link>
      </div>
    </main>
  )
}


export default NotFound
