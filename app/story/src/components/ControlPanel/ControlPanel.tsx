import React, { useRef, useState, useCallback } from 'react'

import CodeBlock from '../CodeBlock/CodeBlock'
import { ChevronDownIcon } from '../Icons/icons'
import BooleanInput from './BooleanInput'
import StringInput from './StringInput'
import NumberInput from './NumberInput'
import SelectInput from './SelectInput'
import type { ControlEntry } from './useControls'


type ControlPanelProps = {
  entries: ControlEntry[]
  dimmedKeys?: readonly string[]
  code?: string
  isDefault?: boolean
  onReset: () => void
}

const renderItem = (entry: ControlEntry, dimmed: boolean) => {
  const description = 'description' in entry.def ? entry.def.description : undefined
  const numberDef = entry.def.type === 'number'
    ? entry.def as { type: 'number'; min?: number; max?: number; step?: number }
    : undefined
  const showNumberValue = numberDef && numberDef.min !== undefined && numberDef.max !== undefined

  return (
    <div
      key={entry.key}
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

const ControlPanel: React.FC<ControlPanelProps> = ({ entries, dimmedKeys, code, isDefault = false, onReset }) => {
  const [ showCode, setShowCode ] = useState(false)
  const [ copied, setCopied ] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleCopy = useCallback(() => {
    if (!code) {
      return
    }
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), 2000)
  }, [ code ])

  const dimmedSet = new Set(dimmedKeys ?? [])
  const fields = entries.filter((e) => e.def.type !== 'boolean' && e.def.type !== 'state')
  const toggles = entries.filter((e) => e.def.type === 'boolean')

  if (fields.length === 0 && toggles.length === 0) {
    return null
  }

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <span className="control-panel-title">Controls</span>
        <button
          type="button"
          className="control-panel-reset"
          disabled={isDefault}
          onClick={onReset}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </div>
      <div className="control-panel-body">
        {
          fields.length > 0 && (
            <div className="control-group">
              {fields.map((entry) => renderItem(entry, dimmedSet.has(entry.key)))}
            </div>
          )
        }
        {fields.length > 0 && toggles.length > 0 && <div className="control-divider" />}
        {
          toggles.length > 0 && (
            <div className="control-group control-group--toggles">
              {toggles.map((entry) => renderItem(entry, dimmedSet.has(entry.key)))}
            </div>
          )
        }
      </div>
      {
        code && (
          <div className="control-code-section">
            <div className="control-divider" />
            <div className="control-code-bar">
              <button
                type="button"
                className="control-code-toggle"
                onClick={() => setShowCode(!showCode)}
              >
                <span className="control-code-badge" aria-hidden="true">&lt;/&gt;</span>
                {showCode ? 'Hide code' : 'Show code'}
              </button>
              <div className="control-code-actions">
                {
                  showCode && (
                    <button
                      type="button"
                      className="control-code-copy"
                      onClick={handleCopy}
                      aria-label="Copy code"
                    >
                      {
                        copied
                          ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )
                          : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )
                      }
                    </button>
                  )
                }
                <ChevronDownIcon
                  size={14}
                  className={`story-code-chevron ${showCode ? 'rotated' : ''}`}
                  onClick={() => setShowCode(!showCode)}
                />
              </div>
            </div>
            {showCode && <CodeBlock code={code} />}
          </div>
        )
      }
    </div>
  )
}


export default ControlPanel
