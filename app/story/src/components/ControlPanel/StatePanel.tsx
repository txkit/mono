import React from 'react'

import StateInput from './StateInput'
import type { ControlEntry } from './useControls'


type StatePanelProps = {
  entry: ControlEntry | undefined
}

const StatePanel: React.FC<StatePanelProps> = ({ entry }) => {
  if (!entry || entry.def.type !== 'state') {
    return null
  }

  return (
    <div className="control-panel state-panel">
      <div className="control-panel-header">
        <span className="control-panel-title">state</span>
      </div>
      <div className="control-panel-body">
        <div className="control-item control-item--full">
          <StateInput entry={entry} />
        </div>
      </div>
    </div>
  )
}


export default StatePanel
