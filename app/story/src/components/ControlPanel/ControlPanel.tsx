import React from 'react'

import StateInput from './StateInput'
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

const renderItem = (entry: ControlEntry) => (
  <div key={entry.key} className="control-item">
    <label className="control-label">{humanizeLabel(entry.key)}</label>
    <div className="control-value">
      {entry.def.type === 'boolean' && <BooleanInput entry={entry} />}
      {entry.def.type === 'string' && <StringInput entry={entry} />}
      {entry.def.type === 'number' && <NumberInput entry={entry} />}
      {entry.def.type === 'select' && <SelectInput entry={entry} />}
    </div>
  </div>
)

const renderStateItem = (entry: ControlEntry) => (
  <div key={entry.key} className="control-item control-item--full">
    <label className="control-label">{humanizeLabel(entry.key)}</label>
    <StateInput entry={entry} />
  </div>
)

const ControlPanel: React.FC<ControlPanelProps> = ({ entries, onReset }) => {
  if (entries.length === 0) {
    return null
  }

  const stateMachine = entries.find((e) => e.def.type === 'state')
  const fields = entries.filter((e) => e.def.type !== 'boolean' && e.def.type !== 'state')
  const toggles = entries.filter((e) => e.def.type === 'boolean')
  const dividers: boolean[] = [
    Boolean(stateMachine) && (fields.length > 0 || toggles.length > 0),
    fields.length > 0 && toggles.length > 0,
  ]

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
        {stateMachine && renderStateItem(stateMachine)}
        {dividers[0] && <div className="control-divider" />}
        {
          fields.length > 0 && (
            <div className="control-group">
              {fields.map(renderItem)}
            </div>
          )
        }
        {dividers[1] && <div className="control-divider" />}
        {
          toggles.length > 0 && (
            <div className="control-group control-group--toggles">
              {toggles.map(renderItem)}
            </div>
          )
        }
      </div>
    </div>
  )
}


export default ControlPanel
