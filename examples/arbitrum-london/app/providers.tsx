'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { http } from 'viem'
import { WagmiProvider, createConfig } from 'wagmi'

import { arbitrumSepolia, robinhoodTestnet } from '@/src/chains'


/**
 * Wagmi config wires both Buildathon chains. Each transport uses a configured
 * RPC url when one is provided, otherwise the chain's public default.
 *
 * The sequencer-fee preview reads the Arbitrum NodeInterface precompile
 * (gasEstimateComponents at 0xC8). The public default RPC returns empty data
 * for that virtual precompile on browser-origin requests, so the fee row
 * silently hides. Point NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL at a dedicated RPC
 * (e.g. Alchemy) to make the live fee breakdown render in the browser.
 */
const arbitrumSepoliaRpcUrl = process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL
const robinhoodTestnetRpcUrl = process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL

const arbitrumSepoliaTransport = arbitrumSepoliaRpcUrl !== undefined ? http(arbitrumSepoliaRpcUrl) : http()
const robinhoodTestnetTransport = robinhoodTestnetRpcUrl !== undefined ? http(robinhoodTestnetRpcUrl) : http()

const wagmiConfig = createConfig({
  chains: [ arbitrumSepolia, robinhoodTestnet ],
  transports: {
    [arbitrumSepolia.id]: arbitrumSepoliaTransport,
    [robinhoodTestnet.id]: robinhoodTestnetTransport,
  },
  ssr: true,
})

type ProvidersProps = {
  children: ReactNode,
}

/**
 * Client-side root provider. Keeps QueryClient stable across renders via
 * useState so React strict-mode double-invokes do not throw the cache away.
 *
 * TxKitProvider goes here once @txkit/react publishes a stable provider
 * surface for v0.2 - for now we wrap with wagmi + react-query only and
 * let individual components opt into TxKit context as it stabilises.
 */
export const Providers = ({ children }: ProvidersProps) => {
  const [ queryClient ] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
