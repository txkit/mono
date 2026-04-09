import { mainnet, sepolia } from 'viem/chains'
import { ConnectWallet, useWalletState } from '@txkit/react'

import useControls from '../../controls/useControls'
import ControlPanel from '../../controls/ControlPanel'


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


export default InteractiveConnectWallet
