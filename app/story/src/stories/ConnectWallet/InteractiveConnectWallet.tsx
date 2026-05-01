import { useMemo } from 'react'
import { mainnet, sepolia } from 'viem/chains'
import { ConnectWallet, useWalletState } from '@txkit/react'

import generateCode from '../../helpers/generateCode'
import { useControls, ControlPanel, CodeBlock, StateDisplay } from '../../components'
import { CW_STATES } from './states'
import RainbowKitDemo from './RainbowKitDemo'



const chainIdMap: Record<string, number> = {
  mainnet: mainnet.id,
  sepolia: sepolia.id,
}

const allPropKeys: readonly string[] = [
  'label', 'size', 'variant', 'avatarStyle', 'chainId',
  'showBalance', 'showFiat', 'showAvatar', 'showEns',
]

const activePropsByState: Record<string, readonly string[]> = {
  disconnected: [ 'label', 'size', 'variant' ],
  connecting: [ 'size', 'variant' ],
  connected: [ 'size', 'variant', 'avatarStyle', 'chainId', 'showBalance', 'showFiat', 'showAvatar', 'showEns' ],
  'wrong-chain': [ 'size', 'variant', 'avatarStyle', 'chainId', 'showBalance', 'showFiat', 'showAvatar', 'showEns' ],
  error: [ 'size', 'variant' ],
}

const rainbowKitSnippet = `import { TxKitProvider, ConnectWallet } from '@txkit/react'
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

const MyComponent = () => {
  const { openConnectModal } = useConnectModal()

  return (
    <ConnectWallet
      onRequestConnect={() => {
        if (!openConnectModal) return false
        openConnectModal()
        return true
      }}
    />
  )
}

const App = () => (
  <TxKitProvider config={txKitConfig}>
    <RainbowKitProvider modalSize="compact" locale="en">
      <MyComponent />
    </RainbowKitProvider>
  </TxKitProvider>
)`

const InteractiveConnectWallet = () => {
  const { values, entries, isDefault, reset } = useControls({
    label: { type: 'string', default: 'Connect Wallet' },
    size: { type: 'select', default: 'default', options: [ 'default', 'compact' ] },
    variant: { type: 'select', default: 'default', options: [ 'default', 'outline', 'ghost', 'soft' ] },
    avatarStyle: { type: 'select', default: 'gradient', options: [ 'gradient', 'pixel' ] },
    chainId: { type: 'select', default: 'mainnet', options: [ 'mainnet', 'sepolia' ] },
    showBalance: { type: 'boolean', default: true },
    showFiat: { type: 'boolean', default: false },
    showAvatar: { type: 'boolean', default: true },
    showEns: { type: 'boolean', default: true },
    withRainbowKit: {
      type: 'boolean',
      default: false,
      fullWidth: true,
      description: 'Render inside an existing RainbowKitProvider (shared wagmi)',
    },
  })

  const size = values.size as 'default' | 'compact'
  const variant = values.variant as 'default' | 'outline' | 'ghost' | 'soft'
  const avatarStyle = values.avatarStyle as 'gradient' | 'pixel'
  const chainId = chainIdMap[values.chainId]

  // Pass the same chainId as ConnectWallet so the StateVisualizer label
  // matches the button visual - otherwise one says `connected` while the
  // button renders `wrong-chain` (or vice versa) whenever the wallet's
  // actual chain differs from the prop.
  const walletState = useWalletState({ chainId })

  const activeKeys = activePropsByState[walletState.state] ?? []
  const dimmedKeys = allPropKeys.filter((key) => !activeKeys.includes(key))

  const generatedCode = useMemo(() => generateCode('ConnectWallet', entries, {
    exclude: [ 'withRainbowKit' ],
    importLine: "import { ConnectWallet } from '@txkit/react'",
    formatProp: {
      chainId: (value) => `{${value}.id}`,
    },
  }), [ entries ])

  const code = values.withRainbowKit ? rainbowKitSnippet : generatedCode

  return (
    <div className="story-live-layout">
      <div className="story-live-left">
        <StateDisplay states={CW_STATES} currentState={walletState.state} />
        <div className="story-live-preview-card">
          <div className="story-live-preview-inner">
            {
              values.withRainbowKit
                ? (
                  <RainbowKitDemo
                    connectLabel={values.label}
                    size={size}
                    variant={variant}
                    avatarStyle={avatarStyle}
                    chainId={chainId}
                    showBalance={values.showBalance}
                    showFiat={values.showFiat}
                    showAvatar={values.showAvatar}
                    showEns={values.showEns}
                  />
                )
                : (
                  <ConnectWallet
                    label={values.label}
                    size={size}
                    variant={variant}
                    avatarStyle={avatarStyle}
                    chainId={chainId}
                    showBalance={values.showBalance}
                    showFiat={values.showFiat}
                    showAvatar={values.showAvatar}
                    showEns={values.showEns}
                  />
                )
            }
          </div>
        </div>
        <CodeBlock code={code} />
      </div>
      <div className="story-live-right">
        <ControlPanel entries={entries} dimmedKeys={dimmedKeys} isDefault={isDefault} onReset={reset} />
      </div>
    </div>
  )
}


export default InteractiveConnectWallet
