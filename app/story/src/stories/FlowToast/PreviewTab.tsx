import { useState, useMemo } from 'react'
import { FlowToast } from '@txkit/react'

import useMockFlow from '../TransactionButton/useMockFlow'
import { useControls, ControlPanel, StatePanel, CodeBlock, useTxkitThemeClass } from '../../components'

import { FLOW_STATES } from './states'


const FLOW_PRIMARY = 'demo-flow-toast'
const FLOW_SECONDARY = 'demo-flow-toast-2'

// FlowToast surfaces only on terminal flow statuses. The map projects each
// terminal flow-level status onto the step-level shape useMockFlow expects -
// non-terminal values are not offered in the state pill so they are not
// represented here.
const flowToStepState: Record<string, string> = {
  'completed': 'completed',
  'error': 'error',
  'rejected': 'rejected',
  'canceled': 'canceled',
}

const POSITIONS = [ 'top-right', 'top-left', 'bottom-right', 'bottom-left' ]

const PreviewTab = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'completed', states: FLOW_STATES },
    position: { type: 'select' as const, default: 'bottom-right', options: POSITIONS },
    autoDismiss: { type: 'number' as const, default: 5000, min: 0, max: 30_000, step: 500 },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const stateEntry = entries.find((entry) => entry.def.type === 'state')
  const flowState = String(values.state ?? 'completed')
  const stepLevelState = flowToStepState[flowState] ?? 'pending'
  const position = POSITIONS.includes(String(values.position))
    ? (values.position as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left')
    : 'bottom-right'
  const rawAutoDismiss = Number(values.autoDismiss ?? 5000)
  const autoDismiss = Number.isFinite(rawAutoDismiss) ? Math.max(0, rawAutoDismiss) : 5000

  // Trigger version-bumps re-fire the mock flow even when other inputs are
  // unchanged, so a dismissed toast can re-appear on the next click.
  const [ primaryVersion, setPrimaryVersion ] = useState(0)
  const [ secondaryVersion, setSecondaryVersion ] = useState(0)

  // Keep state pristine until the user fires the trigger - prevents an initial
  // toast from appearing on mount without explicit interaction.
  const primaryActive = primaryVersion === 0 ? 'pending' : stepLevelState
  const secondaryActive = secondaryVersion === 0 ? 'pending' : stepLevelState

  useMockFlow({ activeState: primaryActive, stepsCount: 2, flowId: FLOW_PRIMARY, version: primaryVersion })
  useMockFlow({ activeState: secondaryActive, stepsCount: 2, flowId: FLOW_SECONDARY, version: secondaryVersion })

  const previewSnippet = useMemo(() => {
    const props: string[] = [ `flowId="${FLOW_PRIMARY}"` ]
    if (position !== 'bottom-right') {
      props.push(`position="${position}"`)
    }
    if (autoDismiss !== 5000) {
      props.push(`autoDismiss={${autoDismiss}}`)
    }
    const lines: string[] = [
      "import { FlowToast } from '@txkit/react'",
      '',
      'const Notification = () => (',
    ]
    if (props.length === 1) {
      lines.push(`  <FlowToast ${props[0]} />`)
    }
    else {
      lines.push('  <FlowToast')
      props.forEach((prop) => lines.push(`    ${prop}`))
      lines.push('  />')
    }
    lines.push(')')
    return lines.join('\n')
  }, [ position, autoDismiss ])

  return (
    <>
      <p className="story-description">FlowToast portals to document.body and only surfaces on terminal flow statuses - completed, error, rejected, canceled</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <StatePanel entry={stateEntry} />
          <div className="story-live-preview-card">
            <div className={`tx-root ${txkitThemeClass} story-live-preview-inner story-flow-toast-stage`}>
              <p className="story-flow-toast-hint">
                Toast portals to document.body. Pick a terminal state and fire a trigger. Hover or focus pauses auto-dismiss
              </p>
              <FlowToast flowId={FLOW_PRIMARY} position={position} autoDismiss={autoDismiss} />
              <FlowToast flowId={FLOW_SECONDARY} position={position} autoDismiss={autoDismiss} />
            </div>
          </div>
          <CodeBlock code={previewSnippet} />
        </div>
        <div className="story-live-right">
          <ControlPanel entries={entries} isDefault={isDefault} onReset={reset} />
          <div className="story-flow-toast-actions">
            <button
              type="button"
              className="story-toast-trigger"
              onClick={() => setPrimaryVersion((v) => v + 1)}
            >
              Trigger toast
            </button>
            <button
              type="button"
              className="story-toast-trigger"
              onClick={() => setSecondaryVersion((v) => v + 1)}
            >
              Trigger second flow
            </button>
          </div>
        </div>
      </div>
    </>
  )
}


export default PreviewTab
