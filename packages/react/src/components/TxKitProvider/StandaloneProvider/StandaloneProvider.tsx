'use client'
import React, { useId, useState, useMemo, type ReactNode } from 'react'
import { createConfig, createStorage, cookieStorage, cookieToInitialState, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '../../../types/global'
import TxKitInner from '../TxKitInner'
import useConfig from '../../../hooks/useConfig'
import useTheme from '../../../hooks/useTheme'
import safeStorage from '../../../helpers/safeStorage'
import validateConfig from '../utils/validateConfig'


const StandaloneProvider = ({ children, config }: { children: ReactNode; config: TxKit.Config }) => {
  validateConfig(config)

  const resolvedConfig = useConfig(config)
  const { theme, setTheme } = useTheme({ initialTheme: config.theme })

  // Unique per-instance storage key prevents multiple TxKitProviders
  // on the same page from corrupting each other's wagmi store.
  const instanceId = useId()

  // Snapshot the cookie BEFORE createConfig runs: createConfig persists the fresh
  // (disconnected) store to the cookie synchronously, which would overwrite the real
  // connection we need to read back for initialState in a client-only SPA.
  const [ cookieSnapshot ] = useState(() => (typeof document === 'undefined' ? '' : document.cookie))

  const [ wagmiConfig ] = useState(() =>
    createConfig({
      chains: resolvedConfig.chains,
      transports: resolvedConfig.transports,
      connectors: resolvedConfig.wallets.map((wallet) => wallet.createConnector),
      // ssr: true moves hydration from render to useEffect, preventing
      // infinite update loops caused by wagmi's onMount() creating new Map()
      // references on every render via useSyncExternalStore.
      ssr: true,
      // cookiePersistence: cookie storage + a stable key lets cookieToInitialState()
      // hydrate the connection synchronously on the first render, removing the reconnect
      // flash in client-only SPAs. A per-mount useId key would not match the cookie
      // written last session, so the key must be stable when this is enabled.
      storage: resolvedConfig.cookiePersistence
        ? createStorage({ storage: cookieStorage, key: 'wagmi' })
        : createStorage({ storage: safeStorage, key: `wagmi${instanceId}` }),
    }),
  )

  const [ initialState ] = useState(() => {
    if (!resolvedConfig.cookiePersistence) {
      return undefined
    }

    // Only seed initialState when there is a connection to restore. An empty cookie
    // (current: null) would otherwise force status:'reconnecting' on the first render
    // and flash a loading state for genuinely disconnected users.
    const restored = cookieToInitialState(wagmiConfig, cookieSnapshot)

    return restored?.current ? restored : undefined
  })

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
      initialState={initialState}
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
