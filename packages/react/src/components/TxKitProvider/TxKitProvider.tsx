'use client'
import React, { createContext, useContext } from 'react'
import { NestedProviderError, ProviderNotFoundError } from '@txkit/core'

import '../../types/global'
import './TxKitProvider.css'
import StandaloneProvider from './StandaloneProvider'
import EmbeddedProvider from './EmbeddedProvider'
import type { ReactNode } from 'react'


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

export const TxKitContext = createContext<TxKit.Context | null>(null)

export const useTxKit = (): TxKit.Context => {
  const ctx = useContext(TxKitContext)
  if (!ctx) {
    throw new ProviderNotFoundError()
  }
  return ctx
}


const TxKitProvider = (props: TxKitProviderProps) => {
  // Detect nested standalone providers - an anti-pattern that spawns duplicate
  // wagmi stores and QueryClients, causing "Maximum update depth exceeded"
  // crashes from wagmi's useSyncExternalStore reading new Map() refs each render.
  // Embedded providers are safe to nest (they reuse the outer wagmi).
  const parentContext = useContext(TxKitContext)
  if (!props.embedded && parentContext) {
    throw new NestedProviderError()
  }

  if (props.embedded) {
    return <EmbeddedProvider config={props.config}>{props.children}</EmbeddedProvider>
  }

  return <StandaloneProvider config={props.config}>{props.children}</StandaloneProvider>
}


export default TxKitProvider
