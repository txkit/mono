import type { Metadata } from 'next'

import '@txkit/themes/dark'
import './globals.css'
import { Providers } from './providers'


export const metadata: Metadata = {
  title: 'txKit - Arbitrum London Buildathon',
  description:
    'Live demos of ERC-8265 Prepared Transaction Envelope on Arbitrum Sepolia (Pendle yield swap) and Robinhood Chain testnet (x402-paid RWA agent). Source: github.com/txkit/mono',
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en" className="txkit-dark">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
