import { useMemo } from 'react'

import CwMockButton from './CwMockButton'
import { useControls, ControlPanel, useTxkitThemeClass } from '../../components'


const CW_STATES = [
  { id: 'disconnected', label: 'Disconnected', color: '#64748b' },
  { id: 'connecting', label: 'Connecting', color: '#f59e0b' },
  { id: 'connected', label: 'Connected', color: '#10b981' },
  { id: 'wrong-chain', label: 'Wrong Chain', color: '#ef4444' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'initializing', label: 'Initializing', color: '#94a3b8' },
] as const


const MockPreview = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'disconnected', states: CW_STATES },
    label: { type: 'string' as const, default: 'Connect Wallet' },
    size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
    variant: { type: 'select' as const, default: 'default', options: [ 'default', 'outline', 'ghost', 'soft' ] },
    showBalance: { type: 'boolean' as const, default: true },
    showAvatar: { type: 'boolean' as const, default: true },
    showEns: { type: 'boolean' as const, default: true },
  }), [])

  const { values, entries, reset } = useControls(schema)

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card" style={{ marginTop: 8 }}>
        <div className={`txkit-root ${txkitThemeClass}`} style={{ display: 'inline-block' }}>
          <CwMockButton
            state={String(values.state ?? 'disconnected')}
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


export default MockPreview
