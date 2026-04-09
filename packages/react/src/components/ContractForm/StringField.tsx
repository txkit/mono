import React from 'react'

import type { FieldProps } from './ContractFormFields'


const StringField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => (
  <input
    id={`txkit-cf-${field.name}`}
    className="txkit-cf-input txkit-cf-input--string"
    type="text"
    placeholder="..."
    value={value}
    disabled={disabled}
    aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
    aria-invalid={touched && Boolean(error)}
    aria-required
    onChange={(event) => onChange(field.name, event.target.value)}
    onBlur={() => onBlur(field.name)}
  />
)


export default StringField
