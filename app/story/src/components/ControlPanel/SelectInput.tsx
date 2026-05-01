import React, { useState, useRef, useEffect, useCallback } from 'react'

import { CheckIcon, ChevronDownIcon } from '../Icons/icons'
import type { ControlEntry } from './useControls'


type Props = { entry: ControlEntry }

const SelectInput: React.FC<Props> = ({ entry }) => {
  const def = entry.def as { type: 'select'; options: string[] }
  const value = String(entry.value)

  const [ isOpen, setOpen ] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialIndex = def.options.indexOf(value)
  const [ focusedIndex, setFocusedIndex ] = useState(initialIndex >= 0 ? initialIndex : 0)

  useEffect(() => {
    if (isOpen) {
      const next = def.options.indexOf(value)
      setFocusedIndex(next >= 0 ? next : 0)
    }
  }, [ isOpen, value, def.options ])

  const handleSelect = useCallback((option: string) => {
    entry.setValue(option)
    setOpen(false)
    triggerRef.current?.focus()
  }, [ entry ])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault()
        setOpen(false)
      }
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) {
        handleSelect(def.options[focusedIndex])
      }
      else {
        setOpen(true)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        setOpen(true)
        return
      }
      setFocusedIndex((prev) => (prev + 1) % def.options.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setOpen(true)
        return
      }
      setFocusedIndex((prev) => (prev - 1 + def.options.length) % def.options.length)
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} onBlur={handleBlur} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        ref={triggerRef}
        className="control-icon-source-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${entry.key}: ${value}`}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="control-icon-source-label">{value}</span>
        <ChevronDownIcon
          size={14}
          className={isOpen ? 'control-icon-source-chevron rotated' : 'control-icon-source-chevron'}
        />
      </button>
      {
        isOpen && (
          <ul className="control-icon-source-list" role="listbox">
            {
              def.options.map((option, index) => {
                const isSelected = option === value
                const isFocused = index === focusedIndex
                return (
                  <li key={option} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className="control-icon-source-option"
                      data-focused={isFocused ? '' : undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option)}
                    >
                      <span className="control-icon-source-label">{option}</span>
                      {isSelected && <CheckIcon size={14} className="control-icon-source-check" />}
                    </button>
                  </li>
                )
              })
            }
          </ul>
        )
      }
    </div>
  )
}


export default SelectInput
