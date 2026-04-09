import React, { useState } from 'react'
import { mainnet, sepolia } from 'viem/chains'
import { TxKitProvider, ConnectWallet, useWalletState } from '@txkit/react'

import StorySection from '../StorySection'
import StateVisualizer from './StateVisualizer'
import useControls from '../controls/useControls'
import ControlPanel from '../controls/ControlPanel'
import { defaultConfig, mainnetOnlyConfig, useStoryConfig } from '../config'


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

const stateHints: Record<string, string> = {
  disconnected: 'label, size, variant',
  connected: 'showBalance, showAvatar, showEns, showChainSelector',
  'wrong-chain': 'chainId (set to sepolia to trigger)',
}

const InteractiveConnectWallet = () => {
  const walletState = useWalletState()

  const { values, entries, reset } = useControls({
    label: { type: 'string', default: 'Connect Wallet' },
    size: { type: 'select', default: 'default', options: [ 'default', 'compact' ] },
    variant: { type: 'select', default: 'default', options: [ 'default', 'outline', 'ghost', 'soft' ] },
    showBalance: { type: 'boolean', default: true },
    showAvatar: { type: 'boolean', default: true },
    showEns: { type: 'boolean', default: true },
    showChainSelector: { type: 'boolean', default: true },
    chainId: { type: 'select', default: 'mainnet', options: [ 'mainnet', 'sepolia' ] },
  })

  const activeHint = stateHints[walletState.state] ?? ''

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
        State: <strong style={{ color: '#818cf8' }}>{walletState.state}</strong>
        {activeHint && <span> - active props: {activeHint}</span>}
      </div>
      <div className="story-card">
        <ConnectWallet
          label={values.label}
          size={values.size as 'default' | 'compact'}
          variant={values.variant as 'default' | 'outline' | 'ghost' | 'soft'}
          showBalance={values.showBalance}
          showAvatar={values.showAvatar}
          showEns={values.showEns}
          showChainSelector={values.showChainSelector}
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


const VariantButton: React.FC<{
  label?: string
  size?: 'default' | 'compact'
  variant?: string
}> = ({ label = 'Connect Wallet', size = 'default', variant = 'default' }) => (
  <div className="txkit-cw" data-size={size} data-variant={variant}>
    <button
      type="button"
      className="txkit-cw-button"
      data-state="disconnected"
    >
      <span>{label}</span>
    </button>
  </div>
)

const SizeVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <VariantButton size="default" />
    <VariantButton size="compact" />
  </div>
)

const ButtonVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <VariantButton variant="default" />
    <VariantButton variant="outline" />
    <VariantButton variant="ghost" />
    <VariantButton variant="soft" />
  </div>
)

const CompactVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <VariantButton size="compact" variant="default" />
    <VariantButton size="compact" variant="outline" />
    <VariantButton size="compact" variant="ghost" />
    <VariantButton size="compact" variant="soft" />
  </div>
)

const CW_STATES = [
  { id: 'disconnected', label: 'Disconnected', color: '#64748b' },
  { id: 'connecting', label: 'Connecting', color: '#f59e0b' },
  { id: 'connected', label: 'Connected', color: '#10b981' },
  { id: 'wrong-chain', label: 'Wrong Chain', color: '#ef4444' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'initializing', label: 'Initializing', color: '#94a3b8' },
]

const hashColor = (str: string): string => {
  let hash = 0
  for (let index = 0; index < str.length; index++) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}

type CwMockProps = {
  state: string
  label: string
  size: string
  variant: string
  showBalance: boolean
  showAvatar: boolean
  showEns: boolean
}

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const CwMockButton: React.FC<CwMockProps> = ({
  state,
  label,
  size,
  variant,
  showBalance,
  showAvatar,
  showEns,
}) => {
  const sizeStyle = size === 'compact' ? { minHeight: 32, padding: '4px 12px', fontSize: 13 } : {}

  switch (state) {
    case 'connected': {
      const displayAddress = showEns ? 'vitalik.eth' : '0xd8dA...6045'
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connected" style={{ pointerEvents: 'none', ...sizeStyle }}>
            {
              showAvatar && (
                <span className="txkit-cw-avatar-fallback" style={{ backgroundColor: hashColor(MOCK_ADDRESS) }}>
                  D8
                </span>
              )
            }
            <span className="txkit-cw-address">{displayAddress}</span>
            {
              showBalance && (
                <span className="txkit-cw-balance">1.23 ETH</span>
              )
            }
          </button>
        </div>
      )
    }
    case 'connecting':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connecting" disabled style={{ cursor: 'wait', pointerEvents: 'none', ...sizeStyle }}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
            <span>Connecting</span>
          </button>
        </div>
      )
    case 'wrong-chain':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="wrong-chain" style={{ pointerEvents: 'none', ...sizeStyle }}>
            Switch to Mainnet
          </button>
        </div>
      )
    case 'error':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="error" style={{ pointerEvents: 'none', ...sizeStyle }}>
            Try Again
          </button>
        </div>
      )
    case 'initializing':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="initializing" disabled style={{ pointerEvents: 'none', ...sizeStyle }}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
          </button>
        </div>
      )
    default:
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="disconnected" style={{ pointerEvents: 'none', ...sizeStyle }}>
            {label}
          </button>
        </div>
      )
  }
}

const disconnectedControls = {
  label: { type: 'string' as const, default: 'Connect Wallet' },
  size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
  variant: { type: 'select' as const, default: 'default', options: [ 'default', 'outline', 'ghost', 'soft' ] },
}

const connectedControls = {
  showBalance: { type: 'boolean' as const, default: true },
  showAvatar: { type: 'boolean' as const, default: true },
  showEns: { type: 'boolean' as const, default: true },
  size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
}

const minimalControls = {
  size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
}

const controlsByState: Record<string, Record<string, { type: string; default: unknown; options?: string[] }>> = {
  disconnected: disconnectedControls,
  connected: connectedControls,
  connecting: minimalControls,
  'wrong-chain': minimalControls,
  error: minimalControls,
  initializing: minimalControls,
}

const CwStateMachineControls: React.FC<{
  state: string
  schema: Record<string, { type: string; default: unknown; options?: string[] }>
}> = ({ state, schema }) => {
  const { values, entries, reset } = useControls(schema)

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card" style={{ marginTop: 8 }}>
        <div className="txkit-root txkit-dark" style={{ display: 'inline-block' }}>
          <CwMockButton
            state={state}
            label={String(values.label ?? 'Connect Wallet')}
            size={String(values.size ?? 'default')}
            variant={String(values.variant ?? 'default')}
            showBalance={Boolean(values.showBalance ?? true)}
            showAvatar={Boolean(values.showAvatar ?? true)}
            showEns={Boolean(values.showEns ?? true)}
          />
        </div>
      </div>
    </>
  )
}

const CwStateMachineSection = () => {
  const [ activeState, setActiveState ] = useState('disconnected')
  const schema = controlsByState[activeState] ?? minimalControls

  return (
    <div className="story-section">
      <div className="story-section-header">
        <h3 className="story-section-title">State Machine</h3>
      </div>
      <p className="story-description">Click a state to see how the button looks in each lifecycle stage</p>
      <StateVisualizer
        states={CW_STATES}
        currentState={activeState}
        onStateClick={setActiveState}
      />
      <CwStateMachineControls key={activeState} state={activeState} schema={schema} />
    </div>
  )
}

const ConnectWalletStory = ({ variant }: { variant: TxKit.Variant }) => {
  const config = useStoryConfig(defaultConfig, 'dark', variant)
  const darkConfig = useStoryConfig(mainnetOnlyConfig, 'dark', variant)
  const lightConfig = useStoryConfig(mainnetOnlyConfig, 'light', variant)

  return (
    <div>
      <CwStateMachineSection />
      <TxKitProvider config={config}>

        <div className="story-section">
          <div className="story-section-header">
            <h3 className="story-section-title">Interactive</h3>
          </div>
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
          title="Button Variants"
          description="Visual styles: default (solid), outline, ghost, soft"
          code={`<ConnectWallet variant="default" />
<ConnectWallet variant="outline" />
<ConnectWallet variant="ghost" />
<ConnectWallet variant="soft" />`}
        >
          <ButtonVariantsDemo />
        </StorySection>

        <StorySection
          title="Compact Variants"
          description="All variants in compact size (32px) for tight navbars"
          code={`<ConnectWallet size="compact" variant="outline" />`}
        >
          <CompactVariantsDemo />
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
          description="Headless - your UI, txKit logic. Full control over rendering via render function"
          headless
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
          <div className="story-section-header">
            <h3 className="story-section-title">Dark / Light Comparison</h3>
          </div>
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
          description="Headless - your UI, txKit logic. Full control via useWalletState hook"
          headless
        >
          <HeadlessWalletExample />
        </StorySection>
      </TxKitProvider>
    </div>
  )
}


export default ConnectWalletStory
