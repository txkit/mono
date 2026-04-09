import React from 'react'

import type { FieldProps } from './ContractFormFields'
import type { ContractFormLabels } from './labels'


const PayableValueField: React.FC<FieldProps & { labels: ContractFormLabels }> = ({
  field, value, error, touched, disabled, labels, onChange, onBlur,
}) => (
  <div className="txkit-cf-field" data-type="value">
    <label className="txkit-cf-label" htmlFor={`txkit-cf-${field.name}`}>
      {labels.payableValue}
    </label>
    <input
      id={`txkit-cf-${field.name}`}
      className="txkit-cf-input"
      type="text"
      inputMode="decimal"
      placeholder="0.0"
      value={value}
      disabled={disabled}
      aria-describedby={`txkit-cf-${field.name}-hint txkit-cf-${field.name}-error`}
      aria-invalid={touched && Boolean(error)}
      onChange={(event) => onChange(field.name, event.target.value)}
      onBlur={() => onBlur(field.name)}
    />
    {
      touched && error && (
        <span
          id={`txkit-cf-${field.name}-error`}
          className="txkit-cf-error"
          role="alert"
        >
          {error}
        </span>
      )
    }
  </div>
)


export default PayableValueField
