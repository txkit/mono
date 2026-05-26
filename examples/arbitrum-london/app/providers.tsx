'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { http } from 'viem'
import { WagmiProvider, createConfig } from 'wagmi'

import { arbitrumSepolia, robinhoodTestnet } from '@/src/chains'


/**
 * Wagmi config wires both Buildathon chains. Single shared HTTP transport
 * per chain - production app would want a chain-aware fallback list, but
 * for testnet demo a single RPC per chain is fine.
 */
const wagmiConfig = createConfig({
  chains: [ arbitrumSepolia, robinhoodTestnet ],
  transports: {
    [arbitrumSepolia.id]: http(),
    [robinhoodTestnet.id]: http(),
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
