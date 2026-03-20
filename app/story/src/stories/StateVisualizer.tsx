import React from 'react'


const STATES = [
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

type StateVisualizerProps = {
  currentState?: string
  onStateClick?: (stateId: string) => void
}

const StateVisualizer: React.FC<StateVisualizerProps> = ({ currentState = 'idle', onStateClick }) => (
  <div className="state-visualizer">
    <div className="state-flow">
      {
        STATES.map((s, i) => {
          const isActive = s.id === currentState
          const isPast = STATES.findIndex((st) => st.id === currentState) > i
          const isClickable = Boolean(onStateClick)

          return (
            <div key={s.id} className="state-node-wrapper">
              <button
                type="button"
                className={`state-node ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isClickable ? 'clickable' : ''}`}
                style={{
                  '--state-color': s.color,
                  borderColor: isActive ? s.color : undefined,
                  background: isActive ? `${s.color}20` : undefined,
                } as React.CSSProperties}
                onClick={() => onStateClick?.(s.id)}
              >
                <div
                  className="state-dot"
                  style={{ background: isActive || isPast ? s.color : '#334155' }}
                />
                <span className="state-label">{s.label}</span>
              </button>
              {
                i < STATES.length - 1 && (
                  <div
                    className="state-connector"
                    style={{ background: isPast ? s.color : '#334155' }}
                  />
                )
              }
            </div>
          )
        })
      }
    </div>
  </div>
)


export default StateVisualizer
