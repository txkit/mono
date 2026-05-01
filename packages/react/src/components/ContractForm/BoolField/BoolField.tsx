import React, { type ChangeEvent } from 'react'

import type { FieldProps } from '../ContractFormFields'


const BoolField: React.FC<FieldProps> = ({ field, value, disabled, onChange }) => (
  <label className="tx-cf-checkbox-row">
    <input
      id={`tx-cf-${field.name}`}
      className="tx-cf-checkbox"
      type="checkbox"
      checked={value === 'true'}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.name, event.target.checked ? 'true' : 'false')}
    />
    <span className="tx-cf-checkbox-label">
      {value === 'true' ? 'true' : 'false'}
    </span>
  </label>
)


export default BoolField
