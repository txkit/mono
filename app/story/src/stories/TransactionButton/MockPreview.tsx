import { useMemo } from 'react'
import { useControls, ControlPanel, useTxkitThemeClass } from '../../components'



const TXB_STATES = [
  { id: 'pending', label: 'Pending', color: '#64748b' },
  { id: 'simulating', label: 'Simulating', color: '#f59e0b' },
  { id: 'confirming-risk', label: 'Confirming', color: '#f59e0b' },
  { id: 'simulation-failed', label: 'Sim Failed', color: '#ef4444' },
  { id: 'signing', label: 'Signing', color: '#3b82f6' },
  { id: 'tx-pending', label: 'Tx Pending', color: '#3b82f6' },
  { id: 'waiting', label: 'Waiting', color: '#8b5cf6' },
  { id: 'completed', label: 'Completed', color: '#10b981' },
  { id: 'skipped', label: 'Skipped', color: '#94a3b8' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'rejected', label: 'Rejected', color: '#f97316' },
  { id: 'canceled', label: 'Canceled', color: '#6b7280' },
] as const

const stateLabels: Record<string, string> = {
  pending: 'Send 0.001 ETH',
  simulating: 'Simulating...',
  'confirming-risk': 'Confirm Risk',
  'simulation-failed': 'Simulation Failed',
  signing: 'Confirm in Wallet',
  'tx-pending': 'Transaction Pending',
  waiting: 'Waiting...',
  completed: 'Completed',
  skipped: 'Skipped',
  error: 'Error - Try Again',
  rejected: 'Rejected',
  canceled: 'Canceled',
}

const disabledStates: readonly string[] = [ 'signing', 'tx-pending', 'waiting' ]

const MockPreview = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'pending', states: TXB_STATES },
  }), [])

  const { values, entries, reset } = useControls(schema)
  const activeState = String(values.state ?? 'pending')
  const dataState = activeState === 'pending' ? 'idle' : activeState

  return (
    <>
      <p className="story-description">Click a state to see how the button looks - no wallet needed</p>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card" style={{ marginTop: 8 }}>
        <div className={`txkit-root ${txkitThemeClass}`} style={{ display: 'inline-block' }}>
          <div className="txkit-txb">
            <button
              type="button"
              className="txkit-txb-button"
              data-state={dataState}
              disabled={disabledStates.includes(activeState)}
              style={{ pointerEvents: 'none' }}
            >
              {stateLabels[activeState] ?? 'Send 0.001 ETH'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}


export default MockPreview
