import React from 'react'

import StateInput from './StateInput'
import type { ControlEntry } from './useControls'


type ControlStateItemProps = {
  entry: ControlEntry
}

const ControlStateItem: React.FC<ControlStateItemProps> = ({ entry }) => (
  <div className="control-item control-item--full">
    <label className="control-label">{entry.key}</label>
    <StateInput entry={entry} />
  </div>
)


export default ControlStateItem
