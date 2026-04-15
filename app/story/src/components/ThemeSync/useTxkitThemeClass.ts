import { usePlayground } from '../PlaygroundContext/PlaygroundContext'


const getResolved = (theme: TxKit.Theme): 'light' | 'dark' => {
  if (theme !== 'auto') {
    return theme
  }
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Returns "txkit-light" or "txkit-dark" synced with playground theme. */
const useTxkitThemeClass = (): 'txkit-light' | 'txkit-dark' => {
  const { theme } = usePlayground()
  return getResolved(theme) === 'dark' ? 'txkit-dark' : 'txkit-light'
}


export default useTxkitThemeClass
