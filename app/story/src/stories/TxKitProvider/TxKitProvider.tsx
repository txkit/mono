import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { TxKitProvider, ConnectWallet } from '@txkit/react'

import StorySection from '../../StorySection'
import dedent from '../shared/dedent'
import ThemeInfo from './ThemeInfo'
import EmbeddedInfo from './EmbeddedInfo'
import useEmbeddedProviders from './useEmbeddedProviders'
import { defaultConfig, useStoryConfig } from '../../config'


const TxKitProviderStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)
  const darkConfig = useStoryConfig(defaultConfig, 'dark', variant)
  const lightConfig = useStoryConfig(defaultConfig, 'light', variant)
  const { wagmiConfig, queryClient } = useEmbeddedProviders()

  return (
    <div>
      <StorySection
        title="Default Config (auto theme)"
        description="Standalone mode - txKit creates wagmi + TanStack Query internally"
        code={dedent`
          import { TxKitProvider, ConnectWallet } from '@txkit/react'

          <TxKitProvider
            config={{
              chains: [mainnet, sepolia],
              transports: {
                [mainnet.id]: http(),
                [sepolia.id]: http(),
              },
            }}
          >
            <ConnectWallet />
          </TxKitProvider>
        `}
      >
        <TxKitProvider config={config}>
          <ConnectWallet />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <StorySection
        title="Dark Theme"
        code={dedent`
          <TxKitProvider
            config={{
              chains: [mainnet],
              transports: { [mainnet.id]: http() },
              theme: 'dark',
            }}
          >
            <ConnectWallet />
          </TxKitProvider>
        `}
      >
        <TxKitProvider config={darkConfig}>
          <ConnectWallet />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <StorySection
        title="Light Theme"
        code={dedent`
          <TxKitProvider
            config={{
              chains: [mainnet],
              transports: { [mainnet.id]: http() },
              theme: 'light',
            }}
          >
            <ConnectWallet />
          </TxKitProvider>
        `}
      >
        <TxKitProvider config={lightConfig}>
          <ConnectWallet label="Connect" />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <StorySection
            title="Embedded Mode"
            description="Use txKit inside an existing WagmiProvider - no duplicate providers. Chains and transports are read from the outer wagmi config automatically"
            code={dedent`
              import { WagmiProvider, createConfig } from 'wagmi'
              import { TxKitProvider, ConnectWallet } from '@txkit/react'

              const wagmiConfig = createConfig({
                chains: [mainnet, sepolia],
                transports: { ... },
                connectors: [injected()],
              })

              <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                  <TxKitProvider embedded>
                    <ConnectWallet />
                  </TxKitProvider>
                </QueryClientProvider>
              </WagmiProvider>
            `}
          >
            <TxKitProvider embedded>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>

          <StorySection
            title="Embedded Dark"
            description="Theme override in embedded mode - only theme/variant/licenseKey accepted, chains come from wagmi"
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
            title="Embedded Light"
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
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  )
}


export default TxKitProviderStory
