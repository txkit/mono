import React, { useRef, useState, useEffect } from 'react'

import { InfoGrid, StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import CwMockButton from './CwMockButton'
import CwMockDropdown from './CwMockDropdown'
import DotLoadingDemo from './DotLoadingDemo'
import ButtonVariantsDemo from './ButtonVariantsDemo'
import AvatarFallbackDemo from './AvatarFallbackDemo'
import CompactVariantsDemo from './CompactVariantsDemo'


type CustomRenderMockState = 'disconnected' | 'connecting' | 'connected'

const customRenderMock = (state: CustomRenderMockState) => {
  if (state === 'connected') {
    return (
      <div className="custom-render-row">
        <span className="custom-render-address">vitalik.eth</span>
        <span className="custom-render-balance">1.23 ETH</span>
        <button type="button" className="custom-render-disconnect">X</button>
      </div>
    )
  }
  if (state === 'connecting') {
    return (
      <div className="custom-render-row">
        <span>Connecting...</span>
      </div>
    )
  }
  return (
    <div className="custom-render-row">
      <button type="button" className="custom-render-btn">Custom Connect</button>
    </div>
  )
}


const spanishLabels = {
  connect: 'Conectar billetera',
  connecting: 'Conectando...',
  wrongChain: 'Red incorrecta',
  error: 'Error de conexion',
}

const defaultMock = {
  label: 'Connect Wallet',
  size: 'default',
  variant: 'default',
  showBalance: true,
  showAvatar: true,
  showEns: true,
}


const ConnectedWithDropdown: React.FC<Record<string, unknown>> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [ open, setOpen ] = useState(false)
  const state = String(props.state ?? 'connected')

  useEffect(() => {
    if (!open) {
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ open ])

  return (
    <div ref={wrapperRef} style={{ display: 'inline-block' }}>
      <CwMockButton {...defaultMock} {...props} state={state} interactive onClick={() => setOpen((prev) => !prev)}>
        {open && <CwMockDropdown wrongChain={state === 'wrong-chain'} />}
      </CwMockButton>
    </div>
  )
}


const ExamplesTab = () => (
  <>
    <p className="story-description">Code examples and prop variants - mocks render the connected state without needing a wallet</p>

    <StorySection
      title="Default"
      description="Same component, two states - disconnected before connect, connected after"
      code={dedent`
        // Fresh user - shows "Connect Wallet"
        <ConnectWallet />

        // Same component after user connects - shows avatar + address + balance
        <ConnectWallet />
      `}
    >
      <div className="story-row">
        <CwMockButton {...defaultMock} state="disconnected" />
        <ConnectedWithDropdown />
      </div>
    </StorySection>

    <StorySection
      title="Custom Label"
      code={`<ConnectWallet label="Sign In" />`}
    >
      <CwMockButton {...defaultMock} state="disconnected" label="Sign In" />
    </StorySection>

    <StorySection
      title="Button Variants"
      description="Visual styles: default (solid), outline, ghost, soft"
      code={dedent`
        <ConnectWallet variant="default" />
        <ConnectWallet variant="outline" />
        <ConnectWallet variant="ghost" />
        <ConnectWallet variant="soft" />
      `}
    >
      <ButtonVariantsDemo />
    </StorySection>

    <StorySection
      title="Compact Variants"
      description="All variants in compact size (32px) for tight navbars"
      code={dedent`
        <ConnectWallet size="compact" variant="default" />
        <ConnectWallet size="compact" variant="outline" />
        <ConnectWallet size="compact" variant="ghost" />
        <ConnectWallet size="compact" variant="soft" />
      `}
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
      description="Balance is hidden, avatar + address remain"
      code={`<ConnectWallet showBalance={false} />`}
    >
      <ConnectedWithDropdown state="connected" showBalance={false} />
    </StorySection>

    <StorySection
      title="Hide Avatar"
      description="Address + balance without the avatar circle"
      code={`<ConnectWallet showAvatar={false} />`}
    >
      <ConnectedWithDropdown state="connected" showAvatar={false} />
    </StorySection>

    <StorySection
      title="Show Fiat"
      description="Fiat equivalent next to the native balance"
      code={`<ConnectWallet showFiat />`}
    >
      <ConnectedWithDropdown state="connected" showFiat />
    </StorySection>

    <StorySection
      title="Chain Enforcement (Sepolia)"
      description="Requires Sepolia - amber stripe on left edge signals wrong chain. Click opens the dropdown with an inline switch banner (open the Preview tab to interact)"
      code={`<ConnectWallet chainId={sepolia.id} />`}
    >
      <ConnectedWithDropdown state="wrong-chain" />
    </StorySection>

    <StorySection
      title="Custom Address Format"
      description="formatAddress prop controls the connected-state display"
      code={dedent`
        <ConnectWallet
          formatAddress={(addr) => \`\${addr.slice(0, 6)}..\${addr.slice(-2)}\`}
        />
      `}
    >
      <ConnectedWithDropdown
        state="connected"
        showEns={false}
        formatAddress={(address: string) => `${address.slice(0, 6)}..${address.slice(-2)}`}
      />
    </StorySection>

    <StorySection
      title="Custom Labels (Spanish)"
      description="Full i18n support via labels prop - preview shows disconnected / connecting / wrong-chain side-by-side"
      code={dedent`
        const labels = {
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
        }

        <ConnectWallet labels={labels} />
      `}
    >
      <div className="story-row">
        <CwMockButton {...defaultMock} state="disconnected" labels={spanishLabels} />
        <CwMockButton {...defaultMock} state="connecting" labels={spanishLabels} />
        <CwMockButton {...defaultMock} state="wrong-chain" labels={spanishLabels} />
      </div>
    </StorySection>

    <StorySection
      title="Custom Render (children-as-function)"
      description="Headless - your UI, txKit logic. All three states rendered from the same render function"
      code={dedent`
        <ConnectWallet>
          {({ state, displayAddress, formattedBalance, connectors, connect, disconnect }) => {
            if (state === 'connected') return <ConnectedUI ... />
            if (state === 'connecting') return <ConnectingUI />
            return <DisconnectedUI onClick={() => connect(connectors[0])} />
          }}
        </ConnectWallet>
      `}
      headless
    >
      <div className="story-row">
        {customRenderMock('disconnected')}
        {customRenderMock('connecting')}
        {customRenderMock('connected')}
      </div>
    </StorySection>

    <StorySection
      title="Dark / Light Comparison"
      description="Theme classes are applied via CSS wrappers - no nested TxKitProvider (anti-pattern - each instance spawns its own wagmi + QueryClient)"
    >
      <div className="side-by-side">
        <div className="side-by-side-pane side-by-side-pane--dark">
          <div className="side-by-side-label">Dark</div>
          <div className="txkit-root txkit-dark">
            <CwMockButton {...defaultMock} state="connected" />
          </div>
        </div>
        <div className="side-by-side-pane side-by-side-pane--light">
          <div className="side-by-side-label">Light</div>
          <div className="txkit-root txkit-light">
            <CwMockButton {...defaultMock} state="connected" />
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Headless Hook (useWalletState)"
      description="Headless - your UI, txKit logic. Full data access via useWalletState hook"
      headless
      code={dedent`
        const { state, address, displayAddress, formattedBalance, connect, disconnect } = useWalletState()
      `}
    >
      <InfoGrid entries={[
        { label: 'State', value: 'connected' },
        { label: 'Address', value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', mono: true },
        { label: 'Display', value: 'vitalik.eth' },
        { label: 'Balance', value: '1.23 ETH' },
      ]} />
    </StorySection>
  </>
)


export default ExamplesTab
