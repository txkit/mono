import { sepolia } from 'viem/chains'
import { ConnectWallet } from '@txkit/react'

import { StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import DotLoadingDemo from './DotLoadingDemo'
import ButtonVariantsDemo from './ButtonVariantsDemo'
import AvatarFallbackDemo from './AvatarFallbackDemo'
import CompactVariantsDemo from './CompactVariantsDemo'
import HeadlessWalletExample from './HeadlessWalletExample'


const ExamplesTab = () => (
  <>
    <p className="story-description">Code examples and advanced usage patterns</p>
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
      code={dedent`
        <ConnectWallet
          onConnect={(data) => console.log('Connected:', data)}
          onDisconnect={() => console.log('Disconnected')}
          onError={(err) => console.log('Error:', err.message)}
        />
      `}
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
      code={dedent`
        <ConnectWallet
          formatAddress={(addr) => \`\${addr.slice(0, 6)}..\${addr.slice(-2)}\`}
        />
      `}
    >
      <ConnectWallet
        formatAddress={(address) => `${address.slice(0, 6)}..${address.slice(-2)}`}
      />
    </StorySection>

    <StorySection
      title="Custom Labels (Spanish)"
      description="Full i18n support via labels prop"
      code={dedent`
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
      `}
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
      <p className="story-description">
        Side-by-side theme preview. Theme classes are applied via CSS wrappers - no nested
        TxKitProvider (which is an anti-pattern: each instance spawns its own wagmi + QueryClient).
      </p>
      <div className="side-by-side">
        <div className="side-by-side-pane side-by-side-pane--dark">
          <div className="side-by-side-label">Dark</div>
          <div className="txkit-root txkit-dark">
            <ConnectWallet />
          </div>
        </div>
        <div className="side-by-side-pane side-by-side-pane--light">
          <div className="side-by-side-label">Light</div>
          <div className="txkit-root txkit-light">
            <ConnectWallet />
          </div>
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
  </>
)


export default ExamplesTab
