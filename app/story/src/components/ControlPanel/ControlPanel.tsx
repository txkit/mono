import React, { useRef, useState, useCallback } from 'react'

import CodeBlock from '../CodeBlock/CodeBlock'
import ControlItem from './ControlItem'
import ControlStateItem from './ControlStateItem'
import { ChevronDownIcon } from '../Icons/icons'
import type { ControlEntry } from './useControls'


type ControlPanelProps = {
  entries: ControlEntry[]
  dimmedKeys?: readonly string[]
  code?: string
  isDefault?: boolean
  onReset: () => void
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

  if (entries.length === 0) {
    return null
  }

  const dimmedKeysSet: Record<string, true> = {}
  for (const key of dimmedKeys ?? []) {
    dimmedKeysSet[key] = true
  }
  const stateMachine = entries.find((entry) => entry.def.type === 'state')
  const fields = entries.filter((entry) => entry.def.type !== 'boolean' && entry.def.type !== 'state')
  const toggles = entries.filter((entry) => entry.def.type === 'boolean')
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
        {stateMachine && <ControlStateItem key={stateMachine.key} entry={stateMachine} />}
        {dividers[0] && <div className="control-divider" />}
        {
          fields.length > 0 && (
            <div className="control-group">
              {fields.map((entry) => (
                <ControlItem key={entry.key} entry={entry} dimmed={Boolean(dimmedKeysSet[entry.key])} />
              ))}
            </div>
          )
        }
        {dividers[1] && <div className="control-divider" />}
        {
          toggles.length > 0 && (
            <div className="control-group control-group--toggles">
              {toggles.map((entry) => (
                <ControlItem key={entry.key} entry={entry} dimmed={Boolean(dimmedKeysSet[entry.key])} />
              ))}
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
