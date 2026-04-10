import React from 'react'


type StateNode = {
  id: string
  label: string
  color: string
}

const DEFAULT_STATES: readonly StateNode[] = [
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
]

type StateVisualizerProps = {
  states?: readonly StateNode[]
  currentState?: string
  onStateClick?: (stateId: string) => void
}

const StateVisualizer: React.FC<StateVisualizerProps> = ({
  states = DEFAULT_STATES,
  currentState = 'idle',
  onStateClick,
}) => {
  const activeIndex = states.findIndex((st) => st.id === currentState)

  return (
    <div className="state-visualizer">
      <div className="state-flow">
        {
          states.map((state, index) => {
            const isActive = index === activeIndex
            const isPast = activeIndex >= 0 && index < activeIndex
            const isFuture = activeIndex >= 0 && index > activeIndex
            const isClickable = Boolean(onStateClick)
            const nextState = states[index + 1]
            // Connector takes the color of the NEXT state it's leading into (v0 pattern).
            const connectorColor = isPast && nextState ? nextState.color : '#334155'

            const nodeClasses = [
              'state-node',
              isActive && 'active',
              isPast && 'past',
              isFuture && 'future',
              isClickable && 'clickable',
            ].filter(Boolean).join(' ')

            return (
              <div key={state.id} className="state-node-wrapper">
                <button
                  type="button"
                  className={nodeClasses}
                  style={{ '--state-color': state.color } as React.CSSProperties}
                  onClick={() => onStateClick?.(state.id)}
                >
                  <span
                    className="state-dot"
                    style={{ background: isActive || isPast ? state.color : undefined }}
                  />
                  <span className="state-label">{state.label}</span>
                </button>
                {
                  index < states.length - 1 && (
                    <div
                      className="state-connector"
                      style={{ background: connectorColor }}
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
}


export default StateVisualizer
