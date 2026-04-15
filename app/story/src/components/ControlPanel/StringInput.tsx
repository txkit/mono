import React from 'react'

import type { ControlEntry } from './useControls'


const StringInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => (
  <input
    type="text"
    aria-label={entry.key}
    className="control-input"
    value={entry.value as string}
    onChange={(e) => entry.setValue(e.target.value)}
  />
)


export default StringInput
