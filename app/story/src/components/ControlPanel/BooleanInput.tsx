import React from 'react'

import { cx } from '@txkit/core'

import type { ControlEntry } from './useControls'


const BooleanInput: React.FC<{ entry: ControlEntry }> = ({ entry }) => (
  <div className="control-toggle-group">
    <button
      type="button"
      aria-label={`${entry.key}: true`}
      className={cx('control-toggle-btn', { active: entry.value as boolean })}
      onClick={() => entry.setValue(true)}
    >
      true
    </button>
    <button
      type="button"
      aria-label={`${entry.key}: false`}
      className={cx('control-toggle-btn', { active: !(entry.value as boolean) })}
      onClick={() => entry.setValue(false)}
    >
      false
    </button>
  </div>
)


export default BooleanInput
