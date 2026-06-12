import Link from 'next/link'

import { WalletConnectButton } from './WalletConnectButton'


type DemoHeaderProps = {
  current?: 'yield-swap' | 'rwa-buy',
  chainId?: number,
}

const DEMO_TABS = [
  { id: 'yield-swap', href: '/yield-swap', label: 'Pendle' },
  { id: 'rwa-buy', href: '/rwa-buy', label: 'x402 RWA' },
] as const

/**
 * Shared top header: a home link, a tab per demo (the active one highlighted),
 * and the wallet connect control. On the landing page `current` is omitted -
 * the page content IS the menu, so only the connect control renders, in the
 * same position and rhythm as on the demo pages. `chainId` is omitted there
 * too, so the landing connects chain-agnostically.
 */
export const DemoHeader = (props: DemoHeaderProps) => {
  const { current, chainId } = props
  const hasMenu = current !== undefined
  const justifyClass = hasMenu ? 'justify-between' : 'justify-end'

  const menuNode = hasMenu ? (
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
  ) : null

  return (
    // One row at every width. On mobile the connect button drops its ETH
    // balance and pins to 155px (see the .tx-cw rules in globals.css) so the
    // single row still fits.
    <header className={`flex items-center ${justifyClass} gap-3 sm:gap-4`}>
      {menuNode}
      <WalletConnectButton chainId={chainId} />
    </header>
  )
}
