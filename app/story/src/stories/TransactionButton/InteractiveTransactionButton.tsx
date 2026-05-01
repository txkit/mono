import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { sepolia } from 'viem/chains'
import { TransactionButton, FlowSteps, FlowProgress, FlowToast, useFlowState } from '@txkit/react'

import generateCode from '../../helpers/generateCode'
import { useControls, ControlPanel, CodeBlock, StateDisplay } from '../../components'
import { TXB_STATES } from './states'
import { buildSepoliaFlow, buildSepoliaFlowSnippet } from './sepoliaFlows'
import FaucetWarning from './FaucetWarning'


const FlowStateVisualizer = () => {
  const entry = useFlowState()
  const flow = entry?.flow
  const currentStatus = flow?.steps[flow.currentStepIndex]?.status ?? 'pending'
  return <StateDisplay states={TXB_STATES} currentState={currentStatus} />
}

const InteractiveTransactionButton = () => {
  const { address } = useAccount()

  const { values, entries, isDefault, reset } = useControls({
    label: { type: 'string', default: 'Run flow' },
    stepsCount: { type: 'number', default: 1, min: 1, max: 5, step: 1 },
    safetyDelayMs: { type: 'number', default: 0, min: 0, max: 10000, step: 1000 },
    simulate: { type: 'boolean', default: true },
    warnMaxApproval: { type: 'boolean', default: true },
    showExplorerLink: { type: 'boolean', default: true },
    showSteps: { type: 'boolean', default: true },
    showProgress: { type: 'boolean', default: true },
    showToast: { type: 'boolean', default: true },
    disabled: { type: 'boolean', default: false },
  })

  const flow = useMemo(() => buildSepoliaFlow(values.stepsCount), [ values.stepsCount ])
  const stepsSnippet = useMemo(() => buildSepoliaFlowSnippet(values.stepsCount), [ values.stepsCount ])

  const code = useMemo(() => {
    const trailingJsx: string[] = []
    if (values.showSteps) {
      trailingJsx.push('<FlowSteps orientation="vertical" />')
    }
    if (values.showProgress) {
      trailingJsx.push('<FlowProgress showSummary summaryLabel="Overall Progress" />')
    }
    if (values.showToast) {
      trailingJsx.push('<FlowToast />')
    }

    return generateCode('TransactionButton', entries, {
      importLine: [
        "import { TransactionButton, FlowSteps, FlowProgress, FlowToast, txStep } from '@txkit/react'",
        "import { parseEther } from 'viem'",
        "import { sepolia } from 'viem/chains'",
      ].join('\n'),
      exclude: [ 'stepsCount', 'simulate', 'warnMaxApproval', 'safetyDelayMs', 'showSteps', 'showProgress', 'showToast' ],
      fixedProps: [ 'steps={steps}', 'chainId={sepolia.id}' ],
      prelude: stepsSnippet,
      trailingJsx,
    })
  }, [ entries, stepsSnippet, values.showSteps, values.showProgress, values.showToast ])

  return (
    <div className="story-live-layout">
      <div className="story-live-left">
        <FlowStateVisualizer />
        <FaucetWarning address={address} />
        <div className="story-live-preview-card">
          <div className="story-live-preview-inner">
            <TransactionButton
              key={values.stepsCount}
              steps={flow.steps}
              chainId={sepolia.id}
              label={values.label}
              description={flow.narrative}
              safety={{
                simulate: values.simulate,
                warnMaxApproval: values.warnMaxApproval,
                delayMs: values.safetyDelayMs,
              }}
              disabled={values.disabled}
              showExplorerLink={values.showExplorerLink}
            />
            {values.showProgress && <FlowProgress showSummary summaryLabel="Overall Progress" />}
            {values.showSteps && <FlowSteps orientation="vertical" />}
            {values.showToast && <FlowToast />}
          </div>
        </div>
        <CodeBlock code={code} />
      </div>
      <div className="story-live-right">
        <ControlPanel entries={entries} isDefault={isDefault} onReset={reset} />
      </div>
    </div>
  )
}


export default InteractiveTransactionButton
