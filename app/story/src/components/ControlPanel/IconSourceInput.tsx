import React, { useState, useRef, useEffect, useCallback } from 'react'

import { CheckIcon, ChevronDownIcon } from '../Icons/icons'
import { ICON_SOURCE_LABELS, ICON_SOURCE_OPTIONS, resolveTokenIconUrl } from '../../helpers/iconSources'
import type { IconSource, IconSourceValue } from '../../helpers/iconSources'
import type { ControlEntry } from './useControls'


type IconAvatarProps = {
  url: string | undefined
  fallback: string
}

const IconAvatar: React.FC<IconAvatarProps> = ({ url, fallback }) => {
  const [ errored, setErrored ] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [ url ])

  if (!url || errored) {
    return (
      <span className="control-icon-source-avatar control-icon-source-avatar--fallback" aria-hidden="true">
        {fallback}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt=""
      className="control-icon-source-avatar"
      onError={() => setErrored(true)}
    />
  )
}

type Props = { entry: ControlEntry }

const IconSourceInput: React.FC<Props> = ({ entry }) => {
  const [ isOpen, setOpen ] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isIconSource = entry.def.type === 'icon-source'
  const value = isIconSource ? entry.value as IconSourceValue : { source: 'none' as IconSource, customUrl: '' }
  const def = isIconSource ? entry.def : null

  const initialIndex = ICON_SOURCE_OPTIONS.indexOf(value.source)
  const [ focusedIndex, setFocusedIndex ] = useState(initialIndex >= 0 ? initialIndex : 0)

  useEffect(() => {
    if (isOpen) {
      const next = ICON_SOURCE_OPTIONS.indexOf(value.source)
      setFocusedIndex(next >= 0 ? next : 0)
    }
  }, [ isOpen, value.source ])

  const handleSelect = useCallback((source: IconSource) => {
    entry.setValue({ source, customUrl: value.customUrl })
    setOpen(false)
    triggerRef.current?.focus()
  }, [ entry, value.customUrl ])

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
        handleSelect(ICON_SOURCE_OPTIONS[focusedIndex])
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
      setFocusedIndex((prev) => (prev + 1) % ICON_SOURCE_OPTIONS.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setOpen(true)
        return
      }
      setFocusedIndex((prev) => (prev - 1 + ICON_SOURCE_OPTIONS.length) % ICON_SOURCE_OPTIONS.length)
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
      setOpen(false)
    }
  }

  const handleCustomUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    entry.setValue({ source: value.source, customUrl: event.target.value })
  }

  if (!def) {
    return null
  }

  const currentUrl = resolveTokenIconUrl(def.tokenAddress, value)
  const fallbackLetter = (def.tokenSymbol[0] ?? '?').toUpperCase()

  return (
    <div className="control-icon-source" ref={containerRef} onBlur={handleBlur}>
      <button
        type="button"
        ref={triggerRef}
        className="control-icon-source-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${entry.key}: ${ICON_SOURCE_LABELS[value.source]}`}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <IconAvatar url={currentUrl} fallback={fallbackLetter} />
        <span className="control-icon-source-label">{ICON_SOURCE_LABELS[value.source]}</span>
        <ChevronDownIcon
          size={14}
          className={isOpen ? 'control-icon-source-chevron rotated' : 'control-icon-source-chevron'}
        />
      </button>
      {
        isOpen && (
          <ul className="control-icon-source-list" role="listbox">
            {
              ICON_SOURCE_OPTIONS.map((option, index) => {
                const optionValue: IconSourceValue = { source: option, customUrl: value.customUrl }
                const url = resolveTokenIconUrl(def.tokenAddress, optionValue)
                const isSelected = option === value.source
                const isFocused = index === focusedIndex
                return (
                  <li key={option} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className="control-icon-source-option"
                      data-focused={isFocused ? '' : undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(option)}
                    >
                      <IconAvatar url={url} fallback={fallbackLetter} />
                      <span className="control-icon-source-label">{ICON_SOURCE_LABELS[option]}</span>
                      {isSelected && <CheckIcon size={14} className="control-icon-source-check" />}
                    </button>
                  </li>
                )
              })
            }
          </ul>
        )
      }
      {
        value.source === 'custom' && (
          <input
            type="url"
            className="control-icon-source-url"
            placeholder="https://example.com/token.png"
            value={value.customUrl}
            onChange={handleCustomUrlChange}
            aria-label="Custom icon URL"
          />
        )
      }
    </div>
  )
}


export default IconSourceInput
