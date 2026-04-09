import React from 'react'
import { useState } from 'react'
import { http } from 'viem'
import { injected } from 'wagmi/connectors'
import { mainnet, sepolia } from 'viem/chains'
import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TxKitProvider, ConnectWallet, useTxKit } from '@txkit/react'

import StorySection from '../StorySection'
import { defaultConfig, useStoryConfig } from '../config'


const ThemeInfo = () => {
  const { theme, setTheme, config: resolvedConfig } = useTxKit()

  return (
    <div className="theme-info">
      <p>Theme: <strong>{theme}</strong></p>
      <p>Chains: {resolvedConfig.chains.map((c) => c.name).join(', ')}</p>
      <p>Wallets: {resolvedConfig.wallets.map((w) => w.name).join(', ')}</p>
      <p>AutoConnect: {String(resolvedConfig.autoConnect)}</p>
      <div className="theme-info-actions">
        <button type="button" className="theme-info-btn" onClick={() => setTheme('light')}>Light</button>
        <button type="button" className="theme-info-btn" onClick={() => setTheme('dark')}>Dark</button>
        <button type="button" className="theme-info-btn" onClick={() => setTheme('auto')}>Auto</button>
      </div>
    </div>
  )
}

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

const TxKitProviderStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)
  const darkConfig = useStoryConfig(defaultConfig, 'dark', variant)
  const lightConfig = useStoryConfig(defaultConfig, 'light', variant)

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
    <div>
      <StorySection
        title="Default Config (auto theme)"
        description="Standalone mode - txKit creates wagmi + TanStack Query internally"
        code={`import { TxKitProvider, ConnectWallet } from '@txkit/react'

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
</TxKitProvider>`}
      >
        <TxKitProvider config={config}>
          <ConnectWallet />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <StorySection
        title="Dark Theme"
        code={`<TxKitProvider
  config={{
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
    theme: 'dark',
  }}
>
  <ConnectWallet />
</TxKitProvider>`}
      >
        <TxKitProvider config={darkConfig}>
          <ConnectWallet />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <StorySection
        title="Light Theme"
        code={`<TxKitProvider
  config={{
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
    theme: 'light',
  }}
>
  <ConnectWallet />
</TxKitProvider>`}
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
            code={`import { WagmiProvider, createConfig } from 'wagmi'
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
</WagmiProvider>`}
          >
            <TxKitProvider embedded>
              <ConnectWallet />
              <EmbeddedInfo />
            </TxKitProvider>
          </StorySection>

          <StorySection
            title="Embedded Dark"
            description="Theme override in embedded mode - only theme/variant/licenseKey accepted, chains come from wagmi"
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
            title="Embedded Light"
            code={`<TxKitProvider embedded config={{ theme: 'light' }}>
  <ConnectWallet />
</TxKitProvider>`}
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
