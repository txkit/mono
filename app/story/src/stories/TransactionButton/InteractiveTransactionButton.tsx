import { parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { TransactionButton, txStep } from '@txkit/react'

import { VITALIK_ADDRESS } from '../../config'
import { useControls, ControlPanel } from '../../components'


const InteractiveTransactionButton = () => {
  const { values, entries, reset } = useControls({
    label: { type: 'string', default: 'Send 0.001 ETH' },
    delayMs: { type: 'number', default: 0, min: 0, max: 15000, step: 1000 },
    showExplorerLink: { type: 'boolean', default: true },
    disabled: { type: 'boolean', default: false },
  })

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card">
        <TransactionButton
          steps={[
            txStep('send', 'Send ETH', {
              to: VITALIK_ADDRESS,
              value: parseEther('0.001'),
            }),
          ]}
          chainId={sepolia.id}
          label={values.label}
          safety={{ delayMs: values.delayMs }}
          showExplorerLink={values.showExplorerLink}
          disabled={values.disabled}
        />
      </div>
    </>
  )
}


export default InteractiveTransactionButton
