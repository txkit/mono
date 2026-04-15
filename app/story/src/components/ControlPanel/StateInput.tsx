import React from 'react'

import StateVisualizer from '../StateVisualizer/StateVisualizer'
import type { ControlEntry } from './useControls'


const StateInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => {
  if (entry.def.type !== 'state') {
    return null
  }

  return (
    <StateVisualizer
      states={entry.def.states}
      currentState={entry.value as string}
      onStateClick={(id) => entry.setValue(id)}
    />
  )
}


export default StateInput
