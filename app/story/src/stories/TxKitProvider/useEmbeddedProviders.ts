import { useState } from 'react'
import { fallback, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { createConfig } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'


// No connectors - embedded demo only shows UI, doesn't connect.
// Adding injected() would conflict with the outer wagmi's injected connector
// and trigger "Maximum update depth exceeded" from useSyncExternalStore.
const useEmbeddedProviders = () => {
  const [ wagmiConfig ] = useState(() =>
    createConfig({
      chains: [ mainnet, sepolia ],
      transports: {
        [mainnet.id]: fallback([ http('https://ethereum-rpc.publicnode.com'), http('https://cloudflare-eth.com') ]),
        [sepolia.id]: fallback([ http('https://ethereum-sepolia-rpc.publicnode.com'), http('https://rpc.sepolia.org') ]),
      },
    }),
  )

  const [ queryClient ] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000 },
      },
    }),
  )

  return { wagmiConfig, queryClient }
}


export default useEmbeddedProviders
