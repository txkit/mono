import { TxKitProvider, useTxKit, ConnectWallet } from '@txkit/react'

import StorySection from '../StorySection'
import { usePlayground } from '../PlaygroundContext'
import { defaultConfig, useStoryConfig } from '../config'


const ThemeInfo = () => {
  const { theme, setTheme, config: resolvedConfig } = useTxKit()

  return (
    <div className="theme-info">
      <p>Theme: <strong>{theme}</strong></p>
      <p>Chains: {resolvedConfig.chains.map((c) => c.name).join(', ')}</p>
      <p>Wallets: {resolvedConfig.wallets.map((w) => w.name).join(', ')}</p>
      <p>AutoConnect: {String(resolvedConfig.autoConnect)}</p>
      <div className="theme-info-actions">
        <button type="button" className="theme-info-btn" onClick={() => setTheme('light')}>Light</button>
        <button type="button" className="theme-info-btn" onClick={() => setTheme('dark')}>Dark</button>
        <button type="button" className="theme-info-btn" onClick={() => setTheme('auto')}>Auto</button>
      </div>
    </div>
  )
}

const TxKitProviderStory = () => {
  const { theme, variant } = usePlayground()
  const config = useStoryConfig(defaultConfig, theme, variant)
  const darkConfig = useStoryConfig(defaultConfig, 'dark', variant)
  const lightConfig = useStoryConfig(defaultConfig, 'light', variant)

  return (
    <div>
      <StorySection title="Default Config (auto theme)">
        <TxKitProvider config={config}>
          <ConnectWallet />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <StorySection title="Dark Theme">
        <TxKitProvider config={darkConfig}>
          <ConnectWallet />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>

      <StorySection title="Light Theme">
        <TxKitProvider config={lightConfig}>
          <ConnectWallet label="Connect" />
          <ThemeInfo />
        </TxKitProvider>
      </StorySection>
    </div>
  )
}


export default TxKitProviderStory
