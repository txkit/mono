'use client'
import React, { useState, useMemo, createContext, useContext, type ReactNode } from 'react'
import { cx, ProviderNotFoundError } from '@txkit/core'
import { createConfig, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '../types/global'
import useConfig from './useConfig'
import useTheme from './useTheme'
import validateConfig from './validateConfig'
import useEmbeddedWagmi from './useEmbeddedWagmi'
import FlowProvider from '../transaction/FlowProvider'
import BalanceWatcher from '../balance/BalanceWatcher'


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
          {children}
        </div>
      </BalanceWatcher>
    </FlowProvider>
  </TxKitContext.Provider>
)


const StandaloneProvider = ({ children, config }: { children: ReactNode; config: TxKit.Config }) => {
  validateConfig(config)

  const resolvedConfig = useConfig(config)
  const { theme, setTheme } = useTheme({ initialTheme: config.theme })

  const [ wagmiConfig ] = useState(() =>
    createConfig({
      chains: resolvedConfig.chains,
      transports: resolvedConfig.transports,
      connectors: resolvedConfig.wallets.map((wallet) => wallet.createConnector),
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
