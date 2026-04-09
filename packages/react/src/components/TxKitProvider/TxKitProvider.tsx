'use client'
import React, { Component, useId, useState, useMemo, createContext, useContext, type ReactNode } from 'react'
import { cx, ProviderNotFoundError } from '@txkit/core'
import { createConfig, createStorage, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '../../types/global'
import './TxKitProvider.css'
import useConfig from '../../hooks/useConfig'
import useTheme from '../../hooks/useTheme'
import validateConfig from '../../helpers/validateConfig'
import useEmbeddedWagmi from '../../hooks/useEmbeddedWagmi'
import FlowProvider from './FlowProvider'
import BalanceWatcher from './BalanceWatcher'


type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

class TxKitErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[txKit] Component error:', error)
    if (errorInfo.componentStack) {
      console.error('[txKit] Component stack:', errorInfo.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="txkit-error-boundary" role="alert">
          <p className="txkit-error-boundary__message">
            <strong>txKit Error:</strong> {this.state.error?.message || 'A component failed to render.'}
          </p>
          <button
            className="txkit-error-boundary__retry"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}


type TxKitProviderStandaloneProps = {
  children: ReactNode
  config: TxKit.Config
  embedded?: false
}

type TxKitProviderEmbeddedProps = {
  children: ReactNode
  config?: TxKit.EmbeddedConfig
  embedded: true
}

export type TxKitProviderProps = TxKitProviderStandaloneProps | TxKitProviderEmbeddedProps

const TxKitContext = createContext<TxKit.Context | null>(null)

export const useTxKit = (): TxKit.Context => {
  const ctx = useContext(TxKitContext)
  if (!ctx) {
    throw new ProviderNotFoundError()
  }
  return ctx
}


type TxKitInnerProps = {
  children: ReactNode
  contextValue: TxKit.Context
  variant?: TxKit.Variant
}

const TxKitInner: React.FC<TxKitInnerProps> = ({ children, contextValue, variant }) => (
  <TxKitContext.Provider value={contextValue}>
    <FlowProvider>
      <BalanceWatcher>
        <div
          className={cx('txkit-root', `txkit-${contextValue.theme}`, {
            [`txkit-${variant}`]: variant !== 'default' && variant !== undefined,
          })}
        >
          <TxKitErrorBoundary>
            {children}
          </TxKitErrorBoundary>
        </div>
      </BalanceWatcher>
    </FlowProvider>
  </TxKitContext.Provider>
)


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


const EmbeddedProvider = ({ children, config }: { children: ReactNode; config?: TxKit.EmbeddedConfig }) => {
  const resolvedConfig = useEmbeddedWagmi(config)
  const { theme, setTheme } = useTheme({ initialTheme: config?.theme })

  const contextValue = useMemo<TxKit.Context>(
    () => ({ config: resolvedConfig, theme, setTheme, isProEnabled: false }),
    [ resolvedConfig, theme, setTheme ],
  )

  return (
    <TxKitInner contextValue={contextValue} variant={config?.variant}>
      {children}
    </TxKitInner>
  )
}


const TxKitProvider = (props: TxKitProviderProps) => {
  if (props.embedded) {
    return <EmbeddedProvider config={props.config}>{props.children}</EmbeddedProvider>
  }

  return <StandaloneProvider config={props.config}>{props.children}</StandaloneProvider>
}


export default TxKitProvider
