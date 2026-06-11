import Link from 'next/link'

import { WalletConnectButton } from './WalletConnectButton'


type DemoHeaderProps = {
  current: 'yield-swap' | 'rwa-buy',
  chainId: number,
}

const DEMO_TABS = [
  { id: 'yield-swap', href: '/yield-swap', label: 'Pendle' },
  { id: 'rwa-buy', href: '/rwa-buy', label: 'x402 RWA' },
] as const

/**
 * Shared top header for the two demo flows: a home wordmark, a tab per demo
 * (the active one highlighted), and the wallet connect control. Replaces the
 * per-page Back link and the bottom cross-demo CTA so either demo stays one
 * click away from anywhere.
 */
export const DemoHeader = (props: DemoHeaderProps) => {
  const { current, chainId } = props

  return (
    // One row at every width: menu (Home + tabs) on the left, connect control on
    // the right. On mobile the connect button drops its ETH balance and its
    // desktop min-width (see the .demo-header rule in globals.css) so the single
    // row still fits.
    <header className="demo-header flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          Home
        </Link>
        <nav className="flex items-center gap-1">
          {DEMO_TABS.map((tab) => {
            const isActive = tab.id === current
            const tabClassName = isActive
              ? 'rounded-md bg-card px-2.5 py-1.5 text-sm text-foreground'
              : 'rounded-md px-2.5 py-1.5 text-sm text-muted hover:text-foreground transition-colors'

            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={tabClassName}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <WalletConnectButton chainId={chainId} />
    </header>
  )
}
