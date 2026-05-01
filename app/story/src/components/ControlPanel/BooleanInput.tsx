import React from 'react'

import type { ControlEntry } from './useControls'


const BooleanInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => {
  const checked = entry.value as boolean
  const id = `control-${entry.key}`

  return (
    <label className="control-switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="control-switch-input"
        checked={checked}
        onChange={(e) => entry.setValue(e.target.checked)}
      />
      <span className="control-switch-track" aria-hidden="true">
        <span className="control-switch-thumb" />
      </span>
      <span className="control-switch-label">{checked ? 'Enabled' : 'Disabled'}</span>
    </label>
  )
}


export default BooleanInput
