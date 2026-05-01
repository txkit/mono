import React from 'react'

import NumberInput from './NumberInput'
import SelectInput from './SelectInput'
import StringInput from './StringInput'
import BooleanInput from './BooleanInput'
import type { ControlEntry } from './useControls'


type ControlItemProps = {
  entry: ControlEntry
  dimmed: boolean
}

const ControlItem: React.FC<ControlItemProps> = ({ entry, dimmed }) => {
  const description = 'description' in entry.def ? entry.def.description : undefined
  const numberDef = entry.def.type === 'number'
    ? entry.def as { type: 'number'; min?: number; max?: number; step?: number }
    : undefined
  const showNumberValue = numberDef && numberDef.min !== undefined && numberDef.max !== undefined

  return (
    <div
      className="control-item"
      data-dimmed={dimmed ? '' : undefined}
      title={dimmed ? 'Inactive in current state' : undefined}
    >
      <div className="control-item-header">
        <label className="control-label">{entry.key}</label>
        {showNumberValue && (
          <span className="control-number-value">{String(entry.value)}</span>
        )}
      </div>
      {description && <p className="control-description">{description}</p>}
      <div className="control-value">
        {entry.def.type === 'boolean' && <BooleanInput entry={entry} />}
        {entry.def.type === 'string' && <StringInput entry={entry} />}
        {entry.def.type === 'number' && <NumberInput entry={entry} />}
        {entry.def.type === 'select' && <SelectInput entry={entry} />}
      </div>
    </div>
  )
}


export default ControlItem
