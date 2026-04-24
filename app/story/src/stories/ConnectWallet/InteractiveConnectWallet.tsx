import { useMemo } from 'react'
import { mainnet, sepolia } from 'viem/chains'
import { ConnectWallet, useWalletState } from '@txkit/react'

import generateCode from '../../helpers/generateCode'
import { useControls, ControlPanel, CodeBlock } from '../../components'



const chainIdMap: Record<string, number> = {
  mainnet: mainnet.id,
  sepolia: sepolia.id,
}

const allPropKeys: readonly string[] = [
  'label', 'size', 'variant', 'avatarStyle', 'chainId',
  'showBalance', 'showFiat', 'showAvatar', 'showEns',
]

/** Which props visually affect the rendered button in each wallet state */
const activePropsByState: Record<string, readonly string[]> = {
  disconnected: [ 'label', 'size', 'variant' ],
  connecting: [ 'size', 'variant' ],
  connected: [ 'size', 'variant', 'avatarStyle', 'chainId', 'showBalance', 'showFiat', 'showAvatar', 'showEns' ],
  'wrong-chain': [ 'size', 'variant', 'avatarStyle', 'chainId', 'showBalance', 'showFiat', 'showAvatar', 'showEns' ],
  error: [ 'size', 'variant' ],
}

const InteractiveConnectWallet = () => {
  const walletState = useWalletState()

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
  })

  const activeKeys = activePropsByState[walletState.state] ?? []
  const dimmedKeys = allPropKeys.filter((key) => !activeKeys.includes(key))

  const code = useMemo(() => generateCode('ConnectWallet', entries, {
    importLine: "import { ConnectWallet } from '@txkit/react'",
    formatProp: {
      chainId: (value) => `{${value}.id}`,
    },
  }), [ entries ])

  return (
    <div className="story-live-layout">
      <div className="story-live-left">
        <div className="story-live-preview-card">
          <div className="story-live-preview-inner">
            <ConnectWallet
              label={values.label}
              size={values.size as 'default' | 'compact'}
              variant={values.variant as 'default' | 'outline' | 'ghost' | 'soft'}
              avatarStyle={values.avatarStyle as 'gradient' | 'pixel'}
              chainId={chainIdMap[values.chainId]}
              showBalance={values.showBalance}
              showFiat={values.showFiat}
              showAvatar={values.showAvatar}
              showEns={values.showEns}
            />
          </div>
        </div>
        <CodeBlock code={code} />
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          State: <strong style={{ color: '#818cf8' }}>{walletState.state}</strong>
        </div>
      </div>
      <div className="story-live-right">
        <ControlPanel entries={entries} dimmedKeys={dimmedKeys} isDefault={isDefault} onReset={reset} />
      </div>
    </div>
  )
}


export default InteractiveConnectWallet
