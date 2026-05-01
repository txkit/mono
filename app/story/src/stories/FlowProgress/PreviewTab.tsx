import { useMemo } from 'react'
import { FlowProgress } from '@txkit/react'

import useMockFlow from '../TransactionButton/useMockFlow'
import { useControls, ControlPanel, StatePanel, CodeBlock, useTxkitThemeClass } from '../../components'

import { FLOW_STATES } from './states'


const FLOW_ID = 'demo-flow-progress'

// FlowProgress reads flow-level status. useMockFlow accepts step-level states,
// so this map projects each flow-level status onto the closest step-level shape
// that produces the right progress bar colors / shimmer / fill ratio. 'idle'
// and the duplicated in-progress statuses (simulating-all / paused) are
// excluded - they collapse into 'running' for the demo.
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
    stepsCount: { type: 'number' as const, default: 3, min: 1, max: 5, step: 1 },
    showSummary: { type: 'boolean' as const, default: true },
    summaryLabel: { type: 'string' as const, default: 'Overall Progress' },
  }), [])

  const { values, entries, isDefault, reset } = useControls(schema)
  const stateEntry = entries.find((entry) => entry.def.type === 'state')
  const flowState = String(values.state ?? 'running')
  const stepsCount = Math.max(1, Math.min(5, Number(values.stepsCount ?? 3)))
  const stepLevelState = flowToStepState[flowState] ?? 'pending'
  const showSummary = Boolean(values.showSummary ?? true)
  const summaryLabel = String(values.summaryLabel ?? 'Overall Progress')

  useMockFlow({ activeState: stepLevelState, stepsCount, flowId: FLOW_ID })

  const previewSnippet = useMemo(() => {
    const props: string[] = [ `flowId="${FLOW_ID}"` ]
    if (!showSummary) {
      props.push('showSummary={false}')
    }
    if (showSummary && summaryLabel !== 'Overall Progress') {
      props.push(`summaryLabel="${summaryLabel}"`)
    }
    const lines: string[] = [
      "import { FlowProgress } from '@txkit/react'",
      '',
      'const Bar = () => (',
    ]
    if (props.length === 1) {
      lines.push(`  <FlowProgress ${props[0]} />`)
    }
    else {
      lines.push('  <FlowProgress')
      props.forEach((prop) => lines.push(`    ${prop}`))
      lines.push('  />')
    }
    lines.push(')')
    return lines.join('\n')
  }, [ showSummary, summaryLabel ])

  return (
    <>
      <p className="story-description">FlowProgress shimmers while running, switches to terminal colors on completion or error</p>
      <div className="story-live-layout">
        <div className="story-live-left">
          <StatePanel entry={stateEntry} />
          <div className="story-live-preview-card">
            <div className={`tx-root ${txkitThemeClass} story-live-preview-inner story-flow-progress-stage`}>
              <FlowProgress flowId={FLOW_ID} showSummary={showSummary} summaryLabel={summaryLabel} />
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
