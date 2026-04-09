import React from 'react'

import type { FieldProps } from './ContractFormFields'


const BytesField: React.FC<FieldProps> = ({ field, value, error, touched, disabled, onChange, onBlur }) => {
  const isFixed = field.fieldType === 'bytesN'

  if (isFixed) {
    return (
      <input
        id={`txkit-cf-${field.name}`}
        className="txkit-cf-input"
        type="text"
        placeholder="0x..."
        maxLength={2 + (field.byteLength ?? 0) * 2}
        value={value}
        disabled={disabled}
        aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
        aria-invalid={touched && Boolean(error)}
        aria-required
        onChange={(event) => onChange(field.name, event.target.value)}
        onBlur={() => onBlur(field.name)}
      />
    )
  }

  return (
    <textarea
      id={`txkit-cf-${field.name}`}
      className="txkit-cf-input txkit-cf-input--textarea"
      placeholder="0x..."
      rows={3}
      value={value}
      disabled={disabled}
      aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
      aria-invalid={touched && Boolean(error)}
      aria-required
      onChange={(event) => onChange(field.name, event.target.value)}
      onBlur={() => onBlur(field.name)}
    />
  )
}


export default BytesField
