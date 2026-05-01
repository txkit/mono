import React from 'react'

import type { FieldProps } from '../ContractFormFields'


const StringField: React.FC<FieldProps> = (props) => {
  const { field, value, error, touched, disabled, helperIds, onChange, onBlur } = props

  return (
    <input
      id={`tx-cf-${field.name}`}
      className="tx-cf-input tx-cf-input--string"
      type="text"
      placeholder="..."
      value={value}
      disabled={disabled}
      aria-describedby={helperIds}
      aria-invalid={touched && Boolean(error)}
      onChange={(event) => onChange(field.name, event.target.value)}
      onBlur={() => onBlur(field.name)}
    />
  )
}


export default StringField
