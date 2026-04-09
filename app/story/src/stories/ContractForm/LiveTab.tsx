import { useState } from 'react'
import {
  TxKitProvider,
  ContractForm,
} from '@txkit/react'

import useControls from '../../controls/useControls'
import ControlPanel from '../../controls/ControlPanel'
import { USDC_ADDRESS } from '../../config'
import SAMPLE_ABI from './sampleAbi'


const CfLiveTab = ({ config }: { config: TxKit.Config }) => {
  const { values, entries, reset } = useControls({
    functionName: {
      type: 'select' as const,
      default: 'transfer',
      options: [ 'transfer', 'approve', 'setApprovalForAll', 'multicall', 'registerUser' ],
    },
    label: { type: 'string' as const, default: '' },
    disabled: { type: 'boolean' as const, default: false },
  })

  const [ lastResult, setLastResult ] = useState<string>('')

  return (
    <TxKitProvider config={config}>
      <p className="story-description">Live ContractForm with configurable props</p>
      <ControlPanel entries={entries} onReset={reset} />
      <ContractForm
        address={USDC_ADDRESS}
        abi={SAMPLE_ABI}
        functionName={values.functionName}
        label={values.label || undefined}
        disabled={values.disabled}
        onSuccess={(receipt) => setLastResult(`Confirmed: ${receipt.transactionHash}`)}
        onError={(error) => setLastResult(`Error: ${error.message}`)}
      />
      {
        lastResult && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>{lastResult}</div>
        )
      }
    </TxKitProvider>
  )
}


export default CfLiveTab
