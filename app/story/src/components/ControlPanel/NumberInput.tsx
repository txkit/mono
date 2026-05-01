import React from 'react'

import type { ControlEntry } from './useControls'


const NumberInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => {
  const def = entry.def as { type: 'number'; min?: number; max?: number; step?: number }
  const value = entry.value as number
  const hasRange = def.min !== undefined && def.max !== undefined
  const id = `control-${entry.key}`

  if (hasRange) {
    const min = def.min ?? 0
    const max = def.max ?? 100
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0
    return (
      <input
        id={id}
        type="range"
        aria-label={entry.key}
        className="control-slider"
        value={value}
        min={min}
        max={max}
        step={def.step ?? 1}
        style={{ '--slider-filled': `${percent}%` } as React.CSSProperties}
        onChange={(e) => entry.setValue(Number(e.target.value))}
      />
    )
  }

  return (
    <input
      id={id}
      type="number"
      aria-label={entry.key}
      className="control-input control-input--number"
      value={value}
      min={def.min}
      max={def.max}
      step={def.step ?? 1}
      onChange={(e) => entry.setValue(Number(e.target.value))}
    />
  )
}


export default NumberInput
