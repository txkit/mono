import { useMemo } from 'react'
import { useControls, ControlPanel, useTxkitThemeClass } from '../../components'



const TB_STATES = [
  { id: 'loading-inline', label: 'Loading', color: '#3b82f6' },
  { id: 'loading-row', label: 'Loading (Row)', color: '#3b82f6' },
  { id: 'ready', label: 'Ready', color: '#10b981' },
  { id: 'zero', label: 'Zero Balance', color: '#94a3b8' },
  { id: 'error', label: 'Error', color: '#ef4444' },
] as const

const PreviewTab = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'loading-inline', states: TB_STATES },
  }), [])

  const { values, entries, reset } = useControls(schema)
  const activeState = String(values.state ?? 'loading-inline')

  return (
    <>
      <p className="story-description">Click a state to see how TokenBalance renders - no wallet needed</p>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card" style={{ marginTop: 8 }}>
        <div
          className={`txkit-root ${txkitThemeClass}`}
          style={{ display: activeState === 'loading-row' ? 'block' : 'inline-block', maxWidth: 320 }}
        >
          {
            activeState === 'loading-inline' && (
              <span className="txkit-tb" data-state="loading">
                <span className="txkit-tb-icon-wrap">
                  <span className="txkit-tb-icon-fallback" style={{ backgroundColor: '#888' }}>&nbsp;</span>
                </span>
                <span className="txkit-tb-amount">Loading...</span>
                <span className="txkit-tb-fiat">$0.00</span>
              </span>
            )
          }
          {
            activeState === 'loading-row' && (
              <span className="txkit-tb txkit-tb-row" data-state="loading">
                <span className="txkit-tb-icon-wrap">
                  <span className="txkit-tb-icon-fallback" style={{ backgroundColor: '#888' }}>&nbsp;</span>
                </span>
                <span className="txkit-tb-info">
                  <span className="txkit-tb-name">Token Name</span>
                  <span className="txkit-tb-symbol">SYM</span>
                </span>
                <span className="txkit-tb-values">
                  <span className="txkit-tb-amount">0.0000</span>
                  <span className="txkit-tb-fiat">$0.00</span>
                </span>
              </span>
            )
          }
          {
            activeState === 'ready' && (
              <span className="txkit-tb" data-state="ready">
                <span className="txkit-tb-amount">1.2345 ETH</span>
                <span className="txkit-tb-fiat">$4,321.98</span>
              </span>
            )
          }
          {
            activeState === 'zero' && (
              <span className="txkit-tb" data-state="ready" style={{ opacity: 0.5 }}>
                <span className="txkit-tb-amount">0.0000 ETH</span>
                <span className="txkit-tb-fiat">$0.00</span>
              </span>
            )
          }
          {
            activeState === 'error' && (
              <span className="txkit-tb" data-state="error">
                <span className="txkit-tb-amount" style={{ color: 'var(--txkit-color-error, #ef4444)' }}>
                  Failed to load
                </span>
              </span>
            )
          }
        </div>
      </div>
    </>
  )
}


export default PreviewTab
