import React from 'react'
import { createContext, useState, useContext, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'


type ColorScheme = 'violet' | 'indigo' | 'blue' | 'pink' | 'black'

const VALID_COLOR_SCHEMES: readonly ColorScheme[] = [ 'violet', 'indigo', 'blue', 'pink', 'black' ]

type PlaygroundState = {
  theme: TxKit.Theme
  variant: TxKit.Variant
  colorScheme: ColorScheme
  setTheme: (theme: TxKit.Theme) => void
  setVariant: (variant: TxKit.Variant) => void
  setColorScheme: (colorScheme: ColorScheme) => void
}

const STORAGE_KEY = 'tx-playground'

const readStorage = (): { theme?: string; variant?: string; colorScheme?: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeStorage = (patch: Record<string, string>) => {
  try {
    const current = readStorage()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }))
  } catch {
    // localStorage unavailable
  }
}

const PlaygroundContext = createContext<PlaygroundState | null>(null)

type PlaygroundProviderProps = {
  children: ReactNode
}

export const PlaygroundProvider: React.FC<PlaygroundProviderProps> = ({ children }) => {
  const stored = readStorage()

  const [ theme, setThemeState ] = useState<TxKit.Theme>(
    (stored.theme as TxKit.Theme) || 'dark'
  )
  const [ variant, setVariantState ] = useState<TxKit.Variant>(
    (stored.variant as TxKit.Variant) || 'default'
  )
  const storedScheme = stored.colorScheme as ColorScheme | undefined
  const [ colorScheme, setColorSchemeState ] = useState<ColorScheme>(
    storedScheme && VALID_COLOR_SCHEMES.includes(storedScheme) ? storedScheme : 'indigo'
  )

  const setTheme = useCallback((value: TxKit.Theme) => {
    setThemeState(value)
    writeStorage({ theme: value })
  }, [])

  const setVariant = useCallback((value: TxKit.Variant) => {
    setVariantState(value)
    writeStorage({ variant: value })
  }, [])

  const setColorScheme = useCallback((value: ColorScheme) => {
    setColorSchemeState(value)
    writeStorage({ colorScheme: value })
  }, [])

  const value = useMemo(() => ({
    theme,
    variant,
    colorScheme,
    setTheme,
    setVariant,
    setColorScheme,
  }), [ theme, variant, colorScheme, setTheme, setVariant, setColorScheme ])

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
