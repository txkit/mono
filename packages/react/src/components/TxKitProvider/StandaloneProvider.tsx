'use client'
import React, { useId, useState, useMemo, type ReactNode } from 'react'
import { createConfig, createStorage, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '../../types/global'
import TxKitInner from './TxKitInner'
import useConfig from '../../hooks/useConfig'
import useTheme from '../../hooks/useTheme'
import validateConfig from '../../helpers/validateConfig'


const StandaloneProvider = ({ children, config }: { children: ReactNode; config: TxKit.Config }) => {
  validateConfig(config)

  const resolvedConfig = useConfig(config)
  const { theme, setTheme } = useTheme({ initialTheme: config.theme })

  // Unique per-instance storage key prevents multiple TxKitProviders
  // on the same page from corrupting each other's wagmi store.
  const instanceId = useId()

  const [ wagmiConfig ] = useState(() =>
    createConfig({
      chains: resolvedConfig.chains,
      transports: resolvedConfig.transports,
      connectors: resolvedConfig.wallets.map((wallet) => wallet.createConnector),
      // ssr: true moves hydration from render to useEffect, preventing
      // infinite update loops caused by wagmi's onMount() creating new Map()
      // references on every render via useSyncExternalStore.
      ssr: true,
      storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        key: `wagmi${instanceId}`,
      }),
    }),
  )

  const [ queryClient ] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      }),
  )

  const contextValue = useMemo<TxKit.Context>(
    () => ({ config: resolvedConfig, theme, setTheme, isProEnabled: false }),
    [ resolvedConfig, theme, setTheme ],
  )

  return (
    <WagmiProvider
      config={wagmiConfig}
      reconnectOnMount={resolvedConfig.autoConnect}
    >
      <QueryClientProvider client={queryClient}>
        <TxKitInner contextValue={contextValue} variant={config.variant}>
          {children}
        </TxKitInner>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


export default StandaloneProvider
