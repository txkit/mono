import React from 'react'

import { cx } from '@txkit/core'

import type { ControlEntry } from './useControls'


const BooleanInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => (
  <button
    type="button"
    aria-label={`${entry.key}: ${entry.value ? 'true' : 'false'}`}
    className={cx('control-toggle', { active: entry.value as boolean })}
    onClick={() => entry.setValue(!entry.value)}
  >
    {entry.value ? 'true' : 'false'}
  </button>
)


export default BooleanInput
