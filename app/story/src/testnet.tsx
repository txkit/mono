import { createRoot } from 'react-dom/client'

import { ConnectWallet, TokenBalance, TxKitProvider } from '@txkit/react'

import { FaucetCard } from './components'

import '@txkit/themes/index.css'
import './testnet.css'


const exampleCode = `import { TxKitProvider, ConnectWallet, TokenBalance } from '@txkit/react'
import '@txkit/themes'

const App = () => (
  <TxKitProvider config={{ testnet: true }}>
    <ConnectWallet />
    <TokenBalance />
  </TxKitProvider>
)`


// Sample address for rendering TokenBalance in disconnected state. Any valid
// address works - the component queries Sepolia RPC regardless of whether it
// has a balance.
const SAMPLE_ADDRESS = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' as const

const TestnetDemo = () => {
  return (
    <TxKitProvider config={{ testnet: true }}>
      <div className="testnet-demo">
        <header className="testnet-demo__header">
          <h1>txKit Testnet Preset</h1>
          <p>
            Zero-config Sepolia setup. No RPC keys, no chain arrays - just
            <code> testnet: true</code>. ENS resolution works via mainnet in the
            background but mainnet is hidden from the chain selector.
          </p>
        </header>

        <FaucetCard />

        <section className="testnet-demo__section">
          <h2>ConnectWallet</h2>
          <ConnectWallet />
        </section>

        <section className="testnet-demo__section">
          <h2>TokenBalance (native Sepolia ETH)</h2>
          <p className="testnet-demo__hint">
            Querying Sepolia for a sample address - demonstrates the RPC works without any config.
          </p>
          <TokenBalance address={SAMPLE_ADDRESS} showFiat={false} />
        </section>

        <section className="testnet-demo__section">
          <h2>Code</h2>
          <pre className="testnet-demo__code">
            <code>{exampleCode}</code>
          </pre>
        </section>

        <footer className="testnet-demo__footer">
          <a href="/">← Back to playground</a>
        </footer>
      </div>
    </TxKitProvider>
  )
}


createRoot(document.getElementById('root')!).render(<TestnetDemo />)
