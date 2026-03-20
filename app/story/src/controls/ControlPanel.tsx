import React from 'react'
import { useState } from 'react'

import { cx } from '@txkit/core'

import type { ControlEntry } from './useControls'


type ControlPanelProps = {
  entries: ControlEntry[]
  onReset: () => void
}

const BooleanInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => (
  <button
    type="button"
    aria-label={`${entry.key}: ${entry.value ? 'true' : 'false'}`}
    className={cx('control-toggle', { active: entry.value as boolean })}
    onClick={() => entry.setValue(!entry.value)}
  >
    {entry.value ? 'true' : 'false'}
  </button>
)

const StringInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => (
  <input
    type="text"
    aria-label={entry.key}
    className="control-input"
    value={entry.value as string}
    onChange={(e) => entry.setValue(e.target.value)}
  />
)

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

const ControlPanel: React.FC<ControlPanelProps> = ({ entries, onReset }) => {
  const [ collapsed, setCollapsed ] = useState(false)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <button
          type="button"
          className="control-panel-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className={cx('control-panel-chevron', { collapsed })}>&#9660;</span>
          <span className="control-panel-title">Controls</span>
        </button>
        <button
          type="button"
          className="control-panel-reset"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      {
        !collapsed && (
          <div className="control-panel-body">
            {
              entries.map((entry) => (
                <div key={entry.key} className="control-item">
                  <label className="control-label">{entry.key}</label>
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
        )
      }
    </div>
  )
}


export default ControlPanel
