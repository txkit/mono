import React from 'react'

import type { ControlEntry } from './useControls'


const NumberInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => {
  const def = entry.def as { type: 'number'; min?: number; max?: number; step?: number }

  return (
    <input
      type="number"
      aria-label={entry.key}
      className="control-input control-input--number"
      value={entry.value as number}
      min={def.min}
      max={def.max}
      step={def.step ?? 1}
      onChange={(e) => entry.setValue(Number(e.target.value))}
    />
  )
}


export default NumberInput
