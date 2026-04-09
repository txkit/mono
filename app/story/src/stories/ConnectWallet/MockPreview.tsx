import React, { useState } from 'react'

import type { ControlSchema } from '../../controls/useControls'
import useControls from '../../controls/useControls'
import ControlPanel from '../../controls/ControlPanel'
import StateVisualizer from '../shared/StateVisualizer'


const CW_STATES = [
  { id: 'disconnected', label: 'Disconnected', color: '#64748b' },
  { id: 'connecting', label: 'Connecting', color: '#f59e0b' },
  { id: 'connected', label: 'Connected', color: '#10b981' },
  { id: 'wrong-chain', label: 'Wrong Chain', color: '#ef4444' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'initializing', label: 'Initializing', color: '#94a3b8' },
]

const hashColor = (str: string): string => {
  let hash = 0
  for (let index = 0; index < str.length; index++) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
}

type CwMockProps = {
  state: string
  label: string
  size: string
  variant: string
  showBalance: boolean
  showAvatar: boolean
  showEns: boolean
}

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const CwMockButton: React.FC<CwMockProps> = ({
  state,
  label,
  size,
  variant,
  showBalance,
  showAvatar,
  showEns,
}) => {
  const sizeStyle = size === 'compact' ? { minHeight: 32, padding: '4px 12px', fontSize: 13 } : {}

  switch (state) {
    case 'connected': {
      const displayAddress = showEns ? 'vitalik.eth' : '0xd8dA...6045'
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connected" style={{ pointerEvents: 'none', ...sizeStyle }}>
            {
              showAvatar && (
                <span className="txkit-cw-avatar-fallback" style={{ backgroundColor: hashColor(MOCK_ADDRESS) }}>
                  D8
                </span>
              )
            }
            <span className="txkit-cw-address">{displayAddress}</span>
            {
              showBalance && (
                <span className="txkit-cw-balance">1.23 ETH</span>
              )
            }
          </button>
        </div>
      )
    }
    case 'connecting':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="connecting" disabled style={{ cursor: 'wait', pointerEvents: 'none', ...sizeStyle }}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
            <span>Connecting</span>
          </button>
        </div>
      )
    case 'wrong-chain':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="wrong-chain" style={{ pointerEvents: 'none', ...sizeStyle }}>
            Switch to Mainnet
          </button>
        </div>
      )
    case 'error':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="error" style={{ pointerEvents: 'none', ...sizeStyle }}>
            Try Again
          </button>
        </div>
      )
    case 'initializing':
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="initializing" disabled style={{ pointerEvents: 'none', ...sizeStyle }}>
            <span className="txkit-cw-dots">
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
              <span className="txkit-cw-dot" />
            </span>
          </button>
        </div>
      )
    default:
      return (
        <div className="txkit-cw" data-size={size} data-variant={variant}>
          <button type="button" className="txkit-cw-button" data-state="disconnected" style={{ pointerEvents: 'none', ...sizeStyle }}>
            {label}
          </button>
        </div>
      )
  }
}

const disconnectedControls = {
  label: { type: 'string' as const, default: 'Connect Wallet' },
  size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
  variant: { type: 'select' as const, default: 'default', options: [ 'default', 'outline', 'ghost', 'soft' ] },
}

const connectedControls = {
  showBalance: { type: 'boolean' as const, default: true },
  showAvatar: { type: 'boolean' as const, default: true },
  showEns: { type: 'boolean' as const, default: true },
  size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
}

const minimalControls = {
  size: { type: 'select' as const, default: 'default', options: [ 'default', 'compact' ] },
}

const controlsByState: Record<string, ControlSchema> = {
  disconnected: disconnectedControls,
  connected: connectedControls,
  connecting: minimalControls,
  'wrong-chain': minimalControls,
  error: minimalControls,
  initializing: minimalControls,
}

const CwStateMachineControls: React.FC<{
  state: string
  schema: ControlSchema
}> = ({ state, schema }) => {
  const { values, entries, reset } = useControls(schema)

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card" style={{ marginTop: 8 }}>
        <div className="txkit-root txkit-dark" style={{ display: 'inline-block' }}>
          <CwMockButton
            state={state}
            label={String(values.label ?? 'Connect Wallet')}
            size={String(values.size ?? 'default')}
            variant={String(values.variant ?? 'default')}
            showBalance={Boolean(values.showBalance ?? true)}
            showAvatar={Boolean(values.showAvatar ?? true)}
            showEns={Boolean(values.showEns ?? true)}
          />
        </div>
      </div>
    </>
  )
}

const MockPreview = () => {
  const [ activeState, setActiveState ] = useState('disconnected')
  const schema = controlsByState[activeState] ?? minimalControls

  return (
    <>
      <p className="story-description">Click a state to see how the button looks - no wallet needed</p>
      <StateVisualizer
        states={CW_STATES}
        currentState={activeState}
        onStateClick={setActiveState}
      />
      <CwStateMachineControls key={activeState} state={activeState} schema={schema} />
    </>
  )
}


export default MockPreview
