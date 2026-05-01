import { useMemo } from 'react'
import { FlowSteps } from '@txkit/react'

import useMockFlow from '../TransactionButton/useMockFlow'
import { useControls, ControlPanel, StatePanel, CodeBlock, useTxkitThemeClass } from '../../components'

import { FLOW_STATES } from './states'


const FLOW_ID = 'demo-flow-steps'

// FlowSteps is wired to the visible flow-level statuses, but useMockFlow
// accepts step-level states. This map projects each flow-level status onto the
// closest step-level shape so the indicator renders the right visuals for the
// demo. The three in-progress statuses collapse to a single 'running' entry
// because they render identically.
const flowToStepState: Record<string, string> = {
  'running': 'tx-pending',
  'completed': 'completed',
  'error': 'error',
  'rejected': 'rejected',
  'canceled': 'canceled',
}

const PreviewTab = () => {
  const txkitThemeClass = useTxkitThemeClass()
  const schema = useMemo(() => ({
    state: { type: 'state' as const, default: 'running', states: FLOW_STATES },
    stepsCount: { type: 'number' as const, default: 3, min: 2, max: 5, step: 1 },
    orientation: { type: 'select' as const, default: 'vertical', options: [ 'horizontal', 'vertical' ] },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const stateEntry = entries.find((entry) => entry.def.type === 'state')
  const flowState = String(values.state ?? 'running')
  const stepsCount = Math.max(2, Math.min(5, Number(values.stepsCount ?? 3)))
  const stepLevelState = flowToStepState[flowState] ?? 'pending'
  const orientation = values.orientation === 'horizontal' ? 'horizontal' : 'vertical'

  useMockFlow({ activeState: stepLevelState, stepsCount, flowId: FLOW_ID })

  const previewSnippet = useMemo(() => {
    const props: string[] = [ `flowId="${FLOW_ID}"` ]
    if (orientation !== 'vertical') {
      props.push(`orientation="${orientation}"`)
    }
    const lines: string[] = [
      "import { FlowSteps } from '@txkit/react'",
      '',
      'const Indicator = () => (',
    ]
    if (props.length === 1) {
      lines.push(`  <FlowSteps ${props[0]} />`)
    }
    else {
      lines.push('  <FlowSteps')
      props.forEach((prop) => lines.push(`    ${prop}`))
      lines.push('  />')
    }
    lines.push(')')
    return lines.join('\n')
  }, [ orientation ])

  return (
    <>
      <p className="story-description">FlowSteps reads its flow entry from TxKitProvider context - no prop drilling, just a shared flowId</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <StatePanel entry={stateEntry} />
          <div className="story-live-preview-card">
            <div className={`tx-root ${txkitThemeClass} story-live-preview-inner story-flow-steps-stage`}>
              <FlowSteps flowId={FLOW_ID} orientation={orientation} />
            </div>
          </div>
          <CodeBlock code={previewSnippet} />
        </div>
        <div className="story-live-right">
          <ControlPanel entries={entries} isDefault={isDefault} onReset={reset} />
        </div>
      </div>
    </>
  )
}


export default PreviewTab
