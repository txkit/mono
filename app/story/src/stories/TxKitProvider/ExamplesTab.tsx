import React from 'react'

import dedent from '../../helpers/dedent'
import { CodeBlock, StorySection } from '../../components'


/** Static placeholder for live preview slots. We never instantiate a nested
 *  <TxKitProvider> here - the playground already mounts one at the root, and
 *  wagmi useSyncExternalStore will throw NestedProviderError on a second mount.
 *  Instead we render the *provider topology* as a vertical stack so each recipe
 *  shows its actual wiring (which is the only thing that differs between them). */
const ProviderTree: React.FC<{ label: string; nodes: string[] }> = ({ label, nodes }) => (
  <div className="story-provider-placeholder">
    <div className="story-provider-placeholder-label">{label}</div>
    <div className="story-provider-placeholder-tree story-provider-placeholder-tree-vertical">
      {
        nodes.map((node, index) => (
          <span key={index} className="story-provider-placeholder-step">
            {'  '.repeat(index)}{index === 0 ? '' : '↳ '}{node}
          </span>
        ))
      }
    </div>
  </div>
)

const FileLabel: React.FC<{ name: string; runtime: 'client' | 'server' }> = ({ name, runtime }) => (
  <div className="story-file-label">
    <span className="story-file-label-name">{name}</span>
    <span className="story-file-label-runtime" data-runtime={runtime}>{runtime}</span>
  </div>
)


const ExamplesTab = () => (
  <>
    <p className="story-description">
      Production recipes for TxKitProvider that aren&apos;t shown in the live Preview tab - each one has a unique
      provider topology you&apos;d wire into your app root.
    </p>

    <StorySection
      title="Multi-chain Config"
      useWhen="Mainnet + Sepolia + Polygon with per-chain transports. Use fallback() to layer multiple RPC endpoints for reliability"
      code={dedent`
        import { TxKitProvider } from '@txkit/react'
        import { mainnet, sepolia, polygon } from 'viem/chains'
        import { http, fallback } from 'viem'

        const App = ({ children }) => (
          <TxKitProvider
            config={{
              chains: [ mainnet, sepolia, polygon ],
              transports: {
                [mainnet.id]: fallback([
                  http('https://ethereum-rpc.publicnode.com'),
                  http('https://cloudflare-eth.com'),
                ]),
                [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
                [polygon.id]: http(),
              },
            }}
          >
            {children}
          </TxKitProvider>
        )
      `}
    >
      <ProviderTree
        label="Standalone, multi-chain"
        nodes={[ '<TxKitProvider chains={[mainnet, sepolia, polygon]}>' ]}
      />
    </StorySection>

    <StorySection
      title="RainbowKit Coexistence"
      useWhen="Add txKit alongside RainbowKit (shared wagmi config). RainbowKit owns the connect modal, txKit owns transaction UX"
      code={dedent`
        import { TxKitProvider } from '@txkit/react'
        import { WagmiProvider } from 'wagmi'
        import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
        import { mainnet } from 'viem/chains'
        import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
        import '@rainbow-me/rainbowkit/styles.css'

        const config = getDefaultConfig({
          appName: 'My App',
          projectId: 'YOUR_WC_PROJECT_ID',
          chains: [ mainnet ],
        })
        const queryClient = new QueryClient()

        const App = ({ children }) => (
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                <TxKitProvider embedded>
                  {children}
                </TxKitProvider>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        )
      `}
    >
      <ProviderTree
        label="Embedded inside RainbowKit"
        nodes={[
          '<WagmiProvider config={rainbowConfig}>',
          '<QueryClientProvider client={queryClient}>',
          '<RainbowKitProvider>',
          '<TxKitProvider embedded>',
        ]}
      />
    </StorySection>

    <StorySection
      title="SSR-safe (Next.js cookieStorage)"
      useWhen="Next.js App Router + cookieStorage for hydration-safe wallet state. The server reads cookies into initialState; the client hydrates without flicker"
    >
      <ProviderTree
        label="Client providers wired from server initialState"
        nodes={[
          '<WagmiProvider config={wagmiConfig} initialState>',
          '<QueryClientProvider client={queryClient}>',
          '<TxKitProvider embedded>',
        ]}
      />
      <FileLabel name="app/providers.tsx" runtime="client" />
      <CodeBlock code={dedent`
        'use client'
        import { useState } from 'react'
        import { TxKitProvider } from '@txkit/react'
        import { WagmiProvider, createConfig, cookieStorage, createStorage } from 'wagmi'
        import { mainnet } from 'viem/chains'
        import { http } from 'viem'
        import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

        export const wagmiConfig = createConfig({
          chains: [ mainnet ],
          transports: { [mainnet.id]: http() },
          ssr: true,
          storage: createStorage({ storage: cookieStorage }),
        })

        export const Providers = ({ children, initialState }) => {
          const [ queryClient ] = useState(() => new QueryClient())
          return (
            <WagmiProvider config={wagmiConfig} initialState={initialState}>
              <QueryClientProvider client={queryClient}>
                <TxKitProvider embedded>{children}</TxKitProvider>
              </QueryClientProvider>
            </WagmiProvider>
          )
        }
      `} />
      <FileLabel name="app/layout.tsx" runtime="server" />
      <CodeBlock code={dedent`
        import { headers } from 'next/headers'
        import { cookieToInitialState } from 'wagmi'
        import { Providers, wagmiConfig } from './providers'

        const RootLayout = async ({ children }) => {
          const initialState = cookieToInitialState(
            wagmiConfig,
            (await headers()).get('cookie'),
          )
          return (
            <html>
              <body>
                <Providers initialState={initialState}>{children}</Providers>
              </body>
            </html>
          )
        }
      `} />
    </StorySection>
  </>
)


export default ExamplesTab
