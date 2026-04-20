import { useRef, useMemo, useState, useEffect } from 'react'

import CwMockButton from './CwMockButton'
import CwMockDropdown from './CwMockDropdown'
import { useControls, ControlPanel, useTxkitThemeClass } from '../../components'


const CW_STATES = [
  { id: 'disconnected', label: 'Disconnected', color: '#64748b' },
  { id: 'connecting', label: 'Connecting', color: '#f59e0b' },
  { id: 'connected', label: 'Connected', color: '#10b981' },
  { id: 'wrong-chain', label: 'Wrong Chain', color: '#f59e0b' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'initializing', label: 'Initializing', color: '#94a3b8' },
] as const

const dropdownStates: readonly string[] = [ 'connected', 'wrong-chain' ]

const allPropKeys: readonly string[] = [
  'label', 'size', 'variant', 'avatarStyle',
  'showBalance', 'showFiat', 'showAvatar', 'showEns',
]

const activePropsByState: Record<string, readonly string[]> = {
  disconnected: [ 'label', 'size', 'variant' ],
  connecting: [ 'size' ],
  connected: [ 'size', 'variant', 'avatarStyle', 'showBalance', 'showFiat', 'showAvatar', 'showEns' ],
  'wrong-chain': [ 'size', 'variant', 'avatarStyle', 'showBalance', 'showFiat', 'showAvatar', 'showEns' ],
  error: [ 'size', 'variant' ],
  initializing: [ 'size' ],
}


const MockPreview = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [ dropdownOpen, setDropdownOpen ] = useState(false)

  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'disconnected', states: CW_STATES },
    label: { type: 'string' as const, default: 'Connect Wallet' },
    size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
    variant: { type: 'select' as const, default: 'default', options: [ 'default', 'outline', 'ghost', 'soft' ] },
    avatarStyle: { type: 'select' as const, default: 'gradient', options: [ 'gradient', 'pixel' ] },
    showBalance: { type: 'boolean' as const, default: true },
    showFiat: { type: 'boolean' as const, default: false },
    showAvatar: { type: 'boolean' as const, default: true },
    showEns: { type: 'boolean' as const, default: true },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const currentState = String(values.state ?? 'disconnected')
  const canToggleDropdown = dropdownStates.includes(currentState)
  const activeKeys = activePropsByState[currentState] ?? []
  const dimmedKeys = allPropKeys.filter((key) => !activeKeys.includes(key))

  // Close dropdown when leaving a dropdown-capable state
  useEffect(() => {
    if (!canToggleDropdown) {
      setDropdownOpen(false)
    }
  }, [ canToggleDropdown ])

  // Click outside closes dropdown (mock equivalent of useClickOutside)
  useEffect(() => {
    if (!dropdownOpen) {
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ dropdownOpen ])

  const handleButtonClick = () => {
    if (canToggleDropdown) {
      setDropdownOpen((prev) => !prev)
    }
  }

  const hint = (() => {
    if (currentState === 'connected') {
      return ' - click the button to toggle the dropdown'
    }
    if (currentState === 'wrong-chain') {
      return ' - click to see mismatch banner in dropdown'
    }
    return ''
  })()

  return (
    <>
      <p className="story-description">Mock component - switch states to preview each visual without a wallet</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <div className="story-live-preview-card">
            <div ref={wrapperRef} className={`txkit-root ${txkitThemeClass} story-live-preview-inner`} style={{ display: 'flex', justifyContent: 'center' }}>
              <CwMockButton
                state={currentState}
                label={String(values.label ?? 'Connect Wallet')}
                size={String(values.size ?? 'default')}
                variant={String(values.variant ?? 'default')}
                avatarStyle={String(values.avatarStyle ?? 'gradient')}
                showBalance={Boolean(values.showBalance ?? true)}
                showFiat={Boolean(values.showFiat ?? false)}
                showAvatar={Boolean(values.showAvatar ?? true)}
                showEns={Boolean(values.showEns ?? true)}
                interactive={canToggleDropdown}
                onClick={handleButtonClick}
              >
                {dropdownOpen && canToggleDropdown && <CwMockDropdown wrongChain={currentState === 'wrong-chain'} />}
              </CwMockButton>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--pg-muted-fg)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            State: <strong style={{ color: 'var(--pg-primary-text)' }}>{currentState}</strong>
            {hint && <span>{hint}</span>}
          </div>
        </div>
        <div className="story-live-right">
          <ControlPanel entries={entries} dimmedKeys={dimmedKeys} isDefault={isDefault} onReset={reset} />
        </div>
      </div>
    </>
  )
}


export default MockPreview
