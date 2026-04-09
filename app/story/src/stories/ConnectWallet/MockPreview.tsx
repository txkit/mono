import { useState } from 'react'

import type { ControlSchema } from '../../controls/useControls'
import StateVisualizer from '../shared/StateVisualizer'
import CwStateMachineControls from './CwStateMachineControls'


const CW_STATES = [
  { id: 'disconnected', label: 'Disconnected', color: '#64748b' },
  { id: 'connecting', label: 'Connecting', color: '#f59e0b' },
  { id: 'connected', label: 'Connected', color: '#10b981' },
  { id: 'wrong-chain', label: 'Wrong Chain', color: '#ef4444' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'initializing', label: 'Initializing', color: '#94a3b8' },
]

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
