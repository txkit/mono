'use client'

import Link from 'next/link'
import { useEffect } from 'react'


type ErrorPageProps = {
  error: Error & { digest?: string },
  reset: () => void,
}

/**
 * Root error boundary. Next renders this when a route throws; `reset` re-renders
 * the segment to retry. Matches the dark txKit theme and offers retry + home.
 */
const ErrorPage = (props: ErrorPageProps) => {
  const { error, reset } = props

  useEffect(() => {
    console.error(error)
  }, [ error ])

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-3 text-sm uppercase tracking-wider text-accent">txKit</p>
      <h1 className="mb-3 text-2xl font-semibold">Something went wrong</h1>
      <p className="mb-8 max-w-md text-muted">
        The demo hit an unexpected error. Retry the action, or head back to the
        home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-accent px-4 py-2 text-sm text-accent-text transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}


export default ErrorPage
