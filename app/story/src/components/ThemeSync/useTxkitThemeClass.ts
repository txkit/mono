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

/** Returns "tx-light" or "tx-dark" synced with playground theme. */
const useTxkitThemeClass = (): 'tx-light' | 'tx-dark' => {
  const { theme } = usePlayground()
  return getResolved(theme) === 'dark' ? 'tx-dark' : 'tx-light'
}


export default useTxkitThemeClass
