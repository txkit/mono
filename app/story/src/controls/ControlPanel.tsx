import React from 'react'

import BooleanInput from './BooleanInput'
import StringInput from './StringInput'
import NumberInput from './NumberInput'
import SelectInput from './SelectInput'
import type { ControlEntry } from './useControls'


type ControlPanelProps = {
  entries: ControlEntry[]
  onReset: () => void
}

/** Convert camelCase to human-readable label: "showBalance" -> "Show Balance" */
const humanizeLabel = (key: string): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()

const ControlPanel: React.FC<ControlPanelProps> = ({ entries, onReset }) => {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <span className="control-panel-title">Controls</span>
        <button
          type="button"
          className="control-panel-reset"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      <div className="control-panel-body">
        {
          entries.map((entry) => (
            <div key={entry.key} className="control-item">
              <label className="control-label">{humanizeLabel(entry.key)}</label>
              <div className="control-value">
                {entry.def.type === 'boolean' && <BooleanInput entry={entry} />}
                {entry.def.type === 'string' && <StringInput entry={entry} />}
                {entry.def.type === 'number' && <NumberInput entry={entry} />}
                {entry.def.type === 'select' && <SelectInput entry={entry} />}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}


export default ControlPanel
