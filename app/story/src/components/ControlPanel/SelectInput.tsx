import React from 'react'

import type { ControlEntry } from './useControls'


const SelectInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => {
  const def = entry.def as { type: 'select'; options: string[] }

  return (
    <select
      aria-label={entry.key}
      className="control-select"
      value={entry.value as string}
      onChange={(e) => entry.setValue(e.target.value)}
    >
      {
        def.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))
      }
    </select>
  )
}


export default SelectInput
