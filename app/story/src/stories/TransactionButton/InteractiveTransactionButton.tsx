import { useMemo } from 'react'
import { parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { TransactionButton, FlowProgress, FlowToast, txStep } from '@txkit/react'

import { VITALIK_ADDRESS } from '../../config'
import generateCode from '../../helpers/generateCode'
import { useControls, ControlPanel, CodeBlock } from '../../components'


const InteractiveTransactionButton = () => {
  const { values, entries, isDefault, reset } = useControls({
    label: { type: 'string', default: 'Send 0.001 ETH' },
    delayMs: { type: 'number', default: 0, min: 0, max: 15000, step: 1000 },
    confirmations: { type: 'number', default: 1, min: 1, max: 5, step: 1 },
    resetDelay: { type: 'number', default: 0, min: 0, max: 10000, step: 1000 },
    simulate: { type: 'boolean', default: true },
    warnMaxApproval: { type: 'boolean', default: true },
    showExplorerLink: { type: 'boolean', default: true },
    disabled: { type: 'boolean', default: false },
  })

  const code = useMemo(() => generateCode('TransactionButton', entries, {
    importLine: "import { TransactionButton, txStep } from '@txkit/react'",
    exclude: [ 'delayMs', 'confirmations', 'resetDelay', 'simulate', 'warnMaxApproval' ],
  }), [ entries ])

  return (
    <div className="story-live-layout">
      <div className="story-live-left">
        <div className="story-live-preview-card">
          <div className="story-live-preview-inner">
            <TransactionButton
              steps={[
                txStep('send', 'Send ETH', {
                  to: VITALIK_ADDRESS,
                  value: parseEther('0.001'),
                }),
              ]}
              chainId={sepolia.id}
              label={values.label}
              confirmations={values.confirmations}
              resetDelay={values.resetDelay}
              safety={{
                simulate: values.simulate,
                delayMs: values.delayMs,
                warnMaxApproval: values.warnMaxApproval,
              }}
              disabled={values.disabled}
              showExplorerLink={values.showExplorerLink}
            />
            <FlowProgress showSummary summaryLabel="Overall Progress" />
            <FlowToast />
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
