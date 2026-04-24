import { useMemo } from 'react'
import { useControls, ControlPanel, StatePanel, useTxkitThemeClass } from '../../components'
import TbMockBalance from './TbMockBalance'


const TB_STATES = [
  { id: 'loading', label: 'Loading', color: '#3b82f6' },
  { id: 'ready', label: 'Ready', color: '#10b981' },
  { id: 'zero', label: 'Zero Balance', color: '#94a3b8' },
  { id: 'error', label: 'Error', color: '#ef4444' },
] as const

type MockState = 'loading' | 'ready' | 'zero' | 'error'

const PreviewTab = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'loading', states: TB_STATES },
    variant: { type: 'select' as const, default: 'inline', options: [ 'inline', 'row' ] },
    showFiat: { type: 'boolean' as const, default: true },
    showIcon: { type: 'boolean' as const, default: true },
    showSymbol: { type: 'boolean' as const, default: true },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const activeState = String(values.state ?? 'loading') as MockState
  const stateEntry = entries.find((e) => e.def.type === 'state')
  const isRow = values.variant === 'row'

  return (
    <>
      <p className="story-description">Click a state to see how TokenBalance renders - no wallet needed</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <StatePanel entry={stateEntry} />
          <div className="story-live-preview-card">
            <div
              className={`txkit-root ${txkitThemeClass} story-live-preview-inner`}
              style={{ display: isRow ? 'block' : 'inline-block', maxWidth: 320 }}
            >
              <TbMockBalance
                state={activeState}
                variant={isRow ? 'row' : 'inline'}
                name="Ether"
                symbol="ETH"
                amount="1.2345"
                fiat="$4,321.98"
                showFiat={Boolean(values.showFiat ?? true)}
                showIcon={Boolean(values.showIcon ?? true)}
                showSymbol={Boolean(values.showSymbol ?? true)}
              />
            </div>
          </div>
        </div>
        <div className="story-live-right">
          <ControlPanel entries={entries} isDefault={isDefault} onReset={reset} />
        </div>
      </div>
    </>
  )
}


export default PreviewTab
