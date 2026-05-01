import React from 'react'

import StateDisplay from '../StateVisualizer/StateDisplay'
import type { ControlEntry } from './useControls'


type StatePanelProps = {
  entry: ControlEntry | undefined
}

const StatePanel: React.FC<StatePanelProps> = ({ entry }) => {
  if (!entry || entry.def.type !== 'state') {
    return null
  }

  return (
    <StateDisplay
      states={entry.def.states}
      currentState={entry.value as string}
      onStateClick={(id) => entry.setValue(id)}
    />
  )
}


export default StatePanel
