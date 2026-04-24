import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { TxKitProvider } from '@txkit/react'

import dedent from '../../helpers/dedent'
import ThemeInfo from './ThemeInfo'
import EmbeddedInfo from './EmbeddedInfo'
import useEmbeddedProviders from './useEmbeddedProviders'
import { StorySection } from '../../components'


/** Static mock button - avoids wagmi useSyncExternalStore cascade that occurs
 *  when multiple real ConnectWallet instances mount simultaneously. */
const MockConnectButton: React.FC<{ label?: string }> = ({ label = 'Connect Wallet' }) => (
  <div className="txkit-cw" style={{ display: 'inline-block' }}>
    <button type="button" className="txkit-cw-button" data-state="disconnected">
      <span>{label}</span>
    </button>
  </div>
)

const StackedPreview: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="story-stack" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
    {children}
  </div>
)

const EmbeddedSections = () => {
  const { wagmiConfig, queryClient } = useEmbeddedProviders()

  return (
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
            <StackedPreview>
              <MockConnectButton />
              <EmbeddedInfo />
            </StackedPreview>
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
            <StackedPreview>
              <MockConnectButton />
              <EmbeddedInfo />
            </StackedPreview>
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
            <StackedPreview>
              <MockConnectButton />
              <EmbeddedInfo />
            </StackedPreview>
          </TxKitProvider>
        </StorySection>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

const TxKitProviderStory = () => {
  return (
    <div>
      <StorySection
        title="Default Config (auto theme)"
        description="Standalone mode - txKit creates wagmi + TanStack Query internally. Inherits theme from the playground toolbar above"
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
        <StackedPreview>
          <MockConnectButton />
          <ThemeInfo />
        </StackedPreview>
      </StorySection>

      <StorySection
        title="Dark Theme (scoped via CSS class)"
        description="Theme variants are CSS classes - the .txkit-root.txkit-dark wrapper scopes a theme to a section without spawning a nested provider"
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
        <div className="txkit-root txkit-dark">
          <MockConnectButton />
        </div>
      </StorySection>

      <StorySection
        title="Light Theme (scoped via CSS class)"
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
        <div className="txkit-root txkit-light">
          <MockConnectButton label="Connect" />
        </div>
      </StorySection>

      <EmbeddedSections />
    </div>
  )
}


export default TxKitProviderStory
