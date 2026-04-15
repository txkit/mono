import { useState } from 'react'
// ContractForm is deferred to v0.2.0 - not exported from @txkit/react public API.
// Story imports from source path directly so we can iterate on the component
// internally without committing to a frozen v0.1.0 surface.
import ContractForm from '@txkit/react/components/ContractForm/ContractForm'

import { USDC_ADDRESS } from '../../config'
import SAMPLE_ABI from './sampleAbi'
import { useControls, ControlPanel } from '../../components'


const CfLiveTab = () => {
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
    <>
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
    </>
  )
}


export default CfLiveTab
