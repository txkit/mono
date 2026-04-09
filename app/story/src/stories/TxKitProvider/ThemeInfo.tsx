import { useTxKit } from '@txkit/react'


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


export default ThemeInfo
