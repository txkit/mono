import { useRef, useState, useSyncExternalStore } from 'react'


type ThemeInput = 'light' | 'dark' | 'auto'
type ThemeResolved = 'light' | 'dark'

type UseThemeOptions = {
  initialTheme?: ThemeInput
}

type UseThemeReturn = {
  theme: ThemeResolved
  setTheme: (t: ThemeInput) => void
}

const getSystemTheme = (): ThemeResolved =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

const subscribeToSystemTheme = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getServerTheme = (): ThemeResolved => 'light'

const useTheme = ({ initialTheme = 'auto' }: UseThemeOptions = {}): UseThemeReturn => {
  const [ mode, setTheme ] = useState<ThemeInput>(initialTheme)
  const prevInitialThemeRef = useRef(initialTheme)

  if (prevInitialThemeRef.current !== initialTheme) {
    prevInitialThemeRef.current = initialTheme
    setTheme(initialTheme)
  }

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerTheme,
  )

  const theme: ThemeResolved = mode === 'auto' ? systemTheme : mode

  return { theme, setTheme }
}


export default useTheme
