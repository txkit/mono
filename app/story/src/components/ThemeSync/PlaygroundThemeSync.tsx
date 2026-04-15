import { useEffect } from 'react'
import { useTxKit } from '@txkit/react'

import { usePlayground } from '../PlaygroundContext/PlaygroundContext'


/**
 * Must be rendered INSIDE a <TxKitProvider>. Listens to playground theme
 * (toolbar toggle) and calls setTheme on txKit so the component's own theme
 * tokens follow the playground. Does NOT recreate the wagmi config - just
 * flips the .txkit-dark / .txkit-light class.
 */
const PlaygroundThemeSync = () => {
  const { theme } = usePlayground()
  const { setTheme } = useTxKit()

  useEffect(() => {
    setTheme(theme)
  }, [ theme, setTheme ])

  return null
}


export default PlaygroundThemeSync
