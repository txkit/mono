import React, { type ChangeEvent } from 'react'

import type { FieldProps } from './ContractFormFields'


const BoolField: React.FC<FieldProps> = ({ field, value, disabled, onChange }) => (
  <label className="txkit-cf-checkbox-row">
    <input
      id={`txkit-cf-${field.name}`}
      className="txkit-cf-checkbox"
      type="checkbox"
      checked={value === 'true'}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.name, event.target.checked ? 'true' : 'false')}
    />
    <span className="txkit-cf-checkbox-label">
      {value === 'true' ? 'true' : 'false'}
    </span>
  </label>
)


export default BoolField
