import React, { useRef, useState, useEffect } from 'react'

import dedent from '../../helpers/dedent'
import CwMockButton from './CwMockButton'
import CwMockDropdown from './CwMockDropdown'
import { InfoGrid, StorySection } from '../../components'


type CustomRenderMockState = 'disconnected' | 'connecting' | 'connected'

const customRenderMock = (state: CustomRenderMockState) => {
  if (state === 'connected') {
    return (
      <div className="custom-render-row">
        <span className="custom-render-address">alice.eth</span>
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

const spanishDropdownLabels = {
  copyAddress: 'Copiar direccion',
  copied: 'Copiado!',
  disconnect: 'Desconectar',
  switchTo: 'Cambiar a Sepolia',
}

const defaultMock = {
  label: 'Connect Wallet',
  size: 'default',
  variant: 'default',
  showBalance: true,
  showAvatar: true,
  showEns: true,
}


type DropdownLabels = {
  copyAddress?: string
  copied?: string
  disconnect?: string
  switchTo?: string
}

const ConnectedWithDropdown: React.FC<Record<string, unknown> & { dropdownLabels?: DropdownLabels }> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [ open, setOpen ] = useState(false)
  const state = String(props.state ?? 'connected')
  const { dropdownLabels, ...rest } = props

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
      <CwMockButton {...defaultMock} {...rest} state={state} interactive onClick={() => setOpen((prev) => !prev)}>
        {open && <CwMockDropdown wrongChain={state === 'wrong-chain'} labels={dropdownLabels} />}
      </CwMockButton>
    </div>
  )
}


const ExamplesTab = () => (
  <>
    <p className="story-description">Production recipes for ConnectWallet. Each example pairs a use-case hint with a copyable snippet</p>

    <StorySection
      title="Default"
      useWhen="Drop in for greenfield apps without an existing wallet kit. Same component renders disconnected and connected states from a single mount"
      code={dedent`
        import { ConnectWallet } from '@txkit/react'

        const Header = () => (
          <ConnectWallet />
        )
      `}
    >
      <div className="story-row">
        <CwMockButton {...defaultMock} state="disconnected" />
        <ConnectedWithDropdown />
      </div>
    </StorySection>

    <StorySection
      title="Custom Label + i18n (Spanish)"
      useWhen="Override label + labels for non-English UIs or branded copy. Works for every state including modal text"
      code={dedent`
        import { ConnectWallet } from '@txkit/react'
        import { sepolia } from 'viem/chains'

        const labels = {
          connect: 'Conectar billetera',
          connecting: 'Conectando...',
          wrongChain: 'Red incorrecta',
          switchTo: 'Cambiar a {chain}',
          disconnect: 'Desconectar',
          copyAddress: 'Copiar direccion',
          copied: 'Copiado!',
          selectWallet: 'Seleccionar billetera',
          error: 'Error de conexion',
          retry: 'Reintentar',
          whatIsWallet: 'Que es una billetera?',
        }

        const Header = () => (
          <ConnectWallet
            label="Conectar Cartera"
            labels={labels}
            chainId={sepolia.id}
          />
        )
      `}
    >
      <div className="story-row">
        <CwMockButton {...defaultMock} state="disconnected" labels={spanishLabels} />
        <CwMockButton {...defaultMock} state="connecting" labels={spanishLabels} />
        <ConnectedWithDropdown state="wrong-chain" labels={spanishLabels} dropdownLabels={spanishDropdownLabels} />
      </div>
    </StorySection>

    <StorySection
      title="Chain Enforcement"
      useWhen="Force a specific chain (e.g. Sepolia testnet) and surface a switch-network prompt. Amber stripe signals wrong chain at a glance"
      code={dedent`
        import { ConnectWallet } from '@txkit/react'
        import { sepolia } from 'viem/chains'

        const ConnectButton = () => (
          <ConnectWallet chainId={sepolia.id} />
        )
      `}
    >
      <ConnectedWithDropdown state="wrong-chain" />
    </StorySection>

    <StorySection
      title="Custom Address Format"
      useWhen="Tweak the rendered address (truncate logic, ENS preference). Receives raw address + ensName, returns a string"
      code={dedent`
        import { ConnectWallet } from '@txkit/react'

        const Header = () => (
          <ConnectWallet
            showEns={false}
            formatAddress={(address) => \`\${address.slice(0, 6)}..\${address.slice(-2)}\`}
          />
        )
      `}
    >
      <ConnectedWithDropdown
        state="connected"
        showEns={false}
        formatAddress={(address: string) => `${address.slice(0, 6)}..${address.slice(-2)}`}
      />
    </StorySection>

    <StorySection
      title="Custom Render (children-as-function)"
      useWhen="Reuse the wallet state machine with your own UI. Component owns logic, you own pixels. Same render covers all states"
      headless
      code={dedent`
        import { ConnectWallet } from '@txkit/react'

        const Header = () => (
          <ConnectWallet>
            {({ state, displayAddress, formattedBalance, connectors, connect, disconnect }) => {
              if (state === 'connected') {
                return (
                  <button onClick={disconnect}>
                    {displayAddress} - {formattedBalance}
                  </button>
                )
              }

              if (state === 'connecting') {
                return <span>Connecting...</span>
              }

              return (
                <button onClick={() => connect({ connector: connectors[0] })}>
                  Sign In
                </button>
              )
            }}
          </ConnectWallet>
        )
      `}
    >
      <div className="story-row">
        {customRenderMock('disconnected')}
        {customRenderMock('connecting')}
        {customRenderMock('connected')}
      </div>
    </StorySection>

    <StorySection
      title="useWalletState (headless)"
      useWhen="Drop the component entirely; build wallet UX from primitives. Full data access without rendering anything from txKit"
      headless
      code={dedent`
        import { useWalletState } from '@txkit/react'

        const HeaderWallet = () => {
          const {
            state,
            address,
            connect,
            connectors,
            disconnect,
            displayAddress,
            formattedBalance,
          } = useWalletState()

          if (state === 'disconnected') {
            return connectors.map((connector) => (
              <button key={connector.uid} onClick={() => connect({ connector })}>
                {connector.name}
              </button>
            ))
          }

          if (state === 'connecting') {
            return <span>Connecting...</span>
          }

          return (
            <div>
              <span>{displayAddress}</span>
              <span>{formattedBalance}</span>
              <button onClick={() => disconnect()}>Disconnect</button>
            </div>
          )
        }
      `}
    >
      <InfoGrid entries={[
        { label: 'State', value: 'connected' },
        { label: 'Address', value: '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51', mono: true },
        { label: 'Display', value: 'alice.eth' },
        { label: 'Balance', value: '1.23 ETH' },
      ]} />
    </StorySection>
  </>
)


export default ExamplesTab
