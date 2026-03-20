import { mainnet, sepolia } from 'viem/chains'
import { TxKitProvider, ConnectWallet, useWalletState } from '@txkit/react'

import StorySection from '../StorySection'
import useControls from '../controls/useControls'
import ControlPanel from '../controls/ControlPanel'
import { usePlayground } from '../PlaygroundContext'
import { defaultConfig, useStoryConfig } from '../config'


const HeadlessWalletExample = () => {
  const {
    state,
    address,
    displayAddress,
    formattedBalance,
    connectors,
    connect,
    disconnect,
  } = useWalletState()

  if (state === 'disconnected') {
    return (
      <div className="headless-wallet-buttons">
        {
          connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="headless-wallet-btn"
              onClick={() => connect({ connector })}
            >
              {connector.name}
            </button>
          ))
        }
      </div>
    )
  }

  if (state === 'connecting') {
    return <span>Connecting...</span>
  }

  return (
    <div>
      <div className="story-info-grid">
        <span className="story-info-key">State</span>
        <span className="story-info-value">{state}</span>
        <span className="story-info-key">Address</span>
        <span className="story-info-value" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{address}</span>
        <span className="story-info-key">Display</span>
        <span className="story-info-value">{displayAddress}</span>
        <span className="story-info-key">Balance</span>
        <span className="story-info-value">{formattedBalance}</span>
      </div>
      <div className="headless-tx-actions" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="headless-tx-btn headless-tx-btn--retry"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

const chainIdMap: Record<string, number> = {
  mainnet: mainnet.id,
  sepolia: sepolia.id,
}

const InteractiveConnectWallet = () => {
  const { values, entries, reset } = useControls({
    label: { type: 'string', default: 'Connect Wallet' },
    showBalance: { type: 'boolean', default: true },
    showAvatar: { type: 'boolean', default: true },
    showEns: { type: 'boolean', default: true },
    chainId: { type: 'select', default: 'mainnet', options: [ 'mainnet', 'sepolia' ] },
  })

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card">
        <ConnectWallet
          label={values.label}
          showBalance={values.showBalance}
          showAvatar={values.showAvatar}
          showEns={values.showEns}
          chainId={chainIdMap[values.chainId]}
        />
      </div>
    </>
  )
}

const DotLoadingDemo = () => (
  <div
    className="txkit-root txkit-dark"
    style={{ display: 'inline-block' }}
  >
    <button
      type="button"
      className="txkit-cw-button"
      data-state="connecting"
      disabled
      style={{ cursor: 'wait' }}
    >
      <span className="txkit-cw-dots">
        <span className="txkit-cw-dot" />
        <span className="txkit-cw-dot" />
        <span className="txkit-cw-dot" />
      </span>
      <span>Connecting</span>
    </button>
  </div>
)

const AvatarFallbackDemo = () => {
  const addresses = [
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xDEADBEEF00000000000000000000000000000000',
  ]

  const hashColor = (str: string): string => {
    let hash = 0
    for (let index = 0; index < str.length; index++) {
      hash = str.charCodeAt(index) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 55%, 45%)`
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {
        addresses.map((address) => (
          <div
            key={address}
            className="txkit-root txkit-dark"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span
              className="txkit-cw-avatar-fallback"
              style={{ backgroundColor: hashColor(address) }}
            >
              {address.slice(2, 4).toUpperCase()}
            </span>
            <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              {address.slice(0, 8)}...
            </span>
          </div>
        ))
      }
    </div>
  )
}


const ConnectWalletStory = () => {
  const { theme, variant } = usePlayground()
  const config = useStoryConfig(defaultConfig, theme, variant)
  const darkConfig = useStoryConfig(defaultConfig, 'dark', variant)
  const lightConfig = useStoryConfig(defaultConfig, 'light', variant)

  return (
    <TxKitProvider config={config}>
      <div>
        <div className="story-section">
          <h3>Interactive</h3>
          <p className="story-description">Toggle props to see changes live</p>
          <InteractiveConnectWallet />
        </div>

        <StorySection
          title="Default"
          code={`<ConnectWallet />`}
        >
          <ConnectWallet />
        </StorySection>

        <StorySection
          title="Custom Label"
          code={`<ConnectWallet label="Sign In" />`}
        >
          <ConnectWallet label="Sign In" />
        </StorySection>

        <StorySection
          title="Dot Loading Animation"
          description="3-dot bounce animation replaces the spinner during connecting state"
        >
          <DotLoadingDemo />
        </StorySection>

        <StorySection
          title="Avatar Fallback"
          description="Deterministic colored circle from address hash when no ENS avatar"
        >
          <AvatarFallbackDemo />
        </StorySection>

        <StorySection
          title="Hide Balance"
          code={`<ConnectWallet showBalance={false} />`}
        >
          <ConnectWallet showBalance={false} />
        </StorySection>

        <StorySection
          title="Hide Avatar"
          code={`<ConnectWallet showAvatar={false} />`}
        >
          <ConnectWallet showAvatar={false} />
        </StorySection>

        <StorySection
          title="Chain Enforcement (Sepolia)"
          description="Requires Sepolia - shows 'Switch Network' when wallet is on a different chain"
          code={`<ConnectWallet chainId={sepolia.id} />`}
        >
          <ConnectWallet chainId={sepolia.id} />
        </StorySection>

        <StorySection
          title="With Callbacks"
          description="Open browser console to see events"
          code={`<ConnectWallet
  onConnect={(data) => console.log('Connected:', data)}
  onDisconnect={() => console.log('Disconnected')}
  onError={(err) => console.log('Error:', err.message)}
/>`}
        >
          <ConnectWallet
            onConnect={(data) => console.log('[txKit] Connected:', data)}
            onDisconnect={() => console.log('[txKit] Disconnected')}
            onError={(error) => console.log('[txKit] Error:', error.message)}
          />
        </StorySection>

        <StorySection
          title="Custom Address Format"
          description="Uses formatAddress prop - visible after connecting a wallet"
          code={`<ConnectWallet
  formatAddress={(addr) => \`\${addr.slice(0, 6)}..\${addr.slice(-2)}\`}
/>`}
        >
          <ConnectWallet
            formatAddress={(address) => `${address.slice(0, 6)}..${address.slice(-2)}`}
          />
        </StorySection>

        <StorySection
          title="Custom Labels (Spanish)"
          description="Full i18n support via labels prop"
          code={`<ConnectWallet
  labels={{
    connect: 'Conectar billetera',
    connecting: 'Conectando...',
    wrongChain: 'Red incorrecta',
    disconnect: 'Desconectar',
    copyAddress: 'Copiar direccion',
    copied: 'Copiado!',
    selectWallet: 'Seleccionar billetera',
    error: 'Error de conexion',
    retry: 'Reintentar',
    whatIsWallet: 'Que es una billetera?',
  }}
/>`}
        >
          <ConnectWallet
            labels={{
              connect: 'Conectar billetera',
              connecting: 'Conectando...',
              wrongChain: 'Red incorrecta',
              disconnect: 'Desconectar',
              copyAddress: 'Copiar direccion',
              copied: 'Copiado!',
              selectWallet: 'Seleccionar billetera',
              error: 'Error de conexion',
              retry: 'Reintentar',
              whatIsWallet: 'Que es una billetera?',
            }}
          />
        </StorySection>

        <StorySection
          title="Custom Render (children-as-function)"
          description="Full control over rendering via render function"
        >
          <ConnectWallet>
            {({ state, displayAddress, formattedBalance, connectors, connect, disconnect }) => (
              <div className="custom-render-row">
                {
                  state === 'disconnected' && (
                    <button
                      type="button"
                      className="custom-render-btn"
                      onClick={() => connectors[0] && connect(connectors[0])}
                    >
                      Custom Connect
                    </button>
                  )
                }
                {
                  state === 'connected' && (
                    <>
                      <span className="custom-render-address">{displayAddress}</span>
                      <span className="custom-render-balance">{formattedBalance}</span>
                      <button
                        type="button"
                        className="custom-render-disconnect"
                        onClick={disconnect}
                      >
                        X
                      </button>
                    </>
                  )
                }
                {
                  state === 'connecting' && <span>Connecting...</span>
                }
              </div>
            )}
          </ConnectWallet>
        </StorySection>

        <div className="story-section">
          <h3>Dark / Light Comparison</h3>
          <p className="story-description">Side-by-side theme preview</p>
          <div className="side-by-side">
            <div className="side-by-side-pane side-by-side-pane--dark">
              <div className="side-by-side-label">Dark</div>
              <TxKitProvider config={darkConfig}>
                <ConnectWallet />
              </TxKitProvider>
            </div>
            <div className="side-by-side-pane side-by-side-pane--light">
              <div className="side-by-side-label">Light</div>
              <TxKitProvider config={lightConfig}>
                <ConnectWallet />
              </TxKitProvider>
            </div>
          </div>
        </div>

        <StorySection
          title="Headless Hook (useWalletState)"
          description="Using useWalletState hook directly for full control"
        >
          <HeadlessWalletExample />
        </StorySection>
      </div>
    </TxKitProvider>
  )
}


export default ConnectWalletStory
