import { useState } from 'react'
import { http } from 'viem'
import { injected } from 'wagmi/connectors'
import { mainnet, sepolia } from 'viem/chains'
import { createConfig } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'


const useEmbeddedProviders = () => {
  const [ wagmiConfig ] = useState(() =>
    createConfig({
      chains: [ mainnet, sepolia ],
      transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
      },
      connectors: [ injected() ],
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
