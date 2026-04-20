import { useMemo } from 'react'
import { useControls, ControlPanel, useTxkitThemeClass } from '../../components'
import TbMockBalance from './TbMockBalance'


const TB_STATES = [
  { id: 'loading-inline', label: 'Loading', color: '#3b82f6' },
  { id: 'loading-row', label: 'Loading (Row)', color: '#3b82f6' },
  { id: 'ready', label: 'Ready', color: '#10b981' },
  { id: 'ready-row', label: 'Ready (Row)', color: '#10b981' },
  { id: 'zero', label: 'Zero Balance', color: '#94a3b8' },
  { id: 'error', label: 'Error', color: '#ef4444' },
] as const

const PreviewTab = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'loading-inline', states: TB_STATES },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const activeState = String(values.state ?? 'loading-inline')

  const isRow = activeState === 'loading-row' || activeState === 'ready-row'
  const variant: 'inline' | 'row' = isRow ? 'row' : 'inline'

  let mockState: 'loading' | 'ready' | 'zero' | 'error' = 'ready'
  if (activeState === 'loading-inline' || activeState === 'loading-row') {
    mockState = 'loading'
  } else if (activeState === 'zero') {
    mockState = 'zero'
  } else if (activeState === 'error') {
    mockState = 'error'
  }

  return (
    <>
      <p className="story-description">Click a state to see how TokenBalance renders - no wallet needed</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <div className="story-live-preview-card">
            <div
              className={`txkit-root ${txkitThemeClass} story-live-preview-inner`}
              style={{ display: isRow ? 'block' : 'inline-block', maxWidth: 320 }}
            >
              <TbMockBalance
                state={mockState}
                variant={variant}
                name="Ether"
                symbol="ETH"
                amount="1.2345"
                fiat="$4,321.98"
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
