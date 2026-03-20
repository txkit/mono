'use client'
import React from 'react'
import { createContext, useState, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'


type PlaygroundState = {
  theme: TxKit.Theme
  variant: TxKit.Variant
  setTheme: (theme: TxKit.Theme) => void
  setVariant: (variant: TxKit.Variant) => void
}

const PlaygroundContext = createContext<PlaygroundState | null>(null)

type PlaygroundProviderProps = {
  children: ReactNode
}

export const PlaygroundProvider: React.FC<PlaygroundProviderProps> = ({ children }) => {
  const [ theme, setTheme ] = useState<TxKit.Theme>('dark')
  const [ variant, setVariant ] = useState<TxKit.Variant>('default')

  const value = useMemo(() => ({
    theme,
    variant,
    setTheme,
    setVariant,
  }), [ theme, variant ])

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  )
}

export const usePlayground = (): PlaygroundState => {
  const context = useContext(PlaygroundContext)
  if (!context) {
    throw new Error('usePlayground must be used within PlaygroundProvider')
  }
  return context
}
