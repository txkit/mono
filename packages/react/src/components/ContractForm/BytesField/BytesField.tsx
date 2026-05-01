import React from 'react'

import type { FieldProps } from '../ContractFormFields'


const BytesField: React.FC<FieldProps> = (props) => {
  const { field, value, error, touched, disabled, helperIds, onChange, onBlur } = props
  const isFixed = field.fieldType === 'bytesN'

  if (isFixed) {
    return (
      <input
        id={`tx-cf-${field.name}`}
        className="tx-cf-input"
        type="text"
        placeholder="0x..."
        maxLength={2 + (field.byteLength ?? 0) * 2}
        value={value}
        disabled={disabled}
        aria-describedby={helperIds}
        aria-invalid={touched && Boolean(error)}
        onChange={(event) => onChange(field.name, event.target.value)}
        onBlur={() => onBlur(field.name)}
      />
    )
  }

  return (
    <textarea
      id={`tx-cf-${field.name}`}
      className="tx-cf-input tx-cf-input--textarea"
      placeholder="0x..."
      rows={3}
      value={value}
      disabled={disabled}
      aria-describedby={helperIds}
      aria-invalid={touched && Boolean(error)}
      onChange={(event) => onChange(field.name, event.target.value)}
      onBlur={() => onBlur(field.name)}
    />
  )
}


export default BytesField
