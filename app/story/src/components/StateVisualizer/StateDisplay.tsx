import React from 'react'

import StateVisualizer from './StateVisualizer'


type StateNode = {
  id: string
  label: string
  color: string
}

type StateDisplayProps = {
  states?: readonly StateNode[]
  currentState?: string
  onStateClick?: (stateId: string) => void
}

const StateDisplay: React.FC<StateDisplayProps> = (props) => (
  <div className="control-panel state-panel">
    <div className="control-panel-header">
      <span className="control-panel-title">State</span>
    </div>
    <div className="control-panel-body">
      <div className="control-item control-item--full">
        <StateVisualizer {...props} />
      </div>
    </div>
  </div>
)


export default StateDisplay
