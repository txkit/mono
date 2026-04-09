import React from 'react'

import type { ControlSchema } from '../../controls/useControls'
import useControls from '../../controls/useControls'
import ControlPanel from '../../controls/ControlPanel'
import CwMockButton from './CwMockButton'


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


export default CwStateMachineControls
