import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { TxKitProvider, ConnectWallet } from '@txkit/react'

import dedent from '../../helpers/dedent'
import EmbeddedInfo from './EmbeddedInfo'
import useEmbeddedProviders from './useEmbeddedProviders'
import { StorySection, usePlayground } from '../../components'


const TxKitProviderEmbeddedStory: React.FC = () => {
  const { theme } = usePlayground()
  const { wagmiConfig, queryClient } = useEmbeddedProviders()

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div>
          <StorySection
            title="Basic Embedded"
            description="txKit wraps an existing WagmiProvider + QueryClientProvider"
            code={dedent`
              <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                  <TxKitProvider embedded>
                    <ConnectWallet />
                  </TxKitProvider>
                </QueryClientProvider>
              </WagmiProvider>
            `}
          >
            <TxKitProvider embedded config={{ theme }}>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>

          <StorySection
            title="Embedded with Dark Theme"
            description="Embedded mode with theme override via config"
            code={dedent`
              <TxKitProvider embedded config={{ theme: 'dark' }}>
                <ConnectWallet />
              </TxKitProvider>
            `}
          >
            <TxKitProvider embedded config={{ theme: 'dark' }}>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>

          <StorySection
            title="Embedded with Light Theme"
            description="Light theme in embedded mode"
            code={dedent`
              <TxKitProvider embedded config={{ theme: 'light' }}>
                <ConnectWallet />
              </TxKitProvider>
            `}
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
