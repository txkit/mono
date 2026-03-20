import React from 'react'
import { useState } from 'react'
import { http } from 'viem'
import { injected } from 'wagmi/connectors'
import { mainnet, sepolia } from 'viem/chains'
import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TxKitProvider, ConnectWallet, useTxKit } from '@txkit/react'

import StorySection from '../StorySection'
import { usePlayground } from '../PlaygroundContext'


const EmbeddedInfo: React.FC = () => {
  const { theme, config } = useTxKit()

  return (
    <div className="story-info-grid" style={{ marginTop: 12 }}>
      <span className="story-info-key">Embedded</span>
      <span className="story-info-value">{String(config.embedded)}</span>
      <span className="story-info-key">Theme</span>
      <span className="story-info-value">{theme}</span>
      <span className="story-info-key">Chains</span>
      <span className="story-info-value">{config.chains.map((c) => c.name).join(', ')}</span>
    </div>
  )
}


const TxKitProviderEmbeddedStory: React.FC = () => {
  const { theme } = usePlayground()

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

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div>
          <StorySection
            title="Basic Embedded"
            description="txKit wraps an existing WagmiProvider + QueryClientProvider"
            code={`<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <TxKitProvider embedded>
      <ConnectWallet />
    </TxKitProvider>
  </QueryClientProvider>
</WagmiProvider>`}
          >
            <TxKitProvider embedded config={{ theme }}>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>

          <StorySection
            title="Embedded with Dark Theme"
            description="Embedded mode with theme override via config"
            code={`<TxKitProvider embedded config={{ theme: 'dark' }}>
  <ConnectWallet />
</TxKitProvider>`}
          >
            <TxKitProvider embedded config={{ theme: 'dark' }}>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>

          <StorySection
            title="Embedded with Light Theme"
            description="Light theme in embedded mode"
            code={`<TxKitProvider embedded config={{ theme: 'light' }}>
  <ConnectWallet />
</TxKitProvider>`}
          >
            <TxKitProvider embedded config={{ theme: 'light' }}>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


export default TxKitProviderEmbeddedStory
