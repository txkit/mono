import { useTxKit } from '@txkit/react'


const ThemeInfo = () => {
  const { theme, config: resolvedConfig } = useTxKit()

  return (
    <div className="theme-info">
      <p>Theme: <strong>{theme}</strong></p>
      <p>Chains: {resolvedConfig.chains.map((c) => c.name).join(', ')}</p>
      <p>Wallets: {resolvedConfig.wallets.map((w) => w.name).join(', ')}</p>
      <p>AutoConnect: {String(resolvedConfig.autoConnect)}</p>
    </div>
  )
}


export default ThemeInfo
